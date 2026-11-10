import { VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import { authSession } from '@/shared/http'
import { isValidIdempotencyKey } from '@/shared/http/mutation/idempotency-key'
import { queryKeys } from '@/shared/http/query-keys'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  errorEnvelope,
  harness,
  http,
  HttpResponse,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  workItem,
} from '../__tests__/harness'
import {
  useAddDependency,
  useExtendWorkItem,
  useRemoveDependency,
  useRequestDateChange,
  useReviewDateChangeRequest,
  useUpdateWorkItemDates,
} from './mutations'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetHarness()
  if (authSession.snapshot.accountId) authSession.clear()
})
afterAll(() => server.close())

const target = { programId: 'p1', departmentId: 'd2' }
const ref = { target, workItemId: 'w1' }

/** Gantt (iki yüz), görev, liste, talep ve bağımlılık anahtarlarını tohumlar. */
function seed(h: ReturnType<typeof harness>) {
  const scope = h.store.snapshot
  const keys = {
    ganttAdmin: queryKeys.gantt.face(scope, 'admin'),
    ganttCoord: queryKeys.gantt.face(scope, 'coordinator'),
    item: queryKeys.workItems.item(scope, 'w1'),
    otherItem: queryKeys.workItems.item(scope, 'w2'),
    list: queryKeys.workItems.list(scope, { department: null }),
    requests: queryKeys.dateRequests.list(scope, { status: 'pending' }),
    deps: queryKeys.workItems.dependencies(scope, 'w1'),
  }
  for (const key of Object.values(keys)) h.queryClient.setQueryData(key, { seeded: true })
  const stale = (key: readonly unknown[]) => h.queryClient.getQueryState(key)?.isInvalidated
  return { keys, stale }
}

