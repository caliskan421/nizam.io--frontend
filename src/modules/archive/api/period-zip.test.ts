import { effectScope } from 'vue'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ADMIN,
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
import { periodZipTarget, usePeriodZipDownload } from './period-zip'

let clicked: string[] = []

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  clicked = []
  Object.assign(URL, { createObjectURL: () => 'blob:zip', revokeObjectURL: () => undefined })
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

const request = { programId: 'p1', includeReports: true, fallbackName: 'donem.zip' }
const ticketOk = () =>
  http.post(`${ORIGIN}/v1/download-tickets`, () =>
    json({ ticket: 'tk_1', url: '/v1/downloads/tk_1', expires_at: '2026-11-12T12:01:00Z' }, 201),
  )
const zip = (headers: HeadersInit = {}) =>
  http.get(`${ORIGIN}/v1/downloads/tk_1`, () =>
    HttpResponse.arrayBuffer(new Uint8Array([80, 75]).buffer, {
      headers: { 'Content-Type': 'application/zip', ...headers },
    }),
  )

describe('periodZipTarget (kapalı bilet listesi: programArchiveZip)', () => {
  it('S2 yolu + isteğe bağlı include_reports; başlık yalnız program', () => {
    expect(periodZipTarget(request)).toEqual({
      method: 'GET',
      path: '/v1/program/archive/download-zip?include_reports=true',
      headers: { 'X-Nizamio-Program': 'p1' },
      fallbackName: 'donem.zip',
    })
    // Parametresiz (eski düzen) yol: sorgu dizesi yok.
    expect(periodZipTarget({ ...request, includeReports: false }).path).toBe(
      '/v1/program/archive/download-zip',
    )
  })
})

describe('usePeriodZipDownload', () => {
  it('bilet program başlığıyla; Content-Disposition adı; kesme başlığı yoksa truncated yok', async () => {
    server.use(
      ticketOk(),
      zip({ 'Content-Disposition': `attachment; filename*=UTF-8''d%C3%B6nem.zip` }),
    )
    const h = harness(ADMIN)
    const { result } = h.run(() => usePeriodZipDownload())
    const done = await result.start(request)
    expect(done).toEqual({ kind: 'saved', fileName: 'dönem.zip' })
    const [issue] = sent('POST', '/v1/download-tickets')
    expect(issue!.body).toEqual({
      method: 'GET',
      path: '/v1/program/archive/download-zip?include_reports=true',
    })
    expect(issue!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(issue!.headers.get('X-Nizamio-Department')).toBeNull()
    expect(issue!.headers.get('X-Requested-With')).toBeTruthy()
    // Bilet tüketimi S0: kapsam başlığı taşımaz.
    expect(sent('GET', '/v1/downloads/tk_1')[0]!.headers.get('X-Nizamio-Program')).toBeNull()
    expect(clicked).toEqual(['dönem.zip'])
  })

  it('X-Result-Truncated: true → saved.truncated (gömülü rapor kesildi, BE-124)', async () => {
    server.use(ticketOk(), zip({ 'X-Result-Truncated': 'true' }))
    const h = harness(ADMIN)
    const { result } = h.run(() => usePeriodZipDownload())
    expect(await result.start(request)).toEqual({
      kind: 'saved',
      fileName: 'donem.zip',
      truncated: true,
    })
    // "false" ya da başlık yok → alan hiç yazılmaz.
    server.use(zip({ 'X-Result-Truncated': 'false' }))
    expect(await result.start(request)).toEqual({ kind: 'saved', fileName: 'donem.zip' })
  })

  // `Retry-After` yalnız 429'da çözülür (ortak hata katmanı); 503 ortak metne düşer.
  it.each([
    ['reporting.export_in_progress', 429, 12],
    ['reporting.capacity_full', 503, null],
    ['records.too_large', 422, null],
    ['records.busy', 429, 7],
    ['records.not_authorized', 403, null],
  ])('tüketimde %s (%i): sınıflı hata; ikinci istek yok', async (code, status, retryAfter) => {
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
    const { result } = h.run(() => usePeriodZipDownload())
    const done = await result.start(request)
    expect(done).toMatchObject({ kind: 'failed', error: { code }, retryAfter })
    expect(redeems).toBe(1)
    expect(clicked).toEqual([])
  })

  it('üretimde 429 (açık bilet tavanı): ticket_failed + Retry-After', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, () =>
        errorEnvelope('platform.rate_limited', 429, { 'Retry-After': '60' }),
      ),
    )
    const h = harness(ADMIN)
    const { result } = h.run(() => usePeriodZipDownload())
    expect(await result.start(request)).toMatchObject({
      kind: 'ticket_failed',
      outcome: { kind: 'rate_limited', retryAfter: 60 },
    })
  })

  it('sahip bilet beklerken sökülürse bilet TÜKETİLMEZ (disposed)', async () => {
    let release!: () => void
    let started!: () => void
    const open = new Promise<void>((resolve) => (release = resolve))
    const hit = new Promise<void>((resolve) => (started = resolve))
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, async () => {
        started()
        await open
        return json({ ticket: 'tk_1', url: '/v1/downloads/tk_1', expires_at: 'x' }, 201)
      }),
      zip(),
    )
    const h = harness(ADMIN)
    const { result } = h.run(() => {
      const owner = effectScope()
      return { download: owner.run(() => usePeriodZipDownload())!, owner }
    })
    const pending = result.download.start(request)
    await hit
    result.owner.stop()
    release()
    expect(await pending).toEqual({ kind: 'disposed' })
    expect(sent('GET', '/v1/downloads/tk_1')).toHaveLength(0)
    expect(clicked).toEqual([])
  })

  it('iptal sinyali (kapsam/oturum): bilet alınmadan iptal → disposed, istek yok', async () => {
    const h = harness(ADMIN)
    const { result } = h.run(() => usePeriodZipDownload())
    const controller = new AbortController()
    controller.abort()
    expect(await result.start(request, controller.signal)).toEqual({ kind: 'disposed' })
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(0)
  })
})
