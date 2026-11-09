import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { authSession } from '@/shared/http'
import { isValidIdempotencyKey } from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'
import type { ScopeSnapshot } from '@/shared/scope/scope'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  errorEnvelope,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  workItem,
} from '../model/__tests__/harness'
import { createPartialText } from '../model/messages'
import {
  isDeletingWorkItem,
  useCreateWorkItem,
  useCreateWorkItemWithAssignees,
  useDeleteWorkItem,
  useOwnStatusWorkItem,
  useTransitionWorkItem,
  useUpdateWorkItem,
} from './items'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetHarness()
  if (authSession.snapshot.accountId) authSession.clear()
})
afterAll(() => server.close())

const target = { programId: 'p1', departmentId: 'd2' }
const body = { title: 'Rapor', start_on: '2026-11-01', end_on: '2026-11-10' }
const ref = { target, workItemId: 'w1' }

function seed(h: ReturnType<typeof harness>) {
  const scope = h.store.snapshot
  const keys = {
    list: queryKeys.workItems.list(scope, { department: null }),
    item: queryKeys.workItems.item(scope, 'w1'),
    other: queryKeys.workItems.item(scope, 'w2'),
    notes: queryKeys.workItems.notes(scope, 'w1'),
  }
  for (const key of Object.values(keys)) h.queryClient.setQueryData(key, { seeded: true })
  const stale = (key: readonly unknown[]) => h.queryClient.getQueryState(key)?.isInvalidated
  return { keys, stale }
}

describe('createWorkItem', () => {
  it('IK + CSRF + seçilen departmanın S3 başlıkları; başarıda liste + görev yeniden okunur', async () => {
    server.use(http.post(`${ORIGIN}/v1/work-items`, () => json(workItem(), 201)))
    const h = harness(ADMIN_SCOPE)
    const { keys, stale } = seed(h)
    const create = h.run(() => useCreateWorkItem())
    const outcome = await create.submit({ target, body })

    expect(outcome.kind).toBe('success')
    const [req] = sent('POST', '/v1/work-items')
    expect(isValidIdempotencyKey(req!.headers.get('Idempotency-Key') ?? '')).toBe(true)
    expect(req!.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(req!.body).toEqual(body)
    expect(stale(keys.list)).toBe(true)
    expect(stale(keys.item)).toBe(true)
    expect(stale(keys.other)).toBe(false)
    expect(stale(keys.notes)).toBe(false)
    // İyimser güncelleme yok: önbellek yanıtla değiştirilmez.
    expect(h.queryClient.getQueryData(keys.list)).toEqual({ seeded: true })
  })

  it('her gönderim yeni eylem: yeni anahtar', async () => {
    server.use(http.post(`${ORIGIN}/v1/work-items`, () => json(workItem(), 201)))
    const h = harness(ADMIN_SCOPE)
    const create = h.run(() => useCreateWorkItem())
    await create.submit({ target, body })
    await create.submit({ target, body: { ...body, title: 'Düzeltilmiş' } })
    const [a, b] = sent('POST', '/v1/work-items').map((r) => r.headers.get('Idempotency-Key'))
    expect(a).not.toBe(b)
  })
})

describe('yeni görev + ek atama — kısmi başarı modeli', () => {
  it('addAssignments başarısız: görev korunur, "görev oluşturuldu, ek atama yapılamadı"', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items`, () => json(workItem({ department_id: 'd2' }), 201)),
      http.post(`${ORIGIN}/v1/work-items/w1/assignments`, () =>
        errorEnvelope('work.assignee_not_member', 422),
      ),
    )
    const h = harness(COORD_SCOPE)
    const create = h.run(() => useCreateWorkItemWithAssignees())
    const outcome = await create.submit({
      target,
      body: { ...body, assignee_account_id: 'acc-1' },
      extraAssignees: ['acc-1', 'acc-2', 'acc-2'],
    })

    expect(outcome.kind).toBe('partial')
    if (outcome.kind !== 'partial') return
    expect(outcome.primary.data.work_item_id).toBe('w1')
    expect(outcome.failed).toEqual(['assignments'])
    expect(createPartialText(outcome)).toBe('Görev oluşturuldu, ek atama yapılamadı.')
    // İlk istekteki atanan korunur; ek adım ana atananı tekrar etmez, görevin KENDİ kapsamıyla.
    expect(sent('POST', '/v1/work-items')[0]!.body).toMatchObject({ assignee_account_id: 'acc-1' })
    const [assign] = sent('POST', '/v1/work-items/w1/assignments')
    expect(assign!.body).toEqual({ account_ids: ['acc-2'] })
    expect(assign!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(assign!.headers.get('Idempotency-Key')).toBeNull()
  })

  it('ek atama başarılı → complete; ek atanan yoksa ikinci istek yok', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items`, () => json(workItem(), 201)),
      http.post(`${ORIGIN}/v1/work-items/w1/assignments`, () => json({ added: 1 })),
    )
    const h = harness(COORD_SCOPE)
    const create = h.run(() => useCreateWorkItemWithAssignees())
    const full = await create.submit({ target, body, extraAssignees: ['acc-2'] })
    expect(full.kind).toBe('complete')
    expect(createPartialText(full)).toBeNull()
    const single = await create.submit({ target, body, extraAssignees: [] })
    expect(single.kind).toBe('complete')
    expect(sent('POST', '/v1/work-items/w1/assignments')).toHaveLength(1)
  })

  it('birincil başarısız: ek adım koşmaz', async () => {
    server.use(http.post(`${ORIGIN}/v1/work-items`, () => errorEnvelope('work.input_invalid', 422)))
    const h = harness(COORD_SCOPE)
    const create = h.run(() => useCreateWorkItemWithAssignees())
    const outcome = await create.submit({ target, body, extraAssignees: ['acc-2'] })
    expect(outcome.kind).toBe('primary_failed')
    expect(sent('POST', '/v1/work-items/w1/assignments')).toHaveLength(0)
  })
})