describe('updateWorkItem — yalnız tarih alanları + expected_dates_revision', () => {
  it('gövde yalnız tarihler + sürüm; IK yok, CSRF var; görevin kendi kapsamı; Gantt tüm yüzleri + görev + liste yeniden okunur', async () => {
    server.use(http.patch(`${ORIGIN}/v1/work-items/w1`, () => json(workItem())))
    const h = harness(ADMIN_SCOPE)
    const { keys, stale } = seed(h)
    const update = h.run(() => useUpdateWorkItemDates())
    const outcome = await update.submit({
      ...ref,
      base: { dates_revision: 7 },
      dates: { start_on: '2026-11-03', end_on: '2026-11-12' },
    })

    expect(outcome.kind).toBe('success')
    const [req] = sent('PATCH', '/v1/work-items/w1')
    expect(req!.body).toEqual({
      start_on: '2026-11-03',
      end_on: '2026-11-12',
      expected_dates_revision: 7,
    })
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(req!.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    for (const key of [keys.ganttAdmin, keys.ganttCoord, keys.item, keys.list]) {
      expect(stale(key)).toBe(true)
    }
    expect(stale(keys.otherItem)).toBe(false)
    // İyimser güncelleme yok.
    expect(h.queryClient.getQueryData(keys.ganttAdmin)).toEqual({ seeded: true })
  })

  it('409 edit_conflict: bayat tarih grubu + sunucunun güncel görevi; otomatik tekrar yok', async () => {
    server.use(
      http.patch(`${ORIGIN}/v1/work-items/w1`, () =>
        errorEnvelope('work.edit_conflict', 409, [
          { field: 'expected_dates_revision', code: 'work.edit_conflict' },
        ]),
      ),
      http.get(`${ORIGIN}/v1/work-items/w1`, () => json(workItem({ dates_revision: 8 }))),
    )
    const h = harness(ADMIN_SCOPE)
    const update = h.run(() => useUpdateWorkItemDates())
    const outcome = await update.submit({
      ...ref,
      base: { dates_revision: 7 },
      dates: { end_on: '2026-11-12' },
    })
    expect(outcome.kind).toBe('edit_conflict')
    if (outcome.kind !== 'edit_conflict') return
    expect(outcome.groups).toEqual(['expected_dates_revision'])
    expect(outcome.server).toMatchObject({ dates_revision: 8 })
    expect(sent('PATCH', '/v1/work-items/w1')).toHaveLength(1)
  })

  it('422 work.dependency_date_order: failed, ileti kodu; kör tekrar yok', async () => {
    server.use(
      http.patch(`${ORIGIN}/v1/work-items/w1`, () =>
        errorEnvelope('work.input_invalid', 422, [
          { field: 'start_on', code: 'work.dependency_date_order' },
        ]),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const update = h.run(() => useUpdateWorkItemDates())
    const outcome = await update.submit({
      ...ref,
      base: { dates_revision: 7 },
      dates: { start_on: '2026-10-01' },
    })
    expect(outcome.kind).toBe('failed')
    expect(sent('PATCH', '/v1/work-items/w1')).toHaveLength(1)
  })

  it('sonuç bilinmiyor (5xx): tek istek, tekrar yok; Gantt + görev + talep yeniden okunur', async () => {
    server.use(http.patch(`${ORIGIN}/v1/work-items/w1`, () => HttpResponse.error()))
    const h = harness(ADMIN_SCOPE)
    const { keys, stale } = seed(h)
    const update = h.run(() => useUpdateWorkItemDates())
    const outcome = await update.submit({
      ...ref,
      base: { dates_revision: 7 },
      dates: { end_on: '2026-11-12' },
    })

    expect(outcome.kind).toBe('unknown_outcome')
    expect(outcome.kind === 'unknown_outcome' && outcome.retry).toBeNull()
    expect(sent('PATCH', '/v1/work-items/w1')).toHaveLength(1)
    for (const key of [keys.ganttAdmin, keys.ganttCoord, keys.item, keys.requests, keys.deps]) {
      expect(stale(key), JSON.stringify(key)).toBe(true)
    }
    // Hedef kayıt bilinmeyen yeniden okumada görev önbelleği kaynak geneli geçersizlenir (fazla
    // geçersizleme güvenlidir, eksik bayat veri gösterir — query-keys.ts).
  })
})

describe('extendWorkItem', () => {
  it('POST /extend {days, expected_dates_revision?}; eylem başına Idempotency-Key; ExtendResult sonuçta (cascade_count sonradan bildirilir)', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items/w1/extend`, () =>
        json({ cascade_count: 2, new_end_on: '2026-11-13', dates_revision: 5, replayed: false }),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const { keys, stale } = seed(h)
    const extend = h.run(() => useExtendWorkItem())
    const outcome = await extend.submit({ ...ref, days: 3, expectedDatesRevision: 4 })

    expect(outcome.kind === 'success' && outcome.data).toEqual({
      cascade_count: 2,
      new_end_on: '2026-11-13',
      dates_revision: 5,
      replayed: false,
    })
    const [req] = sent('POST', '/v1/work-items/w1/extend')
    expect(req!.body).toEqual({ days: 3, expected_dates_revision: 4 })
    expect(isValidIdempotencyKey(req!.headers.get('Idempotency-Key') ?? '')).toBe(true)
    // Yeni kullanıcı eylemi yeni anahtar.
    await extend.submit({ ...ref, days: 3, expectedDatesRevision: 4 })
    const [first, second] = sent('POST', '/v1/work-items/w1/extend')
    expect(second!.headers.get('Idempotency-Key')).not.toBe(first!.headers.get('Idempotency-Key'))
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    // Zincir başka departmanı kaydırabilir: Gantt'ın bütün yüzleri.
    expect(stale(keys.ganttAdmin)).toBe(true)
    expect(stale(keys.ganttCoord)).toBe(true)
  })

  it('sonuç bilinmiyor: AYNI anahtarla TEK tekrar; tekrar replayed:true başarıdır (çift uzatma yok)', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}/v1/work-items/w1/extend`, () => {
        calls += 1
        return calls === 1
          ? new HttpResponse(null, { status: 503 })
          : json({ cascade_count: 0, new_end_on: '2026-11-13', dates_revision: 7, replayed: true })
      }),
    )
    const h = harness(ADMIN_SCOPE)
    const extend = h.run(() => useExtendWorkItem())
    const outcome = await extend.submit({ ...ref, days: 3 })
    expect(outcome.kind).toBe('success')
    // `dates_revision` ilk sonucun sürümüdür; başarı olarak döner.
    expect(outcome.kind === 'success' && outcome.data.replayed).toBe(true)
    const requests = sent('POST', '/v1/work-items/w1/extend')
    expect(requests).toHaveLength(2)
    expect(requests[1]!.headers.get('Idempotency-Key')).toBe(
      requests[0]!.headers.get('Idempotency-Key'),
    )
    expect(requests[1]!.body).toEqual(requests[0]!.body)
  })

  it('tekrar da bilinmiyorsa: iki istek, kör tekrar biter (retry null), Gantt + görev yeniden okunur', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items/w1/extend`, () => new HttpResponse(null, { status: 503 })),
    )
    const h = harness(ADMIN_SCOPE)
    const { keys, stale } = seed(h)
    const extend = h.run(() => useExtendWorkItem())
    const outcome = await extend.submit({ ...ref, days: 3 })
    expect(outcome.kind).toBe('unknown_outcome')
    expect(outcome.kind === 'unknown_outcome' && outcome.retry).toBeNull()
    expect(sent('POST', '/v1/work-items/w1/extend')).toHaveLength(2)
    expect(stale(keys.ganttAdmin)).toBe(true)
    expect(stale(keys.item)).toBe(true)
  })

  it('409 work.edit_conflict (bayat expected_dates_revision) ve 409 idempotency_key_reused ayrı sonuç türleridir; tekrar yok', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items/w1/extend`, () =>
        errorEnvelope('work.edit_conflict', 409, [{ field: 'expected_dates_revision' }]),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const extend = h.run(() => useExtendWorkItem())
    const outcome = await extend.submit({ ...ref, days: 3, expectedDatesRevision: 1 })
    expect(outcome.kind).toBe('edit_conflict')
    expect(sent('POST', '/v1/work-items/w1/extend')).toHaveLength(1)
    server.use(
      http.post(`${ORIGIN}/v1/work-items/w1/extend`, () =>
        errorEnvelope('work.idempotency_key_reused', 409),
      ),
    )
    const reused = await extend.submit({ ...ref, days: 4 })
    expect(reused.kind).toBe('idempotency_key_reused')
  })

  it('409 work.item_completed ve 422 extend_days_out_of_range failed döner', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items/w1/extend`, () =>
        errorEnvelope('work.item_completed', 409),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const extend = h.run(() => useExtendWorkItem())
    const outcome = await extend.submit({ ...ref, days: 3 })
    expect(outcome.kind === 'failed' && outcome.error.code).toBe('work.item_completed')
  })
})

describe('requestDateChange', () => {
  it('iki uç zorunlu, gerekçe isteğe bağlı; görevin kapsamı; talep + Gantt + görev + liste yeniden okunur', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/date-change-requests`, () =>
        json(
          {
            request_id: 'r1',
            work_item_id: 'w1',
            status: 'pending',
            old_start_on: '2026-11-01',
            old_end_on: '2026-11-10',
            new_start_on: '2026-11-02',
            new_end_on: '2026-11-12',
          },
          201,
        ),
      ),
    )
    const h = harness(COORD_SCOPE)
    const { keys, stale } = seed(h)
    const request = h.run(() => useRequestDateChange())
    const outcome = await request.submit({
      ...ref,
      newStartOn: '2026-11-02',
      newEndOn: '2026-11-12',
      expectedDatesRevision: 3,
    })

    expect(outcome.kind).toBe('success')
    const [req] = sent('POST', '/v1/date-change-requests')
    expect(req!.body).toEqual({
      work_item_id: 'w1',
      new_start_on: '2026-11-02',
      new_end_on: '2026-11-12',
      expected_dates_revision: 3,
    })
    expect(isValidIdempotencyKey(req!.headers.get('Idempotency-Key') ?? '')).toBe(true)
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    for (const key of [keys.requests, keys.ganttCoord, keys.item, keys.list]) {
      expect(stale(key)).toBe(true)
    }
  })

  it('gerekçe verilirse gövdeye girer', async () => {
    server.use(http.post(`${ORIGIN}/v1/date-change-requests`, () => json({}, 201)))
    const h = harness(COORD_SCOPE)
    const request = h.run(() => useRequestDateChange())
    await request.submit({
      ...ref,
      newStartOn: '2026-11-02',
      newEndOn: '2026-11-12',
      reason: 'Gecikme',
    })
    expect(sent('POST', '/v1/date-change-requests')[0]!.body).toMatchObject({ reason: 'Gecikme' })
  })

  it('409 date_request_pending_exists: failed + kodu (panel "bekleyen talep var" der); tekrar yok', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/date-change-requests`, () =>
        errorEnvelope('work.date_request_pending_exists', 409),
      ),
    )
    const h = harness(COORD_SCOPE)
    const request = h.run(() => useRequestDateChange())
    const outcome = await request.submit({
      ...ref,
      newStartOn: '2026-11-02',
      newEndOn: '2026-11-12',
    })
    expect(outcome.kind === 'failed' && outcome.error.code).toBe('work.date_request_pending_exists')
    expect(sent('POST', '/v1/date-change-requests')).toHaveLength(1)
  })

  it('sonuç bilinmiyor: AYNI anahtarla tek tekrar (ağ hatası); tekrar başarılıysa çift talep yok', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}/v1/date-change-requests`, () => {
        calls += 1
        return calls === 1 ? HttpResponse.error() : json({ request_id: 'r1' }, 200)
      }),
    )
    const h = harness(COORD_SCOPE)
    const request = h.run(() => useRequestDateChange())
    const outcome = await request.submit({
      ...ref,
      newStartOn: '2026-11-02',
      newEndOn: '2026-11-12',
    })
    expect(outcome.kind).toBe('success')
    const requests = sent('POST', '/v1/date-change-requests')
    expect(requests).toHaveLength(2)
    expect(requests[1]!.headers.get('Idempotency-Key')).toBe(
      requests[0]!.headers.get('Idempotency-Key'),
    )
  })

  it('tekrar da bilinmiyorsa: iki istek, retry null; talep listesi ve görev yeniden okunur', async () => {
    server.use(http.post(`${ORIGIN}/v1/date-change-requests`, () => HttpResponse.error()))
    const h = harness(COORD_SCOPE)
    const { keys, stale } = seed(h)
    const request = h.run(() => useRequestDateChange())
    const outcome = await request.submit({
      ...ref,
      newStartOn: '2026-11-02',
      newEndOn: '2026-11-12',
    })
    expect(outcome.kind === 'unknown_outcome' && outcome.retry).toBeNull()
    expect(sent('POST', '/v1/date-change-requests')).toHaveLength(2)
    expect(stale(keys.requests)).toBe(true)
    expect(stale(keys.item)).toBe(true)
  })

  it('isPending istek sürerken true (düğme kilidi); aynı anda ikinci gönderim ayrı eylemdir', async () => {
    let release!: () => void
    const held = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(`${ORIGIN}/v1/date-change-requests`, async () => {
        await held
        return json({}, 201)
      }),
    )
    const h = harness(COORD_SCOPE)
    const request = h.run(() => useRequestDateChange())
    const pending = request.submit({ ...ref, newStartOn: '2026-11-02', newEndOn: '2026-11-12' })
    await vi.waitFor(() => expect(request.isPending.value).toBe(true))
    release()
    await pending
    await vi.waitFor(() => expect(request.isPending.value).toBe(false))
  })
})

