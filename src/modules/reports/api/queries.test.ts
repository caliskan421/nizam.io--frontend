import { ref } from 'vue'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { useDashboard } from '@/modules/home/public'
import { authSession } from '@/shared/http'
import { settleQueries } from '@/shared/http/__tests__/settle'
import { queryKeys } from '@/shared/http/query-keys'
import { SessionChangedError } from '@/shared/session/query-session'

import {
  ADMIN,
  errorEnvelope,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  SEASON,
  sent,
  server,
} from '../__tests__/harness'
import { createReportGate } from '../model/gate'
import { useReportDashboard } from './dashboard'
import { useReportMeetingDetail, useReportSeason, useReportTaskDetail } from './queries'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetHarness()
  if (authSession.snapshot.accountId) authSession.clear()
})
afterAll(() => server.close())

const SEASON_PATH = '/v1/reports/season'
const seasonOk = () => http.get(`${ORIGIN}${SEASON_PATH}`, () => json(SEASON))
const NO_PROGRAM = { programId: null, lens: 'admin', departmentId: null } as const

describe('reportSeason (01f önizleme)', () => {
  it('tek istek, program başlığı; anahtar ortak fabrikadan; staleTime 0, otomatik tazeleme yok', async () => {
    server.use(seasonOk())
    const h = harness(ADMIN)
    const { result } = h.run(() => useReportSeason(true, createReportGate()))
    await settleQueries(h.queryClient)
    const [request, ...rest] = sent('GET', SEASON_PATH)
    expect(rest).toHaveLength(0)
    expect(request!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(request!.headers.get('X-Nizamio-Department')).toBeNull()
    expect(result.data.value?.program_name).toBe('Program')
    const cached = h.queryClient
      .getQueryCache()
      .find({ queryKey: queryKeys.report.season(h.store.snapshot), exact: true })
    expect(Reflect.get(cached!.options, 'staleTime')).toBe(0)
    expect(Reflect.get(cached!.options, 'refetchOnWindowFocus')).toBe(false)
    expect(Reflect.get(cached!.options, 'refetchOnReconnect')).toBe(false)
    expect(Reflect.get(cached!.options, 'retry')).toBe(false)
  })

  it('etkin değilken ya da program yokken istek atılmaz', async () => {
    server.use(seasonOk())
    const off = harness(ADMIN)
    off.run(() => useReportSeason(false, createReportGate()))
    const none = harness(NO_PROGRAM)
    none.run(() => useReportSeason(true, createReportGate()))
    await settleQueries([off.queryClient, none.queryClient])
    expect(sent('GET', SEASON_PATH)).toHaveLength(0)
  })

  it('reportGate: kilit doluyken (PDF sürerken) okuma bekler; boşalınca tek istek, sonra kilit açılır', async () => {
    server.use(seasonOk())
    const gate = createReportGate()
    const holder = gate.acquire()!
    const h = harness(ADMIN)
    const { result } = h.run(() => useReportSeason(true, gate))
    await h.flush()
    expect(sent('GET', SEASON_PATH)).toHaveLength(0)
    expect(result.isFetching.value).toBe(true)
    holder.release()
    await settleQueries(h.queryClient)
    expect(sent('GET', SEASON_PATH)).toHaveLength(1)
    expect(result.data.value?.program_name).toBe('Program')
    expect(gate.busy.value).toBe(false)
  })

  it('kilit beklerken sorgu iptal edilirse istek hiç gitmez ve sıra tıkanmaz', async () => {
    server.use(seasonOk())
    const gate = createReportGate()
    const holder = gate.acquire()!
    const h = harness(ADMIN)
    h.run(() => useReportSeason(true, gate))
    await h.flush()
    await h.queryClient.cancelQueries()
    holder.release()
    await settleQueries(h.queryClient)
    expect(sent('GET', SEASON_PATH)).toHaveLength(0)
    expect(gate.busy.value).toBe(false)
  })

  it('okuma sürerken kilit tutulur (PDF düğmeleri kilitli) ve hata sonrası da bırakılır', async () => {
    let release!: () => void
    const open = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.get(`${ORIGIN}${SEASON_PATH}`, async () => {
        await open
        return errorEnvelope('reporting.capacity_full', 503)
      }),
    )
    const gate = createReportGate()
    const h = harness(ADMIN)
    const { result } = h.run(() => useReportSeason(true, gate))
    await h.flush()
    await Promise.resolve()
    expect(gate.busy.value).toBe(true)
    expect(gate.acquire()).toBeNull()
    release()
    await settleQueries(h.queryClient)
    expect(gate.busy.value).toBe(false)
    expect(result.error.value).toMatchObject({ code: 'reporting.capacity_full' })
    // Otomatik tekrar yok.
    expect(sent('GET', SEASON_PATH)).toHaveLength(1)
  })

  it('CX-F6-E-05: başlıklı 429 ortak sayacı başlatır; süre bitince otomatik istek yok', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    try {
      server.use(
        http.get(`${ORIGIN}${SEASON_PATH}`, () =>
          errorEnvelope('platform.rate_limited', 429, { 'Retry-After': '3' }),
        ),
      )
      const gate = createReportGate()
      const h = harness(ADMIN)
      h.run(() => useReportSeason(true, gate))
      await settleQueries(h.queryClient)
      expect(gate.cooldown.value).toBe(3)
      vi.advanceTimersByTime(3000)
      expect(gate.cooldown.value).toBe(0)
      await settleQueries(h.queryClient)
      expect(sent('GET', SEASON_PATH)).toHaveLength(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('CX-F6-E-08: sayaç sürerken yeni gözlem ağa çıkmaz; süre dolunca otomatik istek yok; refetch tek istek', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    try {
      server.use(
        http.get(`${ORIGIN}${SEASON_PATH}`, () =>
          errorEnvelope('platform.rate_limited', 429, { 'Retry-After': '60' }),
        ),
      )
      const gate = createReportGate()
      const first = harness(ADMIN)
      const a = first.run(() => useReportSeason(true, gate))
      await settleQueries(first.queryClient)
      expect(sent('GET', SEASON_PATH)).toHaveLength(1)
      a.app.unmount()

      // Aynı önbellek, yeni gözlemci (sök → yeniden aç): sayaç sürerken GET yok.
      server.use(seasonOk())
      const again = first.run(() => useReportSeason(true, gate))
      await settleQueries(first.queryClient)
      expect(sent('GET', SEASON_PATH)).toHaveLength(1)
      expect(again.result.error.value).toMatchObject({
        code: 'reporting.export_in_progress',
        retryAfter: gate.cooldown.value,
      })
      expect(gate.busy.value).toBe(false)

      vi.advanceTimersByTime(60_000)
      expect(gate.cooldown.value).toBe(0)
      await settleQueries(first.queryClient)
      expect(sent('GET', SEASON_PATH)).toHaveLength(1)

      await again.result.refetch()
      expect(sent('GET', SEASON_PATH)).toHaveLength(2)
      expect(again.result.data.value?.program_name).toBe('Program')
    } finally {
      vi.useRealTimers()
    }
  })

  it.each([
    ['429 başlıksız', () => errorEnvelope('reporting.export_in_progress', 429)],
    ['503 capacity_full', () => errorEnvelope('reporting.capacity_full', 503)],
    ['500', () => errorEnvelope('platform.internal', 500)],
  ] as const)('CX-F6-E-05: %s → sayaç yok', async (_label, reply) => {
    server.use(http.get(`${ORIGIN}${SEASON_PATH}`, () => reply()))
    const gate = createReportGate()
    const h = harness(ADMIN)
    h.run(() => useReportSeason(true, gate))
    await settleQueries(h.queryClient)
    expect(gate.cooldown.value).toBe(0)
  })

  it('429 export_in_progress: tek istek, Retry-After ApiError üzerinde', async () => {
    server.use(
      http.get(`${ORIGIN}${SEASON_PATH}`, () =>
        errorEnvelope('reporting.export_in_progress', 429, { 'Retry-After': '1' }),
      ),
    )
    const h = harness(ADMIN)
    const { result } = h.run(() => useReportSeason(true, createReportGate()))
    await settleQueries(h.queryClient)
    expect(result.error.value).toMatchObject({
      code: 'reporting.export_in_progress',
      retryAfter: 1,
    })
    expect(sent('GET', SEASON_PATH)).toHaveLength(1)
  })

  it('sessionBound: istek sürerken oturum değişirse veri önbelleğe yazılmaz', async () => {
    let release!: () => void
    let started!: () => void
    const open = new Promise<void>((resolve) => (release = resolve))
    const hit = new Promise<void>((resolve) => (started = resolve))
    server.use(
      http.get(`${ORIGIN}${SEASON_PATH}`, async () => {
        started()
        await open
        return json(SEASON)
      }),
    )
    const h = harness(ADMIN)
    const { result } = h.run(() => useReportSeason(true, createReportGate()))
    await hit
    authSession.clear()
    release()
    await settleQueries(h.queryClient).catch(() => undefined)
    expect(result.data.value).toBeUndefined()
    expect(result.error.value).toBeInstanceOf(SessionChangedError)
  })
})

describe('reportMeetingDetail (01g) ve reportTaskDetail', () => {
  it('toplantı: kayıt yolu + program başlığı, kilitsiz (hafif); anahtar report.meeting', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/reports/meetings/m1`, () =>
        json({ meeting: { title: 'T' }, participants: [], agenda: [], notes: [] }),
      ),
    )
    const gate = createReportGate()
    gate.acquire() // PDF sürerken bile detay okunur
    const h = harness(ADMIN)
    const { result } = h.run(() => useReportMeetingDetail('m1'))
    await settleQueries(h.queryClient)
    const [request] = sent('GET', '/v1/reports/meetings/m1')
    expect(request!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(result.data.value?.meeting.title).toBe('T')
    expect(
      h.queryClient.getQueryData(queryKeys.report.meeting(h.store.snapshot, 'm1')),
    ).toBeDefined()
  })

  it('görev: kayıt yolu; kimlik yokken ya da etkin değilken istek yok; kimlik gelince okur', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/reports/tasks/t1`, () =>
        json({ task: { title: 'G' }, description: '', dependencies: [], recent_notes: [] }),
      ),
    )
    const id = ref<string | null>(null)
    const h = harness(ADMIN)
    const { result } = h.run(() => useReportTaskDetail(id))
    await settleQueries(h.queryClient)
    expect(sent('GET', '/v1/reports/tasks/t1')).toHaveLength(0)
    id.value = 't1'
    await settleQueries(h.queryClient)
    expect(sent('GET', '/v1/reports/tasks/t1')).toHaveLength(1)
    expect(result.data.value?.task.title).toBe('G')
  })

  it('kayıt anahtarları ayrı: görev ve toplantı aynı kimlikte karışmaz', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/reports/tasks/x`, () =>
        json({ task: { title: 'G' }, description: '', dependencies: [], recent_notes: [] }),
      ),
      http.get(`${ORIGIN}/v1/reports/meetings/x`, () =>
        json({ meeting: { title: 'T' }, participants: [], agenda: [], notes: [] }),
      ),
    )
    const h = harness(ADMIN)
    const out = h.run(() => ({
      task: useReportTaskDetail('x'),
      meeting: useReportMeetingDetail('x'),
    }))
    await settleQueries(h.queryClient)
    expect(out.result.task.data.value?.task.title).toBe('G')
    expect(out.result.meeting.data.value?.meeting.title).toBe('T')
  })

  it('403 reporting.not_authorized: hata olarak görünür (gizleme güvenlik değildir); tekrar yok', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/reports/meetings/m1`, () =>
        errorEnvelope('reporting.not_authorized', 403),
      ),
    )
    const h = harness(ADMIN)
    const { result } = h.run(() => useReportMeetingDetail('m1'))
    await settleQueries(h.queryClient)
    expect(result.error.value).toMatchObject({ code: 'reporting.not_authorized' })
    expect(sent('GET', '/v1/reports/meetings/m1')).toHaveLength(1)
  })

  it('404 reporting.not_found: hata olarak görünür', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/reports/tasks/t9`, () => errorEnvelope('reporting.not_found', 404)),
    )
    const h = harness(ADMIN)
    const { result } = h.run(() => useReportTaskDetail('t9'))
    await settleQueries(h.queryClient)
    expect(result.error.value).toMatchObject({ code: 'reporting.not_found' })
  })
})

describe('reportDashboard paylaşımı', () => {
  it('ikinci okuyucu yok: rapor modülü ana sayfanın okuyucusunu yeniden dışa aktarır', () => {
    expect(useReportDashboard).toBe(useDashboard)
  })
})
