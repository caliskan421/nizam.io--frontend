import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { isValidIdempotencyKey } from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'

import {
  ADMIN,
  COORD,
  errorEnvelope,
  fileRecord,
  harness,
  http,
  HttpResponse,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../model/__tests__/harness'
import {
  archiveFileForm,
  fileGone,
  useAttachArchiveFile,
  useDeleteArchiveFile,
  useRenameArchiveFile,
} from './writes'

// `structuredClone(File)` jsdom'da yazma motorunun gövde dondurmasına takılır: tarayıcı
// davranışı (Blob değişmez, aynen taşınır) korunur.
const nativeClone = globalThis.structuredClone
function browserLikeClone(value: unknown): unknown {
  if (value instanceof Blob) return value
  if (Array.isArray(value)) return value.map(browserLikeClone)
  if (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, browserLikeClone(v)]))
  }
  return nativeClone(value)
}

beforeAll(() => {
  vi.stubGlobal('structuredClone', browserLikeClone)
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => resetHarness())
afterAll(() => {
  vi.unstubAllGlobals()
  server.close()
})

const target = { programId: 'p1', departmentId: 'd7' }
const ref = { target, workItemId: 'w1', fileId: 'f1' }
const file = () => new File(['abc'], 'rapor.pdf', { type: 'application/pdf' })

/** Yazmanın geçersizlemesi: arşiv (yönetici anahtarı dahil), görevin dosyaları ve ayrıntısı. */
function seed(h: ReturnType<typeof harness>) {
  const scope = h.store.snapshot
  const adminKey = queryKeys.archive.list({ ...scope, departmentId: 'd7' }, 'attachments', {
    work_item_id: 'w1',
  })
  const foldersKey = queryKeys.archive.list({ ...scope, departmentId: 'd7' }, 'folders', {})
  const files = queryKeys.workItems.files(scope, 'w1')
  const item = queryKeys.workItems.item(scope, 'w1')
  const list = queryKeys.workItems.list(scope, { department: 'd1' })
  const foreignProgram = queryKeys.archive.list(
    { programId: 'p2', departmentId: 'd7', lens: 'admin' },
    'folders',
    {},
  )
  for (const key of [adminKey, foldersKey, files, item, list, foreignProgram]) {
    h.queryClient.setQueryData(key, { seeded: true })
  }
  const stale = (key: readonly unknown[]) => h.queryClient.getQueryState(key)?.isInvalidated
  return { adminKey, foldersKey, files, item, list, foreignProgram, stale }
}

describe('attachFile', () => {
  it('multipart + tag/subtask_id sorguda + eylem başına Idempotency-Key; başlık görevin departmanı', async () => {
    server.use(http.post(`${ORIGIN}/v1/work-items/w1/files`, () => json(fileRecord, 201)))
    const h = harness(ADMIN)
    const keys = seed(h)
    const { result: attach } = h.run(() => useAttachArchiveFile())
    const outcome = await attach.submit({
      target,
      workItemId: 'w1',
      file: file(),
      tag: 'sonuc',
      subtaskId: 's1',
    })
    expect(outcome.kind).toBe('success')
    const [req] = sent('POST', '/v1/work-items/w1/files')
    expect(req!.query.get('tag')).toBe('sonuc')
    expect(req!.query.get('subtask_id')).toBe('s1')
    expect(req!.headers.get('content-type')).toMatch(/^multipart\/form-data; boundary=/)
    expect(isValidIdempotencyKey(req!.headers.get('Idempotency-Key') ?? '')).toBe(true)
    expect(req!.headers.get('X-Requested-With')).toBeTruthy()
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d7')
    // KESİN 29: arşiv (yönetici klasör anahtarı dahil), görevin dosyaları ve ayrıntısı yenilenir.
    expect(keys.stale(keys.adminKey)).toBe(true)
    expect(keys.stale(keys.foldersKey)).toBe(true)
    expect(keys.stale(keys.files)).toBe(true)
    expect(keys.stale(keys.item)).toBe(true)
    // Görev durumu değişmez: liste yeniden okunmaz; başka programın arşivi de değil (K2).
    expect(keys.stale(keys.list)).toBe(false)
    expect(keys.stale(keys.foreignProgram)).toBe(false)
  })

  it('subtask_id yoksa sorguda yok; her eylem yeni anahtar', async () => {
    server.use(http.post(`${ORIGIN}/v1/work-items/w1/files`, () => json(fileRecord, 201)))
    const h = harness(COORD)
    const { result: attach } = h.run(() => useAttachArchiveFile())
    await attach.submit({ target, workItemId: 'w1', file: file(), tag: 'girdi' })
    await attach.submit({ target, workItemId: 'w1', file: file(), tag: 'girdi' })
    const calls = sent('POST', '/v1/work-items/w1/files')
    expect(calls[0]!.query.has('subtask_id')).toBe(false)
    expect(calls[0]!.headers.get('Idempotency-Key')).not.toBe(
      calls[1]!.headers.get('Idempotency-Key'),
    )
  })

  it('çok parçalı gövde dosya adını taşır (File değilse fileName)', () => {
    const form = archiveFileForm({
      target,
      workItemId: 'w1',
      file: new Blob(['x'], { type: 'text/plain' }),
      fileName: 'not.txt',
      tag: 'plan',
    })
    expect((form.get('file') as File).name).toBe('not.txt')
  })

  it('sonuç bilinmiyor: AYNI anahtarla TEK izinli tekrar; ikincisi de belirsizse yeniden okuma + tekrar kapanır', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}/v1/work-items/w1/files`, () => {
        calls += 1
        if (calls <= 2) return errorEnvelope('platform.internal', 503)
        return json(fileRecord, 200)
      }),
    )
    const h = harness(COORD)
    const keys = seed(h)
    const { result: attach } = h.run(() => useAttachArchiveFile())
    const first = await attach.submit({ target, workItemId: 'w1', file: file(), tag: 'sonuc' })
    expect(first.kind).toBe('unknown_outcome')
    if (first.kind !== 'unknown_outcome') return
    expect(first.retry).not.toBeNull()
    const second = await first.retry!()
    expect(second.kind).toBe('unknown_outcome')
    if (second.kind !== 'unknown_outcome') return
    // Üçüncü kör gönderim yok.
    expect(second.retry).toBeNull()
    const [a, b] = sent('POST', '/v1/work-items/w1/files')
    expect(a!.headers.get('Idempotency-Key')).toBe(b!.headers.get('Idempotency-Key'))
    expect(calls).toBe(2)
    expect(keys.stale(keys.files)).toBe(true)
  })

  it('tek tekrar başarılıysa (200) aynı anahtar ve sonuç success', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}/v1/work-items/w1/files`, () => {
        calls += 1
        return calls === 1 ? errorEnvelope('platform.internal', 503) : json(fileRecord, 200)
      }),
    )
    const h = harness(COORD)
    const { result: attach } = h.run(() => useAttachArchiveFile())
    const first = await attach.submit({ target, workItemId: 'w1', file: file(), tag: 'sonuc' })
    if (first.kind !== 'unknown_outcome') throw new Error('beklenen: unknown_outcome')
    const next = await first.retry!()
    expect(next.kind).toBe('success')
    const [a, b] = sent('POST', '/v1/work-items/w1/files')
    expect(a!.headers.get('Idempotency-Key')).toBe(b!.headers.get('Idempotency-Key'))
  })

  it.each([
    ['records.tag_required', 422],
    ['records.too_many_files', 422],
    ['records.too_large', 422],
    ['records.name_taken', 409],
    ['records.not_authorized', 403],
  ])('%s hata kodu olarak döner (sunucu iletisi gösterilmez)', async (code, status) => {
    server.use(http.post(`${ORIGIN}/v1/work-items/w1/files`, () => errorEnvelope(code, status)))
    const h = harness(COORD)
    const { result: attach } = h.run(() => useAttachArchiveFile())
    const outcome = await attach.submit({ target, workItemId: 'w1', file: file(), tag: 'sonuc' })
    expect(outcome.kind).toBe('failed')
    if (outcome.kind === 'failed') {
      expect(outcome.error.code).toBe(code)
      expect(JSON.stringify(outcome.error)).not.toContain('sunucu iletisi')
    }
  })

  it('429: Retry-After olgusu, otomatik tekrar yok', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}/v1/work-items/w1/files`, () => {
        calls += 1
        return errorEnvelope('platform.rate_limited', 429, { 'Retry-After': '12' })
      }),
    )
    const h = harness(COORD)
    const { result: attach } = h.run(() => useAttachArchiveFile())
    const outcome = await attach.submit({ target, workItemId: 'w1', file: file(), tag: 'sonuc' })
    expect(outcome).toMatchObject({ kind: 'rate_limited', retryAfter: 12 })
    expect(calls).toBe(1)
  })
})

describe('renameFile (anahtarsız, revizyonsuz)', () => {
  it('PATCH display_name; Idempotency-Key yok; arşiv + görevin dosyaları yenilenir, görev ayrıntısı değil', async () => {
    server.use(
      http.patch(`${ORIGIN}/v1/files/f1/name`, () =>
        json({ ...fileRecord, display_name: 'yeni.pdf' }),
      ),
    )
    const h = harness(ADMIN)
    const keys = seed(h)
    const { result: rename } = h.run(() => useRenameArchiveFile())
    const outcome = await rename.submit({ ...ref, displayName: 'yeni.pdf' })
    expect(outcome.kind).toBe('success')
    const [req] = sent('PATCH', '/v1/files/f1/name')
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(req!.body).toEqual({ display_name: 'yeni.pdf' })
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d7')
    expect(keys.stale(keys.adminKey)).toBe(true)
    expect(keys.stale(keys.files)).toBe(true)
    expect(keys.stale(keys.item)).toBe(false)
  })

  it.each([
    ['records.name_taken', 409],
    ['records.name_invalid', 422],
    ['records.not_authorized', 403],
  ])('%s alan hatası olarak döner', async (code, status) => {
    server.use(http.patch(`${ORIGIN}/v1/files/f1/name`, () => errorEnvelope(code, status)))
    const h = harness(COORD)
    const { result: rename } = h.run(() => useRenameArchiveFile())
    const outcome = await rename.submit({ ...ref, displayName: 'x' })
    expect(outcome.kind).toBe('failed')
    if (outcome.kind === 'failed') expect(outcome.error.code).toBe(code)
  })

  it('409 records.moved: liste yeniden okunur', async () => {
    server.use(http.patch(`${ORIGIN}/v1/files/f1/name`, () => errorEnvelope('records.moved', 409)))
    const h = harness(ADMIN)
    const keys = seed(h)
    const { result: rename } = h.run(() => useRenameArchiveFile())
    const outcome = await rename.submit({ ...ref, displayName: 'x' })
    expect(outcome.kind).toBe('failed')
    expect(keys.stale(keys.adminKey)).toBe(true)
  })

  it('sonuç bilinmiyor: kör tekrar YOK (retry düşer), tek yeniden okuma', async () => {
    let calls = 0
    server.use(
      http.patch(`${ORIGIN}/v1/files/f1/name`, () => {
        calls += 1
        return errorEnvelope('platform.internal', 503)
      }),
    )
    const h = harness(ADMIN)
    const keys = seed(h)
    const { result: rename } = h.run(() => useRenameArchiveFile())
    const outcome = await rename.submit({ ...ref, displayName: 'x' })
    expect(outcome.kind).toBe('unknown_outcome')
    if (outcome.kind === 'unknown_outcome') expect(outcome.retry).toBeNull()
    expect(calls).toBe(1)
    expect(keys.stale(keys.adminKey)).toBe(true)
    expect(keys.stale(keys.files)).toBe(true)
  })
})

describe('deleteFile (kalıcı, 204)', () => {
  it('DELETE anahtarsız; arşiv, görevin dosyaları VE görev ayrıntısı (kanıt) yenilenir', async () => {
    server.use(http.delete(`${ORIGIN}/v1/files/f1`, () => new HttpResponse(null, { status: 204 })))
    const h = harness(ADMIN)
    const keys = seed(h)
    const { result: remove } = h.run(() => useDeleteArchiveFile())
    const outcome = await remove.submit(ref)
    expect(outcome.kind).toBe('success')
    const [req] = sent('DELETE', '/v1/files/f1')
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d7')
    expect(keys.stale(keys.adminKey)).toBe(true)
    expect(keys.stale(keys.foldersKey)).toBe(true)
    expect(keys.stale(keys.files)).toBe(true)
    expect(keys.stale(keys.item)).toBe(true)
  })

  it('404 records.file_not_found: silinmiş say, listeyi yenile', async () => {
    server.use(
      http.delete(`${ORIGIN}/v1/files/f1`, () => errorEnvelope('records.file_not_found', 404)),
    )
    const h = harness(ADMIN)
    const keys = seed(h)
    const { result: remove } = h.run(() => useDeleteArchiveFile())
    const outcome = await remove.submit(ref)
    expect(fileGone(outcome)).toBe(true)
    expect(keys.stale(keys.adminKey)).toBe(true)
    expect(keys.stale(keys.files)).toBe(true)
  })

  it('403 records.not_authorized silinmiş sayılmaz', async () => {
    server.use(
      http.delete(`${ORIGIN}/v1/files/f1`, () => errorEnvelope('records.not_authorized', 403)),
    )
    const h = harness(COORD)
    const { result: remove } = h.run(() => useDeleteArchiveFile())
    const outcome = await remove.submit(ref)
    expect(outcome.kind).toBe('failed')
    expect(fileGone(outcome)).toBe(false)
  })

  it('sonuç bilinmiyor: kör tekrar yok, tek yeniden okuma', async () => {
    let calls = 0
    server.use(
      http.delete(`${ORIGIN}/v1/files/f1`, () => {
        calls += 1
        return errorEnvelope('platform.internal', 500)
      }),
    )
    const h = harness(ADMIN)
    const keys = seed(h)
    const { result: remove } = h.run(() => useDeleteArchiveFile())
    const outcome = await remove.submit(ref)
    expect(outcome.kind).toBe('unknown_outcome')
    if (outcome.kind === 'unknown_outcome') expect(outcome.retry).toBeNull()
    expect(calls).toBe(1)
    expect(keys.stale(keys.adminKey)).toBe(true)
  })
})
