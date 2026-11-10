import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { authSession } from '@/shared/http'
import { isValidIdempotencyKey } from '@/shared/http/mutation/idempotency-key'
import { queryKeys } from '@/shared/http/query-keys'
import { useToast } from '@/shared/ui'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  errorEnvelope,
  ganttTask,
  harness,
  http,
  json,
  MEMBER_SCOPE,
  ORIGIN,
  resetHarness,
  sent,
  server,
  workItem,
} from '../__tests__/harness'
import type { GanttFace, GanttTask } from '../model/types'
import { DELAYED_SEND_MS } from './useDelayedSend'
import { useDateChange } from './useDateChange'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() =>
  vi.useFakeTimers({
    toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date'],
  }),
)
afterEach(() => {
  vi.useRealTimers()
  resetHarness()
  useToast().clear()
  if (authSession.snapshot.accountId) authSession.clear()
})
afterAll(() => server.close())

type Who = 'admin' | 'coordinator' | 'member'
const FACTS: Record<Who, { face: GanttFace; companyAdmin: boolean; coordinator: boolean }> = {
  admin: { face: 'admin', companyAdmin: true, coordinator: false },
  coordinator: { face: 'coordinator', companyAdmin: false, coordinator: true },
  member: { face: 'member', companyAdmin: false, coordinator: false },
}
const SCOPES = { admin: ADMIN_SCOPE, coordinator: COORD_SCOPE, member: MEMBER_SCOPE }

function setup(who: Who, task: Partial<GanttTask> = {}, extra: GanttTask[] = []) {
  const h = harness(SCOPES[who])
  const t = ganttTask(task)
  const all = [t, ...extra]
  const api = h.run(() =>
    useDateChange({
      taskOf: (id) => all.find((x) => x.work_item_id === id),
      face: () => FACTS[who].face,
      actorFacts: (face) => ({
        face,
        companyAdmin: FACTS[who].companyAdmin,
        coordinator: FACTS[who].coordinator,
        member: who === 'member',
      }),
    }),
  )
  return { h, api, task: t }
}

const drop = (edge: 'start' | 'end', day: string) => ({
  workItemId: 'w1',
  edge,
  phase: 'drop' as const,
  day,
})

/** Gönderim süresini ve yanıtların yerleşmesini sahte saatle ilerletir. */
async function elapse(ms = DELAYED_SEND_MS): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms)
  await vi.advanceTimersByTimeAsync(50)
}

const EXTEND = '/v1/work-items/w1/extend'
const REQUEST = '/v1/date-change-requests'
const ITEM = '/v1/work-items/w1'

function allWrites(): string[] {
  return ['POST', 'PATCH', 'PUT', 'DELETE'].flatMap((m) =>
    sent(m, EXTEND)
      .concat(sent(m, REQUEST), sent(m, ITEM))
      .map((r) => `${m} ${r.path}`),
  )
}

