import { effectScope } from 'vue'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { authSession } from '@/shared/http'
import { useToast } from '@/shared/ui'

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
} from '../__tests__/harness'
import { createReportGate } from '../model/gate'
import { useReportDownloads } from './downloads'

let saved: ReturnType<typeof browserSave>

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  saved = browserSave()
  useToast().clear()
})
afterEach(() => {
  resetHarness()
  vi.restoreAllMocks()
  if (authSession.snapshot.accountId) authSession.clear()
})
afterAll(() => server.close())

const setup = (selection = ADMIN) => {
  const gate = createReportGate()
  const h = harness(selection)
  const { result } = h.run(() => useReportDownloads(gate))
  return { gate, h, reports: result }
}

describe('dört PDF eylemi (bilet akışı; Idempotency-Key yok)', () => {
  it('dönem PDF: GET hedefi, program başlığı, ASCII Content-Disposition adıyla kaydedilir', async () => {
    server.use(
      ticketOk(),
      pdf({ 'Content-Disposition': 'attachment; filename="donem-raporu-2026-11-13.pdf"' }),
    )
    const { reports } = setup()
    expect(await reports.downloadSeasonPdf()).toEqual({
      kind: 'saved',
      fileName: 'donem-raporu-2026-11-13.pdf',
    })
    const [issue] = sent('POST', '/v1/download-tickets')
    expect(issue!.body).toEqual({ method: 'GET', path: '/v1/reports/season/pdf' })
    expect(issue!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(issue!.headers.get('X-Requested-With')).toBeTruthy()
    expect(issue!.headers.get('Idempotency-Key')).toBeNull()
    expect(saved.clicked).toEqual(['donem-raporu-2026-11-13.pdf'])
    expect(useToast().current.value?.message).toBe('donem-raporu-2026-11-13.pdf indirildi')
  })

  it('toplantı ve görev PDF: kayıt yolu; ad yoksa yedek ad', async () => {
    server.use(ticketOk(), pdf())
    const { reports } = setup()
    expect(await reports.downloadMeetingPdf('m1')).toEqual({
      kind: 'saved',
      fileName: 'toplanti-raporu.pdf',
    })
    expect(await reports.downloadTaskPdf('t 1')).toEqual({
      kind: 'saved',
      fileName: 'gorev-raporu.pdf',
    })
    const bodies = sent('POST', '/v1/download-tickets').map((r) => r.body)
    expect(bodies).toEqual([
      { method: 'GET', path: '/v1/reports/meetings/m1/pdf' },
      { method: 'GET', path: '/v1/reports/tasks/t%201/pdf' },
    ])
  })

  it('iş yükü PDF: POST gövdeli bilet hedefi; seçim yokken açık boş dizi', async () => {
    server.use(ticketOk(), pdf())
    const { reports } = setup()
    await reports.downloadWorkloadPdf(['a1', 'a2'])
    await reports.downloadWorkloadPdf()
    const bodies = sent('POST', '/v1/download-tickets').map((r) => r.body)
    expect(bodies).toEqual([
      { method: 'POST', path: '/v1/reports/workload', body: { member_ids: ['a1', 'a2'] } },
      { method: 'POST', path: '/v1/reports/workload', body: { member_ids: [] } },
    ])
    // Rapor ucu doğrudan çağrılmaz; yalnız bilet üzerinden.
    expect(sent('POST', '/v1/reports/workload')).toHaveLength(0)
  })

  it('program seçili değilse eylem yok (unavailable), istek gitmez', async () => {
    const { reports } = setup({ programId: null, lens: 'admin', departmentId: null })
    expect(await reports.downloadSeasonPdf()).toEqual({ kind: 'unavailable' })
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(0)
  })
})

describe('hata → durum (otomatik tekrar yok)', () => {
  const failing = (code: string, status: number, retryAfter?: string) =>
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () =>
        errorEnvelope(code, status, retryAfter ? { 'Retry-After': retryAfter } : {}),
      ),
    )

  it('429 export_in_progress + Retry-After: sayaç ortak kilitte başlar; bitince indirme başlamaz', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    failing('reporting.export_in_progress', 429, '1')
    const { reports, gate } = setup()
    expect(await reports.downloadSeasonPdf()).toMatchObject({
      kind: 'failed',
      failure: { kind: 'export_in_progress', retryAfter: 1 },
    })
    expect(gate.cooldown.value).toBe(1)
    vi.advanceTimersByTime(1000)
    expect(gate.cooldown.value).toBe(0)
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(1)
    expect(saved.clicked).toEqual([])
    vi.useRealTimers()
  })

  it('503 capacity_full: Retry-After yok → sayaç yok', async () => {
    failing('reporting.capacity_full', 503)
    const { reports, gate } = setup()
    expect(await reports.downloadMeetingPdf('m1')).toMatchObject({
      kind: 'failed',
      failure: { kind: 'capacity_full', retryAfter: null },
    })
    expect(gate.cooldown.value).toBe(0)
  })

  it('429 platform.rate_limited + Retry-After: sayaç', async () => {
    failing('platform.rate_limited', 429, '30')
    const { reports, gate } = setup()
    expect(await reports.downloadTaskPdf('t1')).toMatchObject({
      failure: { kind: 'rate_limited', retryAfter: 30 },
    })
    expect(gate.cooldown.value).toBe(30)
    gate.reset()
  })

  it('bilet üretiminde 429 (16 açık bilet): sayaç, tek istek', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, () =>
        errorEnvelope('platform.rate_limited', 429, { 'Retry-After': '60' }),
      ),
    )
    const { reports, gate } = setup()
    expect(await reports.downloadSeasonPdf()).toMatchObject({
      failure: { kind: 'rate_limited', retryAfter: 60 },
    })
    expect(gate.cooldown.value).toBe(60)
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(1)
    gate.reset()
  })

  it.each([
    ['reporting.not_found', 404, 'not_found'],
    ['reporting.input_invalid', 422, 'input_invalid'],
    ['audit.entry_rejected', 500, 'report_failed'],
    ['identity.download_ticket_invalid', 404, 'ticket_invalid'],
  ])('%s (%i) → %s; bildirim yok', async (code, status, kind) => {
    failing(code, status)
    const { reports } = setup()
    expect(await reports.downloadSeasonPdf()).toMatchObject({ kind: 'failed', failure: { kind } })
    expect(useToast().current.value).toBeNull()
    expect(saved.clicked).toEqual([])
  })

  it('403 reporting.not_authorized: yetki kaybı kanalına (me/me departments geçersizlenir)', async () => {
    failing('reporting.not_authorized', 403)
    const { reports, h } = setup()
    const seen: string[] = []
    const { onAuthorityLoss } = await import('@/shared/scope/authority-loss')
    onAuthorityLoss(h.queryClient, (error) => seen.push(error.code))
    expect(await reports.downloadSeasonPdf()).toMatchObject({
      failure: { kind: 'not_authorized' },
    })
    expect(seen).toEqual(['reporting.not_authorized'])
  })
})

