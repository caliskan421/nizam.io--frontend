import { effectScope } from 'vue'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDownloadFlow } from './flow'
import type { DownloadTarget } from './types'
import {
  ADMIN,
  browserSave,
  errorEnvelope,
  harness,
  http,
  json,
  ORIGIN,
  pdf,
  resetHarness,
  sent,
  server,
  ticketOk,
} from './__tests__/harness'

let saved: ReturnType<typeof browserSave>

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  saved = browserSave()
})
afterEach(() => {
  resetHarness()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

const get: DownloadTarget = {
  method: 'GET',
  path: '/v1/reports/season/pdf',
  headers: { 'X-Nizamio-Program': 'p1' },
  fallbackName: 'donem-raporu.pdf',
}
const post: DownloadTarget = {
  method: 'POST',
  path: '/v1/reports/workload',
  body: { member_ids: ['a1', 'a2'] },
  headers: { 'X-Nizamio-Program': 'p1' },
  fallbackName: 'is-yuku-raporu.pdf',
}

describe('bilet akışı: GET ve POST gövdeli hedef', () => {
  it('GET hedefi: gövdede yalnız method+path; X-Requested-With + program başlığı; S0 tüketim', async () => {
    server.use(
      ticketOk(),
      pdf({ 'Content-Disposition': 'attachment; filename="donem-raporu-2026-11-13.pdf"' }),
    )
    const { result } = harness(ADMIN).run(() => useDownloadFlow<DownloadTarget>((t) => t))
    expect(await result.start(get)).toEqual({
      kind: 'saved',
      fileName: 'donem-raporu-2026-11-13.pdf',
    })
    const [issue] = sent('POST', '/v1/download-tickets')
    expect(issue!.body).toEqual({ method: 'GET', path: '/v1/reports/season/pdf' })
    expect(issue!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(issue!.headers.get('X-Nizamio-Department')).toBeNull()
    expect(issue!.headers.get('X-Requested-With')).toBeTruthy()
    // Sözleşme istemiyor: bilet isteğinde Idempotency-Key yok.
    expect(issue!.headers.get('Idempotency-Key')).toBeNull()
    expect(sent('GET', '/v1/downloads/tk_1')[0]!.headers.get('X-Nizamio-Program')).toBeNull()
    expect(saved.clicked).toEqual(['donem-raporu-2026-11-13.pdf'])
    expect(saved.revoked).toEqual(['blob:1'])
  })

  it('POST hedefi: gövde bilete aynen girer (member_ids); tüketim yine GET', async () => {
    server.use(ticketOk(), pdf())
    const { result } = harness(ADMIN).run(() => useDownloadFlow<DownloadTarget>((t) => t))
    expect(await result.start(post)).toEqual({ kind: 'saved', fileName: 'is-yuku-raporu.pdf' })
    expect(sent('POST', '/v1/download-tickets')[0]!.body).toEqual({
      method: 'POST',
      path: '/v1/reports/workload',
      body: { member_ids: ['a1', 'a2'] },
    })
    expect(sent('POST', '/v1/reports/workload')).toHaveLength(0)
  })

  it('seçim yokken açık boş dizi gider (boş olmayan JSON nesnesi)', async () => {
    server.use(ticketOk(), pdf())
    const { result } = harness(ADMIN).run(() => useDownloadFlow<DownloadTarget>((t) => t))
    await result.start({ ...post, body: { member_ids: [] } })
    expect(sent('POST', '/v1/download-tickets')[0]!.body).toMatchObject({
      body: { member_ids: [] },
    })
  })

  it('GET hedefinde verilen gövde gönderilmez', async () => {
    server.use(ticketOk(), pdf())
    const { result } = harness(ADMIN).run(() => useDownloadFlow<DownloadTarget>((t) => t))
    await result.start({ ...get, body: { x: 1 } })
    expect(sent('POST', '/v1/download-tickets')[0]!.body).toEqual({
      method: 'GET',
      path: '/v1/reports/season/pdf',
    })
  })

  it('Content-Disposition yalnız ASCII filename= (filename* yok) ya da yedek ad', async () => {
    server.use(
      ticketOk(),
      pdf({ 'Content-Disposition': 'attachment; filename="gorev-raporu-7f3a9c2e.pdf"' }),
    )
    const { result } = harness(ADMIN).run(() => useDownloadFlow<DownloadTarget>((t) => t))
    expect(await result.start({ ...get, fallbackName: 'gorev-raporu.pdf' })).toEqual({
      kind: 'saved',
      fileName: 'gorev-raporu-7f3a9c2e.pdf',
    })
    server.use(pdf())
    expect(await result.start({ ...get, fallbackName: 'gorev-raporu.pdf' })).toEqual({
      kind: 'saved',
      fileName: 'gorev-raporu.pdf',
    })
  })
})

describe('hata sınıflandırması (otomatik tekrar yok)', () => {
  it('bilet üretiminde 429 platform.rate_limited + Retry-After: ticket_failed, tek istek', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, () => {
        calls += 1
        return errorEnvelope('platform.rate_limited', 429, { 'Retry-After': '60' })
      }),
    )
    const { result } = harness(ADMIN).run(() => useDownloadFlow<DownloadTarget>((t) => t))
    expect(await result.start(get)).toMatchObject({
      kind: 'ticket_failed',
      outcome: { kind: 'rate_limited', retryAfter: 60 },
    })
    expect(calls).toBe(1)
    expect(sent('GET', '/v1/downloads/tk_1')).toHaveLength(0)
  })

  it('bilet üretiminde 422 identity.download_target_invalid: bilet tüketilmez', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, () =>
        errorEnvelope('identity.download_target_invalid', 422),
      ),
    )
    const { result } = harness(ADMIN).run(() => useDownloadFlow<DownloadTarget>((t) => t))
    const done = await result.start(get)
    expect(done).toMatchObject({ kind: 'ticket_failed', outcome: { kind: 'failed' } })
  })

  it.each([
    ['reporting.export_in_progress', 429, '1', 1],
    ['platform.rate_limited', 429, '30', 30],
    ['reporting.capacity_full', 503, null, null],
    ['reporting.not_authorized', 403, null, null],
    ['reporting.not_found', 404, null, null],
    ['reporting.input_invalid', 422, null, null],
    ['identity.download_ticket_invalid', 404, null, null],
    ['audit.entry_rejected', 500, null, null],
  ])('tüketimde %s (%i): failed + retryAfter; kaydedilmez', async (code, status, header, wait) => {
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () =>
        errorEnvelope(code, status, header === null ? {} : { 'Retry-After': header }),
      ),
    )
    const { result } = harness(ADMIN).run(() => useDownloadFlow<DownloadTarget>((t) => t))
    const done = await result.start(get)
    expect(done).toMatchObject({ kind: 'failed', error: { code }, retryAfter: wait })
    expect(sent('GET', '/v1/downloads/tk_1')).toHaveLength(1)
    expect(saved.created).toHaveLength(0)
    expect(saved.clicked).toEqual([])
  })
})