describe('P8 politikası — yüze göre yazma yolu', () => {
  it('Admin: yalnız bitiş ileri → extendWorkItem (görevin kendi kapsamı), 5 sn sonra TEK istek', async () => {
    server.use(
      http.post(`${ORIGIN}${EXTEND}`, () =>
        json({ cascade_count: 2, new_end_on: '2026-11-15', dates_revision: 2, replayed: false }),
      ),
    )
    const { api } = setup('admin')
    api.onEdgeDrag(drop('end', '2026-11-15'))
    expect(api.snack.value?.props).toMatchObject({
      face: 'admin',
      title: 'Rapor',
      before: { start: '2026-11-01', end: '2026-11-10' },
      after: { start: '2026-11-01', end: '2026-11-15' },
    })
    await vi.advanceTimersByTimeAsync(DELAYED_SEND_MS - 1)
    expect(sent('POST', EXTEND)).toHaveLength(0)
    await elapse(1)
    const [req] = sent('POST', EXTEND)
    expect(sent('POST', EXTEND)).toHaveLength(1)
    // Sürüm: sürüklemenin başladığı anda Gantt satırının `dates_revision`'ı (BE-053).
    expect(req?.body).toEqual({ days: 5, expected_dates_revision: 1 })
    expect(req?.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req?.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(req?.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(isValidIdempotencyKey(req?.headers.get('idempotency-key') ?? '')).toBe(true)
    expect(api.snack.value).toBeNull()
    expect(useToast().queue.value.map((q) => q.message)).toEqual([
      'Rapor süresi 5 gün uzatıldı; 2 bağımlı görev de kaydı.',
    ])
  })

  it('Admin: başlangıç kayması / kısaltma → ön okuma YOK, updateWorkItem + satırın expected_dates_revision değeri', async () => {
    server.use(http.patch(`${ORIGIN}${ITEM}`, () => json(workItem())))
    const { api } = setup('admin', { dates_revision: 4 })
    api.onEdgeDrag(drop('start', '2026-11-03'))
    expect(api.snack.value?.props.face).toBe('admin')
    await elapse()
    expect(sent('GET', ITEM)).toHaveLength(0)
    const [patch] = sent('PATCH', ITEM)
    expect(sent('PATCH', ITEM)).toHaveLength(1)
    expect(patch?.body).toEqual({
      start_on: '2026-11-03',
      end_on: '2026-11-10',
      expected_dates_revision: 4,
    })
    // `updateWorkItem` anahtarsızdır (sürüm korur).
    expect(patch?.headers.get('idempotency-key')).toBeNull()
    expect(sent('POST', EXTEND)).toHaveLength(0)
    expect(useToast().queue.value[0]?.message).toBe('Rapor tarihleri güncellendi.')
  })

  it('birleşen bırakmalarda sürüm İLK sürüklemedeki satır sürümüdür', async () => {
    server.use(http.patch(`${ORIGIN}${ITEM}`, () => json(workItem())))
    const { api, task } = setup('admin', { dates_revision: 4 })
    api.onEdgeDrag(drop('start', '2026-11-03'))
    task.dates_revision = 9 // arada Gantt yenilendi; kullanıcının gördüğü ilk sürüm korunur
    api.onEdgeDrag(drop('start', '2026-11-04'))
    await elapse()
    expect(sent('PATCH', ITEM)[0]?.body).toMatchObject({ expected_dates_revision: 4 })
  })

  it('Admin: tarihler bu arada değiştiyse sunucu 409 verir; çakışan alan adıyla bildirilir, tekrar yok', async () => {
    server.use(
      http.get(`${ORIGIN}${ITEM}`, () => json(workItem({ end_on: '2026-11-20' }))),
      http.patch(`${ORIGIN}${ITEM}`, () => errorEnvelope('work.edit_conflict', 409)),
    )
    const { api } = setup('admin')
    api.onEdgeDrag(drop('end', '2026-11-05'))
    await elapse()
    expect(sent('PATCH', ITEM)).toHaveLength(1)
    expect(useToast().queue.value[0]?.message).toContain('bitiş')
  })

  it('Koordinatör: iki uç da gönderilen talep (requestDateChange); bildirim "talep gönderiliyor"', async () => {
    server.use(
      http.post(`${ORIGIN}${REQUEST}`, () =>
        json({ request_id: 'r1', status: 'pending' } as never, 201),
      ),
    )
    const { api } = setup('coordinator')
    api.onEdgeDrag(drop('end', '2026-11-15'))
    expect(api.snack.value?.props.face).toBe('coordinator')
    await elapse()
    const [req] = sent('POST', REQUEST)
    expect(sent('POST', REQUEST)).toHaveLength(1)
    expect(req?.body).toEqual({
      work_item_id: 'w1',
      new_start_on: '2026-11-01',
      new_end_on: '2026-11-15',
      expected_dates_revision: 1,
    })
    expect(isValidIdempotencyKey(req?.headers.get('idempotency-key') ?? '')).toBe(true)
    expect(sent('POST', EXTEND)).toHaveLength(0)
    expect(sent('PATCH', ITEM)).toHaveLength(0)
    expect(useToast().queue.value[0]?.message).toContain('Değişiklik onaya gider')
  })

  it('Üye: tutamaç da bırakma da klavye adımı da yok — istek 0', async () => {
    const { api, task } = setup('member')
    expect(api.draggableIds([task]).size).toBe(0)
    api.onEdgeDrag(drop('end', '2026-11-15'))
    expect(api.nudge('w1', 'end', 1)).toBe(false)
    expect(api.snack.value).toBeNull()
    await elapse()
    expect(allWrites()).toEqual([])
  })

  it('tamamlanmış görevde tutamaç ve klavye adımı yok', () => {
    const { api, task } = setup('admin', { status: 'tamamlandi', completed_on: '2026-11-09' })
    expect(api.draggableIds([task]).size).toBe(0)
    expect(api.nudge('w1', 'end', 1)).toBe(false)
    api.onEdgeDrag(drop('end', '2026-11-15'))
    expect(api.snack.value).toBeNull()
  })

  it('yönetici ve koordinatör için tutamaçlı görev kümesi', () => {
    const a = setup('admin')
    expect([...a.api.draggableIds([a.task])]).toEqual(['w1'])
    const c = setup('coordinator')
    expect([...c.api.draggableIds([c.task])]).toEqual(['w1'])
  })
})

describe('gecikmeli gönderim — iptal ve yaşam döngüsü', () => {
  beforeEach(() => {
    server.use(
      http.post(`${ORIGIN}${EXTEND}`, () => json({ cascade_count: 0, new_end_on: '2026-11-15' })),
    )
  })

  it('"İptal et" süre içinde isteği hiç göndermez', async () => {
    const { api } = setup('admin')
    api.onEdgeDrag(drop('end', '2026-11-15'))
    await vi.advanceTimersByTimeAsync(4000)
    api.cancel()
    expect(api.snack.value).toBeNull()
    expect(api.announcement.value).toContain('iptal edildi')
    await elapse(10_000)
    expect(allWrites()).toEqual([])
  })

  it('✕ yalnız gizler: gönderim sürer (kapat → istek 1)', async () => {
    const { api } = setup('admin')
    api.onEdgeDrag(drop('end', '2026-11-15'))
    api.dismiss()
    expect(api.snack.value?.visible).toBe(false)
    await elapse()
    expect(sent('POST', EXTEND)).toHaveLength(1)
  })

  it('kapsam değişimi, çıkış ve söküm sırasında bekleyen gönderim → istek 0', async () => {
    const a = setup('admin')
    a.api.onEdgeDrag(drop('end', '2026-11-15'))
    a.h.store.setLens('coordinator')
    await elapse(10_000)
    expect(a.api.snack.value).toBeNull()

    const b = setup('admin')
    b.api.onEdgeDrag(drop('end', '2026-11-15'))
    authSession.clear()
    await elapse(10_000)
    expect(b.api.snack.value).toBeNull()

    const c = setup('admin')
    c.api.onEdgeDrag(drop('end', '2026-11-15'))
    resetHarness() // uygulamalar sökülür
    await elapse(10_000)
    expect(allWrites()).toEqual([])
  })

  it('eski konuma geri bırakma bekleyen değişikliği düşürür (istek 0)', async () => {
    const { api } = setup('admin')
    api.onEdgeDrag(drop('end', '2026-11-15'))
    api.onEdgeDrag(drop('end', '2026-11-10'))
    expect(api.snack.value).toBeNull()
    await elapse(10_000)
    expect(allWrites()).toEqual([])
  })

  it('cancel/Esc sürüklemesi istek ve bildirim üretmez; move yalnız önizleme', async () => {
    const { api } = setup('admin')
    api.onEdgeDrag({ workItemId: 'w1', edge: 'end', phase: 'move', day: '2026-11-12' })
    expect(api.preview.value).toEqual({ workItemId: 'w1', edge: 'end', day: '2026-11-12' })
    expect(api.snack.value).toBeNull()
    api.onEdgeDrag({ workItemId: 'w1', edge: 'end', phase: 'cancel', day: '2026-11-10' })
    expect(api.preview.value).toBeNull()
    await elapse(10_000)
    expect(allWrites()).toEqual([])
  })
})

const EXTEND2 = '/v1/work-items/w2/extend'

describe('görevler arası bekleyenler (CX-F3-Ö-01): her görevin 5 sn iptal penceresi korunur', () => {
  const two = () => setup('admin', {}, [ganttTask({ work_item_id: 'w2', title: 'Plan' })])
  const dropW2 = (day: string) => ({ ...drop('end', day), workItemId: 'w2' })

  it('A sonra B değişince A hemen gitmez; her görev kendi süresinde TEK istekle gider', async () => {
    server.use(
      http.post(`${ORIGIN}${EXTEND}`, () => json({ cascade_count: 0, new_end_on: '2026-11-15' })),
      http.post(`${ORIGIN}${EXTEND2}`, () => json({ cascade_count: 0, new_end_on: '2026-11-15' })),
    )
    const { api } = two()
    api.onEdgeDrag(drop('end', '2026-11-15'))
    await vi.advanceTimersByTimeAsync(1000)
    api.onEdgeDrag(dropW2('2026-11-15'))
    await vi.advanceTimersByTimeAsync(3900)
    expect(sent('POST', EXTEND)).toHaveLength(0)
    await elapse(100)
    expect(sent('POST', EXTEND)).toHaveLength(1)
    expect(sent('POST', EXTEND2)).toHaveLength(0)
    await elapse(1000)
    expect(sent('POST', EXTEND2)).toHaveLength(1)
    expect(sent('POST', EXTEND)).toHaveLength(1)
  })

  it('iki görevde de süre dolmadan iptal → sıfır yazma (bildirim en sonuncuyu, sonra öncekini gösterir)', async () => {
    const { api } = two()
    api.onEdgeDrag(drop('end', '2026-11-15'))
    await vi.advanceTimersByTimeAsync(1000)
    api.onEdgeDrag(dropW2('2026-11-15'))
    expect(api.snack.value?.props.title).toBe('Plan')
    api.cancel()
    expect(api.snack.value?.props.title).toBe('Rapor')
    api.cancel()
    expect(api.snack.value).toBeNull()
    await elapse(10_000)
    expect(allWrites()).toEqual([])
  })

  it('klavye adımı da aynı yol: B adımı A penceresini kesmez; B için geri adım yalnız B’yi düşürür', async () => {
    server.use(
      http.post(`${ORIGIN}${EXTEND}`, () => json({ cascade_count: 0, new_end_on: '2026-11-15' })),
    )
    const { api } = two()
    expect(api.nudge('w1', 'end', 1)).toBe(true)
    await vi.advanceTimersByTimeAsync(1000)
    expect(api.nudge('w2', 'end', 1)).toBe(true)
    expect(api.nudge('w2', 'end', -1)).toBe(true) // B geri alındı
    expect(api.snack.value?.props.title).toBe('Rapor')
    await vi.advanceTimersByTimeAsync(3900)
    expect(allWrites()).toEqual([])
    await elapse(100)
    expect(sent('POST', EXTEND)).toHaveLength(1)
    expect(sent('POST', EXTEND2)).toHaveLength(0)
  })

  it('A bekleyenken A’da yeni adım A’yı birleştirir (B’ye dokunmaz)', async () => {
    server.use(
      http.post(`${ORIGIN}${EXTEND}`, () => json({ cascade_count: 0, new_end_on: '2026-11-15' })),
      http.post(`${ORIGIN}${EXTEND2}`, () => json({ cascade_count: 0, new_end_on: '2026-11-15' })),
    )
    const { api } = two()
    api.nudge('w1', 'end', 1)
    api.nudge('w2', 'end', 1)
    api.nudge('w1', 'end', 1)
    await elapse()
    expect(sent('POST', EXTEND)[0]?.body).toEqual({ days: 2, expected_dates_revision: 1 })
    expect(sent('POST', EXTEND2)).toHaveLength(1)
  })
})

describe('gönderim yaşam döngüsü (CX-F3-Ö-04)', () => {
  it('sahibi sökülmüş sürükleme: 409 sonrası yeniden okuma/bildirim yok (detached)', async () => {
    server.use(
      http.get(`${ORIGIN}${ITEM}`, () =>
        json(workItem({ end_on: '2026-11-20', dates_revision: 8 })),
      ),
      http.patch(`${ORIGIN}${ITEM}`, () => {
        resetHarness() // yazma uçuştayken sahip söküldü
        return errorEnvelope('work.edit_conflict', 409)
      }),
    )
    const { h, api } = setup('admin')
    const spy = vi.spyOn(h.queryClient, 'invalidateQueries')
    api.onEdgeDrag(drop('start', '2026-11-03'))
    await elapse()
    expect(spy).not.toHaveBeenCalled()
    expect(useToast().queue.value).toEqual([])
  })

  it('sahibi sökülmüş sürükleme: extend sonucu bilinmiyorsa TEKRAR başlamaz, bildirim yok', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}${EXTEND}`, () => {
        calls += 1
        resetHarness() // istek uçuştayken sahip söküldü
        return new Response(null, { status: 503 })
      }),
    )
    const { api } = setup('admin')
    api.onEdgeDrag(drop('end', '2026-11-15'))
    await elapse()
    await elapse(10_000)
    expect(calls).toBe(1) // tekrar yok (sahip söküldü: owner_disposed)
    expect(useToast().queue.value).toEqual([])
  })

  it('yarışta oluşan work.edit_conflict: çakışan ALANLAR adıyla bildirilir, görev yeniden okunur', async () => {
    server.use(
      // Arada başkası bitişi değiştirdi: 409 sonrası sunucunun güncel görevi okunur.
      http.get(`${ORIGIN}${ITEM}`, () =>
        json(workItem({ end_on: '2026-11-20', dates_revision: 8 })),
      ),
      http.patch(`${ORIGIN}${ITEM}`, () => errorEnvelope('work.edit_conflict', 409)),
    )
    const { h, api } = setup('admin')
    const spy = vi.spyOn(h.queryClient, 'invalidateQueries')
    api.onEdgeDrag(drop('end', '2026-11-05'))
    await elapse()
    expect(sent('PATCH', ITEM)).toHaveLength(1) // kör tekrar/otomatik yeniden gönderim yok
    const [toast] = useToast().queue.value
    expect(toast?.tone).toBe('danger')
    expect(toast?.message).toContain('bitiş')
    expect(toast?.message).toContain('Rapor')
    expect(toast?.message).not.toContain('sunucu iletisi')
    expect(spy).toHaveBeenCalled()
  })

  it('çakışan alan yoksa (yalnız sürüm ilerledi) ortak çakışma bildirimi', async () => {
    server.use(
      http.get(`${ORIGIN}${ITEM}`, () => json(workItem({ dates_revision: 8 }))),
      http.patch(`${ORIGIN}${ITEM}`, () => errorEnvelope('work.edit_conflict', 409)),
    )
    const { api } = setup('admin')
    api.onEdgeDrag(drop('end', '2026-11-05'))
    await elapse()
    const [toast] = useToast().queue.value
    expect(toast?.tone).toBe('danger')
    expect(toast?.message).not.toContain('bitiş')
  })
})

describe('klavyeyle tarih değişimi — bırakmayla aynı yol', () => {
  it('art arda Shift+→ adımları tek istek olarak birleşir (extend days:3), süre yeniden başlar', async () => {
    server.use(
      http.post(`${ORIGIN}${EXTEND}`, () => json({ cascade_count: 0, new_end_on: '2026-11-13' })),
    )
    const { api } = setup('admin')
    expect(api.nudge('w1', 'end', 1)).toBe(true)
    await vi.advanceTimersByTimeAsync(3000)
    expect(api.nudge('w1', 'end', 1)).toBe(true)
    expect(api.nudge('w1', 'end', 1)).toBe(true)
    expect(api.snack.value?.props.after.end).toBe('2026-11-13')
    expect(api.snack.value?.props.before.end).toBe('2026-11-10')
    expect(api.announcement.value).toContain('bitiş 13 Kas')
    await vi.advanceTimersByTimeAsync(3000)
    expect(sent('POST', EXTEND)).toHaveLength(0)
    await elapse(2000)
    expect(sent('POST', EXTEND)).toHaveLength(1)
    expect(sent('POST', EXTEND)[0]?.body).toEqual({ days: 3, expected_dates_revision: 1 })
  })

  it('Alt+Shift (başlangıç) koordinatörde talebe gider; adım geri alınınca bekleyen düşer', async () => {
    const { api } = setup('coordinator')
    expect(api.nudge('w1', 'start', -1)).toBe(true)
    expect(api.snack.value?.props.after.start).toBe('2026-10-31')
    expect(api.nudge('w1', 'start', 1)).toBe(true)
    expect(api.snack.value).toBeNull()
    await elapse(10_000)
    expect(allWrites()).toEqual([])
  })
})

describe('sonuçlar', () => {
  it('409 work.date_request_pending_exists → hata bildirimi, Gantt yeniden okunur', async () => {
    server.use(
      http.post(`${ORIGIN}${REQUEST}`, () =>
        errorEnvelope('work.date_request_pending_exists', 409),
      ),
    )
    const { h, api } = setup('coordinator')
    const spy = vi.spyOn(h.queryClient, 'invalidateQueries')
    api.onEdgeDrag(drop('end', '2026-11-15'))
    await elapse()
    expect(sent('POST', REQUEST)).toHaveLength(1)
    const [toast] = useToast().queue.value
    expect(toast?.tone).toBe('danger')
    expect(toast?.message).not.toContain('sunucu iletisi')
    expect(spy).toHaveBeenCalled()
  })

  it('sonuç bilinmiyor (5xx) → AYNI anahtarla tek tekrar; ikisi de bilinmiyorsa kör tekrar biter', async () => {
    server.use(http.post(`${ORIGIN}${EXTEND}`, () => errorEnvelope('platform.internal', 500)))
    const { api } = setup('admin')
    api.onEdgeDrag(drop('end', '2026-11-15'))
    await elapse()
    await elapse(10_000)
    const attempts = sent('POST', EXTEND)
    expect(attempts).toHaveLength(2)
    expect(attempts[1]?.headers.get('idempotency-key')).toBe(
      attempts[0]?.headers.get('idempotency-key'),
    )
    expect(useToast().queue.value[0]?.tone).toBe('danger')
  })

  it('sonuç bilinmiyor, tekrar replayed:true → başarı bildirimi (çift uzatma yok)', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}${EXTEND}`, () => {
        calls += 1
        return calls === 1
          ? errorEnvelope('platform.internal', 500)
          : json({ cascade_count: 0, new_end_on: '2026-11-15', dates_revision: 2, replayed: true })
      }),
    )
    const { api } = setup('admin')
    api.onEdgeDrag(drop('end', '2026-11-15'))
    await elapse()
    expect(sent('POST', EXTEND)).toHaveLength(2)
    expect(useToast().queue.value.map((q) => q.message)).toEqual(['Rapor süresi 5 gün uzatıldı.'])
  })
})