describe('reviewDateChangeRequest', () => {
  it('POST /review {decision}; yol = request_id; affected_tasks_count sonuçta; Gantt + görev + talepler yeniden okunur', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/date-change-requests/r1/review`, () =>
        json({ affected_tasks_count: 4 }),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const { keys, stale } = seed(h)
    const review = h.run(() => useReviewDateChangeRequest())
    const outcome = await review.submit({ requestId: 'r1', workItemId: 'w1', decision: 'approved' })

    expect(outcome.kind === 'success' && outcome.data).toEqual({ affected_tasks_count: 4 })
    const [req] = sent('POST', '/v1/date-change-requests/r1/review')
    expect(req!.body).toEqual({ decision: 'approved' })
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    for (const key of [keys.requests, keys.ganttAdmin, keys.item]) expect(stale(key)).toBe(true)
  })

  it('409 date_request_already_reviewed: failed; sonuç bilinmiyorsa kör tekrar yok', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/date-change-requests/r1/review`, () =>
        errorEnvelope('work.date_request_already_reviewed', 409),
      ),
      http.post(`${ORIGIN}/v1/date-change-requests/r2/review`, () => HttpResponse.error()),
    )
    const h = harness(ADMIN_SCOPE)
    const review = h.run(() => useReviewDateChangeRequest())
    const done = await review.submit({ requestId: 'r1', workItemId: 'w1', decision: 'rejected' })
    expect(done.kind === 'failed' && done.error.code).toBe('work.date_request_already_reviewed')
    const lost = await review.submit({ requestId: 'r2', workItemId: 'w1', decision: 'rejected' })
    expect(lost.kind === 'unknown_outcome' && lost.retry).toBeNull()
    expect(sent('POST', '/v1/date-change-requests/r2/review')).toHaveLength(1)
  })
})

