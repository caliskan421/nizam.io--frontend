import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ADMIN,
  COORD,
  errorEnvelope,
  harness,
  http,
  HttpResponse,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../model/__tests__/harness'
import { downloadPath, redeemAndSave, useArchiveDownload } from './downloads'

const created: Blob[] = []
const revoked: string[] = []
let clicked: string[] = []

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  created.length = 0
  revoked.length = 0
  clicked = []
  Object.assign(URL, {
    createObjectURL: (blob: Blob) => {
      created.push(blob)
      return `blob:${created.length}`
    },
    revokeObjectURL: (url: string) => revoked.push(url),
  })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    clicked.push(this.download)
  })
})
afterEach(() => {
  resetHarness()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

const target = { programId: 'p1', departmentId: 'd7' }
const ticketOk = (path = '/v1/downloads/tk_1') =>
  http.post(`${ORIGIN}/v1/download-tickets`, () =>
    json({ ticket: 'tk_1', url: path, expires_at: '2026-11-12T12:01:00Z' }, 201),
  )
const zip = (headers: HeadersInit = {}) =>
  http.get(`${ORIGIN}/v1/downloads/tk_1`, () =>
    HttpResponse.arrayBuffer(new Uint8Array([80, 75]).buffer, {
      headers: { 'Content-Type': 'application/zip', ...headers },
    }),
  )

describe('bilet hedefleri (kapalı liste)', () => {
  it('tek dosya, klasör ZIP, dönem ZIP yolları; seçim ZIP kullanılmaz', () => {
    expect(downloadPath({ target, kind: 'file', id: 'f 1', fallbackName: 'a' })).toBe(
      '/v1/files/f%201/download',
    )
    expect(downloadPath({ target, kind: 'folder', id: 'd7', fallbackName: 'a' })).toBe(
      '/v1/records/archive/folders/d7/download-zip',
    )
    expect(downloadPath({ target, kind: 'period', fallbackName: 'a' })).toBe(
      '/v1/records/archive/period/download-zip',
    )
  })
})

describe('issueDownloadTicket → redeemDownloadTicket', () => {
  it('klasör ZIP: bilet S3 başlıklarıyla (yöneticide klasör) üretilir, hemen tüketilir, kaydedilir', async () => {
    server.use(
      ticketOk(),
      zip({ 'Content-Disposition': `attachment; filename*=UTF-8''klas%C3%B6r.zip` }),
    )
    const h = harness(ADMIN)
    const { result } = h.run(() => useArchiveDownload())
    const done = await result.start({
      target,
      kind: 'folder',
      id: 'd7',
      fallbackName: 'klasor.zip',
    })
    expect(done).toEqual({ kind: 'saved', fileName: 'klasör.zip' })
    const [issue] = sent('POST', '/v1/download-tickets')
    expect(issue!.body).toEqual({
      method: 'GET',
      path: '/v1/records/archive/folders/d7/download-zip',
    })
    expect(issue!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(issue!.headers.get('X-Nizamio-Department')).toBe('d7')
    expect(issue!.headers.get('X-Requested-With')).toBeTruthy()
    // Bilet tüketimi S0: Authorization/kapsam başlığı taşımaz.
    const [redeem] = sent('GET', '/v1/downloads/tk_1')
    expect(redeem!.headers.get('X-Nizamio-Department')).toBeNull()
    expect(clicked).toEqual(['klasör.zip'])
    expect(revoked).toEqual(['blob:1'])
  })

  it('dönem ZIP ve tek dosya aynı akıştan; ad yoksa yedek ad', async () => {
    server.use(ticketOk(), zip())
    const h = harness(ADMIN)
    const { result } = h.run(() => useArchiveDownload())
    expect(await result.start({ target, kind: 'period', fallbackName: 'donem.zip' })).toEqual({
      kind: 'saved',
      fileName: 'donem.zip',
    })
    expect(sent('POST', '/v1/download-tickets')[0]!.body).toEqual({
      method: 'GET',
      path: '/v1/records/archive/period/download-zip',
    })
    await result.start({ target, kind: 'file', id: 'f1', fallbackName: 'rapor.pdf' })
    expect(sent('POST', '/v1/download-tickets')[1]!.body).toEqual({
      method: 'GET',
      path: '/v1/files/f1/download',
    })
  })

  it('bilet bellekte kalmaz: mutasyon önbelleği boşalır', async () => {
    server.use(ticketOk(), zip())
    const h = harness(COORD)
    const { result } = h.run(() => useArchiveDownload())
    await result.start({ target, kind: 'file', id: 'f1', fallbackName: 'a.pdf' })
    await vi.waitFor(() =>
      expect(
        h.queryClient
          .getMutationCache()
          .getAll()
          .some((m) => JSON.stringify(m.state.data ?? null).includes('tk_1')),
      ).toBe(false),
    )
  })
})

describe('hatalar (otomatik tekrar yok)', () => {
  it('üretimde 422 identity.download_target_invalid: bilet tüketilmez', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, () =>
        errorEnvelope('identity.download_target_invalid', 422),
      ),
    )
    const h = harness(COORD)
    const { result } = h.run(() => useArchiveDownload())
    const done = await result.start({ target, kind: 'file', id: 'f1', fallbackName: 'a' })
    expect(done.kind).toBe('ticket_failed')
    if (done.kind === 'ticket_failed' && done.outcome.kind === 'failed') {
      expect(done.outcome.error.code).toBe('identity.download_target_invalid')
    }
    expect(sent('GET', '/v1/downloads/tk_1')).toHaveLength(0)
  })

  it('üretimde 429 (16 açık bilet): Retry-After olgusu, tek istek', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, () => {
        calls += 1
        return errorEnvelope('platform.rate_limited', 429, { 'Retry-After': '60' })
      }),
    )
    const h = harness(COORD)
    const { result } = h.run(() => useArchiveDownload())
    const done = await result.start({ target, kind: 'file', id: 'f1', fallbackName: 'a' })
    expect(done).toMatchObject({
      kind: 'ticket_failed',
      outcome: { kind: 'rate_limited', retryAfter: 60 },
    })
    expect(calls).toBe(1)
  })

  it.each([
    ['records.too_many_files', 422, null],
    ['records.too_large', 422, null],
    ['records.busy', 429, 7],
    ['platform.rate_limited', 429, 30],
    ['records.not_authorized', 403, null],
    ['records.file_not_found', 404, null],
    ['identity.download_ticket_invalid', 404, null],
  ])(
    'tüketimde %s (%i): sınıflandırılmış hata; ikinci istek yok',
    async (code, status, retryAfter) => {
      let redeems = 0
      server.use(
        ticketOk(),
        http.get(`${ORIGIN}/v1/downloads/tk_1`, () => {
          redeems += 1
          return errorEnvelope(
            code,
            status,
            retryAfter === null ? {} : { 'Retry-After': String(retryAfter) },
          )
        }),
      )
      const h = harness(ADMIN)
      const { result } = h.run(() => useArchiveDownload())
      const done = await result.start({ target, kind: 'folder', id: 'd7', fallbackName: 'k.zip' })
      expect(done.kind).toBe('failed')
      if (done.kind === 'failed') {
        expect(done.error.code).toBe(code)
        expect(done.retryAfter).toBe(retryAfter)
      }
      expect(redeems).toBe(1)
      expect(created).toHaveLength(0)
      expect(clicked).toEqual([])
    },
  )

  it('ağ kopması: failed (kaydedilmez)', async () => {
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () => HttpResponse.error()),
    )
    const h = harness(COORD)
    const { result } = h.run(() => useArchiveDownload())
    const done = await result.start({ target, kind: 'file', id: 'f1', fallbackName: 'a' })
    expect(done.kind).toBe('failed')
    expect(clicked).toEqual([])
  })

  it('sözleşme dışı bilet yolu tüketilmez', async () => {
    const done = await redeemAndSave('https://kotu.example/x', 'a.zip')
    expect(done).toMatchObject({ kind: 'failed', error: { code: 'client.invalid_response' } })
    expect(sent('GET', '/x')).toHaveLength(0)
  })
})

describe('sahip sökülürse', () => {
  it('bilet beklenirken sahip sökülürse bilet TÜKETİLMEZ (disposed)', async () => {
    let release!: () => void
    let started!: () => void
    const open = new Promise<void>((resolve) => {
      release = resolve
    })
    const hit = new Promise<void>((resolve) => {
      started = resolve
    })
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, async () => {
        started()
        await open
        return json({ ticket: 'tk_1', url: '/v1/downloads/tk_1', expires_at: 'x' }, 201)
      }),
      zip(),
    )
    const h = harness(COORD)
    const { result, app } = h.run(() => useArchiveDownload())
    const pending = result.start({ target, kind: 'file', id: 'f1', fallbackName: 'a' })
    await hit
    app.unmount()
    release()
    expect(await pending).toEqual({ kind: 'disposed' })
    expect(sent('GET', '/v1/downloads/tk_1')).toHaveLength(0)
    expect(clicked).toEqual([])
  })
})