/** Elle bırakılan yanıt kapısı (gerçek süre beklemesi yok): istek geldi → `arrived` çözülür. */
function hold() {
  let arrive!: () => void
  let release!: () => void
  const arrived = new Promise<void>((r) => (arrive = r))
  const released = new Promise<void>((r) => (release = r))
  return { arrived, release, wait: () => (arrive(), released) }
}

const login = (accountId: string) => ({
  token: `tok-${accountId}`,
  account_id: accountId,
  expires_at: Math.floor(Date.now() / 1000) + 900,
  force_password_change: false,
})

const SCOPE_B = { programId: 'p2', lens: 'coordinator', departmentId: 'd3' } as const

/** Geciktirilmiş `createWorkItem` + sayılan `addAssignments`. */
function delayedCreate() {
  const gate = hold()
  server.use(
    http.post(`${ORIGIN}/v1/work-items`, async () => {
      await gate.wait()
      return json(workItem({ department_id: 'd2' }), 201)
    }),
    http.post(`${ORIGIN}/v1/work-items/w1/assignments`, () => json({ added: 1 })),
  )
  return gate
}

function seedLists(h: ReturnType<typeof harness>, scope: ScopeSnapshot) {
  const keys = [
    queryKeys.workItems.list(scope, { department: null }),
    queryKeys.workItems.item(scope, 'w1'),
  ]
  for (const key of keys) h.queryClient.setQueryData(key, { seeded: true })
  return () => keys.map((key) => h.queryClient.getQueryState(key)?.isInvalidated)
}

