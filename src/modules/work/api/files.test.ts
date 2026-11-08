import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { isValidIdempotencyKey } from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../model/__tests__/harness'
import {
  attachFileForm,
  useAttachFile,
  useDeleteFile,
  useDownloadTicket,
  useRenameFile,
} from './files'

// Tarayıcıda `structuredClone(File)` yine `File` döndürür; jsdom'un `File`'ı Node'un
// `structuredClone`'undan jsdom `FormData`'sının kabul etmediği bir nesne olarak çıkar. Yazma
// motoru gövdeyi dondururken (`freezeVars`) tarayıcı davranışı korunsun: Blob değişmezdir,
// aynen taşınır; geri kalan derin kopya Node'un özgün işleviyle.
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

const target = { programId: 'p1', departmentId: 'd2' }
const ref = { target, workItemId: 'w1' }
const record = {
  file_id: 'f1',
  work_item_id: 'w1',
  display_name: 'rapor.pdf',
  content_type: 'application/pdf',
  size_bytes: 3,
  tag: 'sonuc',
}

describe('dosya yazmaları', () => {
  it('attachFile: multipart, tag + subtask_id sorguda, IK; dosyalar + görev yeniden okunur', async () => {
    server.use(http.post(`${ORIGIN}/v1/work-items/w1/files`, () => json(record, 201)))
    const h = harness(COORD_SCOPE)
    const scope = h.store.snapshot
    const files = queryKeys.workItems.files(scope, 'w1')
    const item = queryKeys.workItems.item(scope, 'w1')
    const list = queryKeys.workItems.list(scope, { department: 'd1' })
    for (const key of [files, item, list]) h.queryClient.setQueryData(key, { seeded: true })
    const attach = h.run(() => useAttachFile())
    const file = new File(['abc'], 'rapor.pdf', { type: 'application/pdf' })
    const outcome = await attach.submit({ ...ref, file, tag: 'sonuc', subtaskId: 's1' })

    expect(outcome.kind).toBe('success')
    const [req] = sent('POST', '/v1/work-items/w1/files')
    expect(req!.query.get('tag')).toBe('sonuc')
    expect(req!.query.get('subtask_id')).toBe('s1')
    expect(req!.headers.get('content-type')).toMatch(/^multipart\/form-data; boundary=/)
    expect(isValidIdempotencyKey(req!.headers.get('Idempotency-Key') ?? '')).toBe(true)
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(h.queryClient.getQueryState(files)?.isInvalidated).toBe(true)
    expect(h.queryClient.getQueryState(item)?.isInvalidated).toBe(true)
    // Yükleme görev durumunu değiştirmez: liste yazma sonrası yeniden okunmaz.
    expect(h.queryClient.getQueryState(list)?.isInvalidated).toBe(false)
  })

  it('subtask_id yoksa sorguda da yok; çok parçalı gövde dosya adını taşır', () => {
    const blob = new Blob(['x'], { type: 'text/plain' })
    const form = attachFileForm({ ...ref, file: blob, fileName: 'not.txt', tag: 'girdi' })
    const part = form.get('file')
    expect(part).toBeInstanceOf(File)
    expect((part as File).name).toBe('not.txt')
  })

  it('renameFile / deleteFile: görev kapsamı, dosyalar (03/03c/06 ortak anahtar) yeniden okunur', async () => {
    server.use(
      http.patch(`${ORIGIN}/v1/files/f1/name`, () => json(record)),
      http.delete(`${ORIGIN}/v1/files/f1`, () => new Response(null, { status: 204 })),
    )
    const h = harness(ADMIN_SCOPE)
    const files = queryKeys.workItems.files(h.store.snapshot, 'w1')
    h.queryClient.setQueryData(files, { seeded: true })
    const rename = h.run(() => useRenameFile())
    const remove = h.run(() => useDeleteFile())
    expect((await rename.submit({ ...ref, fileId: 'f1', displayName: 'yeni.pdf' })).kind).toBe(
      'success',
    )
    expect(h.queryClient.getQueryState(files)?.isInvalidated).toBe(true)
    expect(sent('PATCH', '/v1/files/f1/name')[0]!.body).toEqual({ display_name: 'yeni.pdf' })
    expect((await remove.submit({ ...ref, fileId: 'f1' })).kind).toBe('success')
    const [del] = sent('DELETE', '/v1/files/f1')
    expect(del!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(del!.headers.get('X-Nizamio-Department')).toBe('d2')
  })

  it('indirme bileti: S1 uç, görevin kapsamı bilete yazılır; hedef downloadFile yolu', async () => {
    const ticket = { ticket: 't1', url: '/v1/downloads/t1', expires_at: '2026-11-09T00:01:00Z' }
    server.use(http.post(`${ORIGIN}/v1/download-tickets`, () => json(ticket, 201)))
    const h = harness(ADMIN_SCOPE)
    const issue = h.run(() => useDownloadTicket())
    const outcome = await issue.submit({ ...ref, fileId: 'f1' })
    expect(outcome).toMatchObject({ kind: 'success', data: ticket })
    const [req] = sent('POST', '/v1/download-tickets')
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(req!.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(req!.body).toEqual({ method: 'GET', path: '/v1/files/f1/download' })
  })
})