describe('varsayılan olgu kaynağı — standing (rol dizesi yok, olgudan)', () => {
  function seeded(opts: { companyAdmin: boolean; role?: string; scope: typeof COORD_SCOPE }) {
    const h = harness(opts.scope)
    h.queryClient.setQueryData(queryKeys.me.root(), {
      account_id: 'acc-me',
      company_admin: opts.companyAdmin,
      email: 'ben@ornek.test',
      full_name: 'Ben',
    })
    h.queryClient.setQueryData(queryKeys.me.departments(), {
      data: {
        departments: opts.role
          ? [
              {
                program_id: 'p1',
                program_name: 'Program',
                department_id: 'd2',
                display_name: 'Birim',
                role: opts.role,
              },
            ]
          : [],
      },
      truncated: false,
    })
    h.queryClient.setQueryData(queryKeys.programs.all(), { programs: [], truncated: false })
    const t = ganttTask()
    const face = opts.scope.lens as GanttFace
    const api = h.run(() =>
      useDateChange({ taskOf: (id) => (id === 'w1' ? t : undefined), face: () => face }),
    )
    return { api, task: t }
  }

  it('görevin departmanındaki koordinatör satırı → tutamaç + talep; satırsız üye → yok', () => {
    const c = seeded({
      companyAdmin: false,
      role: 'koordinator',
      scope: { ...COORD_SCOPE, departmentId: 'd2' },
    })
    expect([...c.api.draggableIds([c.task])]).toEqual(['w1'])
    expect(c.api.nudge('w1', 'end', 1)).toBe(true)
    expect(c.api.snack.value?.props.face).toBe('coordinator')
    const m = seeded({
      companyAdmin: false,
      role: 'uye',
      scope: { ...MEMBER_SCOPE, departmentId: 'd2' },
    })
    expect(m.api.draggableIds([m.task]).size).toBe(0)
  })

  it('şirket yöneticisi Koordinatör merceğinde yetkisini korur (P1): doğrudan yol', () => {
    const a = seeded({ companyAdmin: true, scope: { ...COORD_SCOPE, departmentId: 'd2' } })
    expect([...a.api.draggableIds([a.task])]).toEqual(['w1'])
    a.api.nudge('w1', 'end', 1)
    expect(a.api.snack.value?.props.face).toBe('admin')
  })
})