describe('iptal ve sahip yaşamı', () => {
  function gatedTicket() {
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
      pdf(),
    )
    return { release, hit }
  }

  it('bilet beklenirken sahip sökülürse bilet TÜKETİLMEZ (disposed)', async () => {
    const gate = gatedTicket()
    const { result } = harness(ADMIN).run(() => {
      const owner = effectScope()
      return { flow: owner.run(() => useDownloadFlow<DownloadTarget>((t) => t))!, owner }
    })
    const pending = result.flow.start(get)
    await gate.hit
    result.owner.stop()
    gate.release()
    expect(await pending).toEqual({ kind: 'disposed' })
    expect(sent('GET', '/v1/downloads/tk_1')).toHaveLength(0)
    expect(saved.clicked).toEqual([])
  })

  it('bilet beklenirken signal iptal edilirse bilet tüketilmez (disposed)', async () => {
    const gate = gatedTicket()
    const { result } = harness(ADMIN).run(() => useDownloadFlow<DownloadTarget>((t) => t))
    const controller = new AbortController()
    const pending = result.start(get, { signal: controller.signal })
    await gate.hit
    controller.abort()
    gate.release()
    expect(await pending).toEqual({ kind: 'disposed' })
    expect(sent('GET', '/v1/downloads/tk_1')).toHaveLength(0)
    expect(saved.clicked).toEqual([])
  })

  it('tüketim sürerken iptal: dosya kaydedilmez (disposed)', async () => {
    let release!: () => void
    let started!: () => void
    const open = new Promise<void>((resolve) => (release = resolve))
    const hit = new Promise<void>((resolve) => (started = resolve))
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, async () => {
        started()
        await open
        return new Response(new Uint8Array([37]), {
          headers: { 'Content-Type': 'application/pdf' },
        })
      }),
    )
    const { result } = harness(ADMIN).run(() => useDownloadFlow<DownloadTarget>((t) => t))
    const controller = new AbortController()
    const pending = result.start(get, { signal: controller.signal })
    await hit
    controller.abort()
    release()
    expect(await pending).toEqual({ kind: 'disposed' })
    expect(saved.clicked).toEqual([])
  })

  it('başlamadan iptal edilmiş sinyal: istek gitmez', async () => {
    const { result } = harness(ADMIN).run(() => useDownloadFlow<DownloadTarget>((t) => t))
    const controller = new AbortController()
    controller.abort()
    expect(await result.start(get, { signal: controller.signal })).toEqual({ kind: 'disposed' })
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(0)
  })

  it('bilet bellekte kalmaz: mutasyon önbelleği boşalır', async () => {
    server.use(ticketOk(), pdf())
    const h = harness(ADMIN)
    const { result } = h.run(() => useDownloadFlow<DownloadTarget>((t) => t))
    await result.start(get)
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