describe('bağımlılık yazmaları', () => {
  it('addDependency: BAĞIMLI görevin kapsamı, gövde ön görev; Gantt + bağımlılık listesi yeniden okunur', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items/w1/dependencies`, () =>
        json({ dependency_id: 'l1', work_item_id: 'w1', depends_on_work_item_id: 'w9' }, 201),
      ),
    )
    const h = harness(COORD_SCOPE)
    const { keys, stale } = seed(h)
    const add = h.run(() => useAddDependency())
    const outcome = await add.submit({ ...ref, dependsOnWorkItemId: 'w9' })

    expect(outcome.kind).toBe('success')
    const [req] = sent('POST', '/v1/work-items/w1/dependencies')
    expect(req!.body).toEqual({ depends_on_work_item_id: 'w9' })
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(stale(keys.ganttCoord)).toBe(true)
    expect(stale(keys.deps)).toBe(true)
    expect(stale(keys.requests)).toBe(false)
  })

  it('409 dependency_cycle: failed; bağımlılık listesi yeniden okunmaz', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items/w1/dependencies`, () =>
        errorEnvelope('work.dependency_cycle', 409),
      ),
    )
    const h = harness(COORD_SCOPE)
    const { keys, stale } = seed(h)
    const add = h.run(() => useAddDependency())
    const outcome = await add.submit({ ...ref, dependsOnWorkItemId: 'w9' })
    expect(outcome.kind === 'failed' && outcome.error.code).toBe('work.dependency_cycle')
    expect(stale(keys.deps)).toBe(false)
  })

  it('removeDependency: DELETE yolunda depId = GanttLink.dependency_id; Gantt + liste yeniden okunur', async () => {
    server.use(
      http.delete(
        `${ORIGIN}/v1/work-items/w1/dependencies/l1`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    )
    const h = harness(COORD_SCOPE)
    const { keys, stale } = seed(h)
    const remove = h.run(() => useRemoveDependency())
    const outcome = await remove.submit({ ...ref, dependencyId: 'l1' })
    expect(outcome.kind).toBe('success')
    expect(sent('DELETE', '/v1/work-items/w1/dependencies/l1')).toHaveLength(1)
    expect(stale(keys.ganttCoord)).toBe(true)
    expect(stale(keys.deps)).toBe(true)
  })
})