describe('reportGate: tek eşzamanlı rapor', () => {
  it('biri sürerken ikincisi locked (istek yok); bitince kilit açılır', async () => {
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
    const { reports, gate } = setup()
    const first = reports.downloadSeasonPdf()
    await hit
    expect(gate.busy.value).toBe(true)
    expect(reports.isPending.value).toBe(true)
    expect(await reports.downloadTaskPdf('t1')).toEqual({ kind: 'locked' })
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(1)
    release()
    expect(await first).toMatchObject({ kind: 'saved' })
    expect(gate.busy.value).toBe(false)
    expect(reports.isPending.value).toBe(false)
  })

  it('iki bileşen aynı kilidi paylaşır', async () => {
    server.use(ticketOk(), pdf())
    const gate = createReportGate()
    const h = harness(ADMIN)
    const a = h.run(() => useReportDownloads(gate)).result
    const b = h.run(() => useReportDownloads(gate)).result
    gate.acquire()
    expect(await a.downloadSeasonPdf()).toEqual({ kind: 'locked' })
    expect(await b.downloadSeasonPdf()).toEqual({ kind: 'locked' })
  })
})

describe('iptal (KESİN 26): sahip söküldü, kapsam ve oturum değişti, İptal', () => {
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

  function expectNothingSaved() {
    expect(sent('GET', '/v1/downloads/tk_1')).toHaveLength(0)
    expect(saved.clicked).toEqual([])
    expect(useToast().current.value).toBeNull()
  }

  it('sahip bilet beklenirken söküldü: bilet tüketilmez, kilit açılır, bildirim yok', async () => {
    const gate = createReportGate()
    const ticket = gatedTicket()
    const { result } = harness(ADMIN).run(() => {
      const owner = effectScope()
      return { reports: owner.run(() => useReportDownloads(gate))!, owner }
    })
    const pending = result.reports.downloadSeasonPdf()
    await ticket.hit
    result.owner.stop()
    expect(gate.busy.value).toBe(false)
    ticket.release()
    expect(await pending).toEqual({ kind: 'cancelled' })
    expectNothingSaved()
  })

  it('kapsam (program) değişti: iptal', async () => {
    const { reports, h, gate } = setup()
    const ticket = gatedTicket()
    const pending = reports.downloadSeasonPdf()
    await ticket.hit
    h.store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    ticket.release()
    expect(await pending).toEqual({ kind: 'cancelled' })
    expect(gate.busy.value).toBe(false)
    expectNothingSaved()
  })

  it('mercek/departman değişti: iptal', async () => {
    const { reports, h } = setup()
    const ticket = gatedTicket()
    const pending = reports.downloadTaskPdf('t1')
    await ticket.hit
    h.store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    ticket.release()
    expect(await pending).toEqual({ kind: 'cancelled' })
    expectNothingSaved()
  })

  it('oturum değişti (çıkış): iptal', async () => {
    const { reports } = setup()
    const ticket = gatedTicket()
    const pending = reports.downloadSeasonPdf()
    await ticket.hit
    authSession.clear()
    ticket.release()
    expect(await pending).toEqual({ kind: 'cancelled' })
    expectNothingSaved()
  })

  it('"İptal" (cancel): bilet tüketilmez', async () => {
    const { reports, gate } = setup()
    const ticket = gatedTicket()
    const pending = reports.downloadMeetingPdf('m1')
    await ticket.hit
    reports.cancel()
    expect(gate.busy.value).toBe(false)
    ticket.release()
    expect(await pending).toEqual({ kind: 'cancelled' })
    expectNothingSaved()
  })

  it('iptal sonrası yeni eylem başlayabilir (kilit sızmaz)', async () => {
    const { reports, gate } = setup()
    const ticket = gatedTicket()
    const pending = reports.downloadSeasonPdf()
    await ticket.hit
    reports.cancel()
    ticket.release()
    await pending
    server.use(ticketOk(), pdf())
    expect(await reports.downloadSeasonPdf()).toMatchObject({ kind: 'saved' })
    expect(gate.busy.value).toBe(false)
  })
})
