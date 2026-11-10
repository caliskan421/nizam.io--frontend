import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { settleQueries } from '@/shared/http/__tests__/settle'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  errorEnvelope,
  harness,
  http,
  ORIGIN,
  resetHarness,
  server,
  workItem,
} from '../../model/__tests__/harness'
import type { WorkItem } from '../../model/types'
import {
  ADMIN,
  COUNTS,
  countRequests,
  LIST,
  listHandler,
  listRequests,
  standingHandlers,
} from './__tests__/page-harness'
import { useTaskList } from './use-task-list'
import { DEFAULT_TASKS_STATE, type TasksUrlState } from './url-state'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const pending = { request_id: 'r1', new_start_on: '2026-11-01', new_end_on: '2026-11-20' }
const ROWS = [
  workItem({ work_item_id: 'a', department_id: 'd1', title: 'Rapor', is_overdue: true }),
  workItem({
    work_item_id: 'b',
    department_id: 'd2',
    title: 'Plan',
    status: 'tamamlandi',
    pending_date_request: pending,
    assignees: [{ account_id: 'acc-2', full_name: 'Can' }],
  }),
] as WorkItem[]

describe('useTaskList', () => {
  it('süzme sırası talep (VE) → arama → sekme; sayaçlar sekme dışı kümede', async () => {
    server.use(...standingHandlers(ADMIN), listHandler(ROWS))
    const h = harness(ADMIN_SCOPE)
    const state = ref<TasksUrlState>({ ...DEFAULT_TASKS_STATE })
    const show = ref(true)
    const list = h.run(() => useTaskList(state, show))
    await settleQueries(h.queryClient)
    expect(list.rows.value.map((r) => r.work_item_id)).toEqual(['a', 'b'])
    expect(list.summary.value).toEqual({
      tasks: 2,
      tasksExact: true,
      departments: 2,
      people: 2,
      peopleExact: true,
    })
    expect(list.requestCount.value).toBe(1)
    expect(list.requestDepartments.value).toEqual(['İdari işler'])

    state.value = { ...state.value, requests: true }
    expect(list.rows.value.map((r) => r.work_item_id)).toEqual(['b'])
    expect(list.counts.value?.tumu).toBe(1)
    // Talep verisi görünmeyen kullanıcıda süzgeç etkisiz.
    show.value = false
    expect(list.rows.value).toHaveLength(2)

    state.value = { ...state.value, requests: false, tab: 'geciken', search: 'rap' }
    expect(list.rows.value.map((r) => r.work_item_id)).toEqual(['a'])
    expect(list.counts.value).toMatchObject({ tumu: 1, geciken: 1, tamamlandi: 0 })
    expect(listRequests()).toHaveLength(1)
  })

  it('süzgeçsizken sekme sayaçları, talep sayısı ve toplam SUNUCU sayaçlarından (kesin, BE-003)', async () => {
    // Sunucu toplamı yüklenen sayfadan büyük: ikinci sayfa henüz çekilmedi.
    server.use(...standingHandlers(ADMIN), listHandler([ROWS[0]!], 'c1', [ROWS[1]!]))
    const h = harness(ADMIN_SCOPE)
    const state = ref<TasksUrlState>({ ...DEFAULT_TASKS_STATE })
    const list = h.run(() => useTaskList(state, ref(true)))
    await settleQueries(h.queryClient)
    expect(list.items.value).toHaveLength(1)
    expect(list.counts.value).toMatchObject({ tumu: 2, geciken: 1, tamamlandi: 1, baslanmadi: 1 })
    expect(list.countsExact.value).toBe(true)
    expect(list.total.value).toBe(2)
    expect(list.requestCount.value).toBe(1)
    expect(list.summary.value).toMatchObject({ tasks: 2, tasksExact: true, peopleExact: false })
    expect(countRequests()).toHaveLength(1)

    // Arama sunucuda yok (BE-004): sayaçlar yüklenen kümeden, imleç bitmediği için kesin değil.
    state.value = { ...state.value, search: 'rap' }
    expect(list.counts.value?.tumu).toBe(1)
    expect(list.countsExact.value).toBe(false)
    // Talep sayısı arama/sekmeden bağımsız sunucu değeri.
    expect(list.requestCount.value).toBe(1)
    // Talep süzgeci de sunucu sayacını bozar: yüklenen satırdan.
    state.value = { ...state.value, search: '', requests: true }
    expect(list.counts.value?.tumu).toBe(0)
  })

  it('sayaç ucu hatalıysa (403 hüküm) yüklenen kümeye düşer', async () => {
    server.use(...standingHandlers(ADMIN), listHandler(ROWS))
    server.use(
      http.get(`${ORIGIN}${COUNTS}`, () => errorEnvelope('organization.membership_required', 403)),
    )
    const h = harness(ADMIN_SCOPE)
    const list = h.run(() => useTaskList(ref({ ...DEFAULT_TASKS_STATE }), ref(true)))
    await settleQueries(h.queryClient)
    expect(list.total.value).toBeNull()
    expect(list.counts.value).toMatchObject({ tumu: 2 })
    expect(list.countsExact.value).toBe(true)
    expect(list.summary.value).toMatchObject({ tasks: 2, tasksExact: true })
    expect(list.requestCount.value).toBe(1)
  })

  it('Üye merceği: hesap kimliği bilinmeden liste/sayaç isteği yok (süzgeçsiz okuma sızmaz)', async () => {
    server.use(...standingHandlers(ADMIN), listHandler(ROWS))
    const h = harness({ programId: 'p1', lens: 'member', departmentId: 'd1' })
    h.run(() => useTaskList(ref({ ...DEFAULT_TASKS_STATE }), ref(false)))
    await settleQueries(h.queryClient)
    expect(listRequests()).toHaveLength(0)
    expect(countRequests()).toHaveLength(0)
  })

  it('K/Ü merceğinde seçili birim; koordinatörlük sayısı 1', async () => {
    server.use(...standingHandlers(ADMIN), listHandler(ROWS))
    const h = harness(COORD_SCOPE)
    const state = ref<TasksUrlState>({ ...DEFAULT_TASKS_STATE, department: 'd2' })
    const list = h.run(() => useTaskList(state, ref(true)))
    // Veri gelmeden özet yok (sayı yazılmaz).
    expect(list.summary.value).toBeNull()
    await settleQueries(h.queryClient)
    expect(listRequests()[0]!.query.get('department_id')).toBe('d1')
    expect(list.summary.value?.departments).toBe(1)
  })

  it('veri yokken (ilk yükleme / hata) sekme sayaçları null — "(0)" yazılmaz', async () => {
    server.use(
      ...standingHandlers(ADMIN),
      http.get(`${ORIGIN}${LIST}`, () => errorEnvelope('platform.internal', 503)),
    )
    const h = harness(ADMIN_SCOPE)
    const list = h.run(() => useTaskList(ref({ ...DEFAULT_TASKS_STATE }), ref(true)))
    expect(list.counts.value).toBeNull()
    await settleQueries(h.queryClient)
    expect(list.query.isError.value).toBe(true)
    expect(list.counts.value).toBeNull()
  })
})