describe('sahip yaşamı ve kapsam (KESİN 20, 26)', () => {
  it('sahip sökülünce yeni yazma başlamaz: owner_disposed, istek 0', async () => {
    const h = harness(COORD_SCOPE)
    let request!: ReturnType<typeof useRequestDateChange>
    const Owner = defineComponent({
      setup() {
        request = useRequestDateChange()
        return () => null
      },
    })
    const wrapper = mount(Owner, {
      global: { plugins: [getActivePinia()!, [VueQueryPlugin, { queryClient: h.queryClient }]] },
    })
    wrapper.unmount()
    const outcome = await request.submit({
      ...ref,
      newStartOn: '2026-11-02',
      newEndOn: '2026-11-12',
    })
    expect(outcome.kind).toBe('owner_disposed')
    expect(sent('POST', '/v1/date-change-requests')).toHaveLength(0)
  })

  it('eylem bağlamı bayat (kapsam değişti): scope_changed, istek 0', async () => {
    const h = harness(COORD_SCOPE)
    const context = { scope: { ...h.store.snapshot }, generation: authSession.generation }
    const extend = h.run(() => useExtendWorkItem())
    h.store.commit({ programId: 'p2', lens: 'coordinator', departmentId: 'd9' })
    const outcome = await extend.submit({ ...ref, days: 2 }, { context })
    expect(outcome.kind).toBe('scope_changed')
    expect(sent('POST', '/v1/work-items/w1/extend')).toHaveLength(0)
  })
})