describe('CX-F1-E-03 — bileşik işlem ilk eylemin bağlamında (gerçek hook + MSW)', () => {
  it('(a) ilk yanıt beklerken kapsam A→B: addAssignments 0, kısmi sonuç, B önbelleğine dokunulmaz', async () => {
    const gate = delayedCreate()
    const h = harness(COORD_SCOPE)
    const staleA = seedLists(h, h.store.snapshot)
    const create = h.run(() => useCreateWorkItemWithAssignees())
    const pending = create.submit({ target, body, extraAssignees: ['acc-2'] })
    await gate.arrived
    h.store.commit(SCOPE_B)
    const staleB = seedLists(h, h.store.snapshot)
    gate.release()
    const outcome = await pending

    expect(outcome.kind).toBe('partial')
    if (outcome.kind !== 'partial') return
    expect(outcome.primary.data.work_item_id).toBe('w1')
    expect(outcome.steps[0]!.outcome.kind).toBe('scope_changed')
    expect(createPartialText(outcome)).toBe('Görev oluşturuldu, ek atama yapılamadı.')
    expect(sent('POST', '/v1/work-items')).toHaveLength(1)
    expect(sent('POST', '/v1/work-items/w1/assignments')).toHaveLength(0)
    expect(staleA()).toEqual([true, true])
    expect(staleB()).toEqual([false, false])
  })

  it('(b) ilk yanıt beklerken çıkış → başka hesapla giriş: addAssignments 0, kısmi sonuç', async () => {
    const gate = delayedCreate()
    const h = harness(COORD_SCOPE)
    authSession.establish(login('acc-x'))
    const create = h.run(() => useCreateWorkItemWithAssignees())
    const pending = create.submit({ target, body, extraAssignees: ['acc-2'] })
    await gate.arrived
    authSession.clear()
    authSession.establish(login('acc-y'))
    gate.release()
    const outcome = await pending

    expect(outcome.kind).toBe('partial')
    if (outcome.kind !== 'partial') return
    const step = outcome.steps[0]!.outcome
    expect(step.kind === 'failed' && step.error.code).toBe('client.session_ended')
    expect(createPartialText(outcome)).toBe('Görev oluşturuldu, ek atama yapılamadı.')
    expect(sent('POST', '/v1/work-items/w1/assignments')).toHaveLength(0)
  })

  it('(c) değişmeyen kapsam/oturumda ek atama aynen koşar; geçersizleme A kapsamında', async () => {
    const gate = delayedCreate()
    const h = harness(COORD_SCOPE)
    authSession.establish(login('acc-x'))
    const staleA = seedLists(h, h.store.snapshot)
    const create = h.run(() => useCreateWorkItemWithAssignees())
    const pending = create.submit({ target, body, extraAssignees: ['acc-2'] })
    await gate.arrived
    gate.release()
    const outcome = await pending

    expect(outcome.kind).toBe('complete')
    const [assign] = sent('POST', '/v1/work-items/w1/assignments')
    expect(assign!.body).toEqual({ account_ids: ['acc-2'] })
    expect(assign!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(staleA()).toEqual([true, true])
  })
})

describe('updateWorkItem — düzenleme sürümü', () => {
  it('yalnız dokunulan grubun sürümü gider; IK yok', async () => {
    server.use(http.patch(`${ORIGIN}/v1/work-items/w1`, () => json(workItem())))
    const h = harness(ADMIN_SCOPE)
    const update = h.run(() => useUpdateWorkItem())
    const base = workItem()
    await update.submit({ ...ref, base, changes: { title: 'Yeni' } })
    await update.submit({ ...ref, base, changes: { end_on: '2026-12-01' } })
    const [a, b] = sent('PATCH', '/v1/work-items/w1')
    expect(a!.body).toEqual({ title: 'Yeni', expected_revision: 3 })
    expect(b!.body).toEqual({ end_on: '2026-12-01', expected_dates_revision: 7 })
    expect(a!.headers.get('Idempotency-Key')).toBeNull()
    expect(a!.headers.get('X-Nizamio-Department')).toBe('d2')
  })

  it('409 edit_conflict: bayat grup + sunucunun güncel görevi (getWorkItem)', async () => {
    server.use(
      http.patch(`${ORIGIN}/v1/work-items/w1`, () =>
        errorEnvelope('work.edit_conflict', 409, [
          { field: 'expected_revision', code: 'work.edit_conflict' },
        ]),
      ),
      http.get(`${ORIGIN}/v1/work-items/w1`, () =>
        json(workItem({ title: 'Başkası', edit_revision: 4, description: '' })),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const update = h.run(() => useUpdateWorkItem())
    const outcome = await update.submit({ ...ref, base: workItem(), changes: { title: 'Benim' } })
    expect(outcome.kind).toBe('edit_conflict')
    if (outcome.kind !== 'edit_conflict') return
    expect(outcome.groups).toEqual(['expected_revision'])
    expect(outcome.server).toMatchObject({ title: 'Başkası', edit_revision: 4 })
    expect(sent('GET', '/v1/work-items/w1')[0]!.headers.get('X-Nizamio-Department')).toBe('d2')
  })
})

describe('geçiş ve silme', () => {
  it('transitionWorkItem: POST, gövde aynen, IK yok; başarıda alt görevler de yeniden okunur', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items/w1/transitions`, () =>
        json({ work_item_id: 'w1', from: 'devam_ediyor', to: 'tamamlandi', actor: 'koordinator' }),
      ),
    )
    const h = harness(COORD_SCOPE)
    const subtasksKey = queryKeys.workItems.subtasks(h.store.snapshot, 'w1')
    h.queryClient.setQueryData(subtasksKey, { seeded: true })
    const transition = h.run(() => useTransitionWorkItem())
    const outcome = await transition.submit({
      ...ref,
      body: { to: 'tamamlandi', close_subtasks: true },
    })
    expect(outcome.kind).toBe('success')
    const [req] = sent('POST', '/v1/work-items/w1/transitions')
    expect(req!.body).toEqual({ to: 'tamamlandi', close_subtasks: true })
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(h.queryClient.getQueryState(subtasksKey)?.isInvalidated).toBe(true)
  })

  it('409 work.subtasks_open başarısız sonuç olarak döner (otomatik tekrar yok)', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items/w1/transitions`, () =>
        errorEnvelope('work.subtasks_open', 409),
      ),
    )
    const h = harness(COORD_SCOPE)
    const transition = h.run(() => useTransitionWorkItem())
    const outcome = await transition.submit({ ...ref, body: { to: 'tamamlandi' } })
    expect(outcome).toMatchObject({ kind: 'failed', error: { code: 'work.subtasks_open' } })
    expect(sent('POST', '/v1/work-items/w1/transitions')).toHaveLength(1)
  })

  it('ownStatusWorkItem: PATCH own-status', async () => {
    server.use(
      http.patch(`${ORIGIN}/v1/work-items/w1/own-status`, () =>
        json({ work_item_id: 'w1', from: 'baslanmadi', to: 'devam_ediyor', actor: 'uye' }),
      ),
    )
    const h = harness(COORD_SCOPE)
    const own = h.run(() => useOwnStatusWorkItem())
    expect((await own.submit({ ...ref, body: { to: 'devam_ediyor' } })).kind).toBe('success')
    expect(sent('PATCH', '/v1/work-items/w1/own-status')).toHaveLength(1)
  })

  it('deleteWorkItem: DELETE, S3 görev başlıkları; başarıda liste yeniden okunur', async () => {
    server.use(http.delete(`${ORIGIN}/v1/work-items/w1`, () => json({ status: 'deleted' })))
    const h = harness(ADMIN_SCOPE)
    const { keys, stale } = seed(h)
    const remove = h.run(() => useDeleteWorkItem())
    const pending = remove.submit(ref)
    // Silme + geçersizleme sürerken görev "silinmekte" (panel 404'ü bulunamadı saymaz; W48).
    expect(isDeletingWorkItem('w1')).toBe(true)
    expect(isDeletingWorkItem('w2')).toBe(false)
    expect((await pending).kind).toBe('success')
    expect(isDeletingWorkItem('w1')).toBe(false)
    const [req] = sent('DELETE', '/v1/work-items/w1')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(stale(keys.list)).toBe(true)
  })
})
