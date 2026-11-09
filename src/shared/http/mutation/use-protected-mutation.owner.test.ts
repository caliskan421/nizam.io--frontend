/**
 * CX-F1-E-05 — ortak yazma katmanının sahip yaşamı kapısı (gerçek hook + MSW, çağrı sayısıyla).
 * Sahip (etki kapsamı) söküldükten sonra bu hook üzerinden YENİ HTTP yazması başlamaz: yeni
 * `submit`, `retry`, `confirm` devamı, `conflict_retry` otomatik tekrarı ve bileşik işlemin ardıl
 * adımı `owner_disposed` döner. Sahipsiz (kapsam dışı) hook eskisi gibi çalışır.
 */
import { QueryClient } from '@tanstack/vue-query'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { effectScope } from 'vue'

import type { components } from '@/shared/api/schema'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { AuthSession } from '@/shared/session/auth-session'

import { BASE, noopCoordination } from '../../../../tests/support/fake-backend'
import { createApiClient } from '../client'
import { outcomeMessage } from './outcome'
import { ownerLife } from './owner'
import { runWithFollowUps } from './partial'
import { useProtectedMutation, type ProtectedMutationOptions } from './use-protected-mutation'

type CreateBody = components['schemas']['CreateWorkItemRequest']
type Member = { id: string; accountId: string }

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  server.resetHandlers()
  calls.length = 0
})
afterAll(() => server.close())

/** Sunucuya ulaşan her yazma isteği (yöntem + yol). */
const calls: string[] = []
const scope: ScopeSnapshot = { programId: 'p1', departmentId: 'd1' }
const session = new AuthSession({
  baseUrl: BASE,
  fetch: (r) => globalThis.fetch(r),
  coordination: noopCoordination(),
})
const api = createApiClient({ baseUrl: BASE, session, scope: () => scope })
const body: CreateBody = { title: 'Rapor', start_on: '2026-11-01', end_on: '2026-11-10' }

type Created = { work_item_id: string }

const createWorkItem: Omit<
  ProtectedMutationOptions<CreateBody, Created, unknown>,
  'queryClient'
> = {
  operation: 'createWorkItem',
  send: async (vars, ctx) => {
    const result = await api.POST('/v1/work-items', { params: { header: ctx.headers }, body: vars })
    return { ...result, data: result.data as Created | undefined }
  },
}

const removeMember: Omit<ProtectedMutationOptions<Member, unknown, unknown>, 'queryClient'> = {
  operation: 'removeMember',
  send: (vars, ctx) =>
    api.DELETE('/v1/departments/{id}/memberships/{accountId}', {
      params: { path: vars, query: ctx.confirm ? { confirm: 'true' } : {}, header: ctx.headers },
    }),
}

const addAssignments: Omit<
  ProtectedMutationOptions<{ id: string; ids: string[] }, unknown, unknown>,
  'queryClient'
> = {
  operation: 'addAssignments',
  send: (vars, ctx) =>
    api.POST('/v1/work-items/{id}/assignments', {
      params: { path: { id: vars.id }, header: ctx.headers },
      body: { account_ids: vars.ids },
    }),
}

function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

/** Sahipli (etki kapsamında kurulmuş) hook; `stop` = bileşenin sökülmesi. */
function owned<V, D>(options: Omit<ProtectedMutationOptions<V, D, unknown>, 'queryClient'>) {
  const effect = effectScope()
  const mutation = effect.run(() =>
    useProtectedMutation<V, D>({ scope: () => scope, ...options, queryClient: client() }),
  )!
  return { mutation, stop: () => effect.stop() }
}

/** İlk isteği sunucuda bekletir: `reached` istek geldiğinde, `release` yanıtı serbest bırakır. */
function gate() {
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  let arrived!: () => void
  const reached = new Promise<void>((resolve) => (arrived = resolve))
  return { held, reached, release, arrived }
}

const conflictRetry = () =>
  HttpResponse.json(
    { code: 'platform.conflict_retry', message: 'x', request_id: 'r' },
    { status: 409 },
  )

describe('useProtectedMutation — sahip yaşamı (CX-F1-E-05)', () => {
  it('sökülmüş hook: submit HTTP göndermez, owner_disposed döner (taslak korunur, söz asılı kalmaz)', async () => {
    server.use(
      http.post(`${BASE}/v1/work-items`, () => {
        calls.push('POST')
        return HttpResponse.json({ id: 'w1' }, { status: 201 })
      }),
    )
    const { mutation, stop } = owned<CreateBody, Created>(createWorkItem)
    stop()
    const outcome = await mutation.submit(body)
    expect(outcome).toMatchObject({ kind: 'owner_disposed', draft: body })
    expect(calls).toEqual([])
    // Metin anahtarı i18n'de vardır; bildirim üretilmez (notify.test.ts).
    expect(outcomeMessage(outcome).key).toBe('mutation.outcome.owner_disposed')
  })

  it('sonuç bilinmiyor → sökülme → retry HTTP göndermez (owner_disposed, aynı anahtar)', async () => {
    server.use(
      http.post(`${BASE}/v1/work-items`, () => {
        calls.push('POST')
        return HttpResponse.error()
      }),
    )
    const { mutation, stop } = owned<CreateBody, Created>(createWorkItem)
    const first = await mutation.submit(body)
    if (first.kind !== 'unknown_outcome' || !first.retry) throw new Error(first.kind)
    stop()
    const again = await first.retry()
    expect(again).toMatchObject({ kind: 'owner_disposed', idempotencyKey: first.idempotencyKey })
    expect(calls).toEqual(['POST'])
  })

  it('confirmation_required → sökülme → confirm devamı HTTP göndermez', async () => {
    server.use(
      http.delete(`${BASE}/v1/departments/dep1/memberships/acc1`, () => {
        calls.push('DELETE')
        return HttpResponse.json(
          { code: 'organization.confirmation_required', message: 'x', request_id: 'r' },
          { status: 409 },
        )
      }),
    )
    const { mutation, stop } = owned<Member, unknown>(removeMember)
    const first = await mutation.submit({ id: 'dep1', accountId: 'acc1' })
    if (first.kind !== 'confirmation_required') throw new Error(first.kind)
    stop()
    expect((await first.confirm()).kind).toBe('owner_disposed')
    expect(calls).toEqual(['DELETE'])
  })

  it('conflict_retry otomatik tekrarı: ilk 409 beklerken sökülme → ikinci istek çıkmaz', async () => {
    const g = gate()
    server.use(
      http.post(`${BASE}/v1/work-items`, async () => {
        calls.push('POST')
        if (calls.length > 1) return HttpResponse.json({ id: 'w1' }, { status: 201 })
        g.arrived()
        await g.held
        return conflictRetry()
      }),
    )
    const { mutation, stop } = owned<CreateBody, Created>(createWorkItem)
    const pending = mutation.submit(body)
    await g.reached
    stop()
    g.release()
    expect((await pending).kind).toBe('owner_disposed')
    expect(calls).toEqual(['POST'])
  })

  it('bileşik: birincil beklerken sökülme → ardıl adım gönderilmez, birincil korunur, partial', async () => {
    const g = gate()
    server.use(
      http.post(`${BASE}/v1/work-items`, async () => {
        calls.push('create')
        g.arrived()
        await g.held
        return HttpResponse.json({ work_item_id: 'w1' }, { status: 201 })
      }),
      http.post(`${BASE}/v1/work-items/w1/assignments`, () => {
        calls.push('assign')
        return HttpResponse.json({}, { status: 201 })
      }),
    )
    const effect = effectScope()
    const [create, assign] = effect.run(() => [
      useProtectedMutation<CreateBody, Created>({
        ...createWorkItem,
        scope: () => scope,
        queryClient: client(),
      }),
      useProtectedMutation({ ...addAssignments, scope: () => scope, queryClient: client() }),
    ])!
    const pending = runWithFollowUps(
      () => create.submit(body),
      (item, context) => [
        {
          name: 'assignments',
          run: () => assign.submit({ id: item.work_item_id, ids: ['a2'] }, { context }),
        },
      ],
    )
    await g.reached
    effect.stop()
    g.release()
    const result = await pending
    expect(result.kind).toBe('partial')
    if (result.kind !== 'partial') throw new Error(result.kind)
    expect(result.primary).toMatchObject({ kind: 'success', data: { work_item_id: 'w1' } })
    expect(result.failed).toEqual(['assignments'])
    expect(result.steps[0]?.outcome.kind).toBe('owner_disposed')
    expect(calls).toEqual(['create'])
  })

  it('canlı sahip: conflict_retry otomatik tekrarı eskisi gibi tek kez gider', async () => {
    server.use(
      http.post(`${BASE}/v1/work-items`, () => {
        calls.push('POST')
        return calls.length === 1 ? conflictRetry() : HttpResponse.json({}, { status: 201 })
      }),
    )
    const { mutation, stop } = owned<CreateBody, Created>(createWorkItem)
    expect((await mutation.submit(body)).kind).toBe('success')
    expect(calls).toEqual(['POST', 'POST'])
    stop()
  })

  it('sahipsiz (etki kapsamı dışında kurulmuş) hook her zaman canlıdır: başka kapsamın sökülmesi etkilemez', async () => {
    server.use(
      http.post(`${BASE}/v1/work-items`, () => {
        calls.push('POST')
        return HttpResponse.json({ id: 'w1' }, { status: 201 })
      }),
    )
    const other = effectScope()
    other.run(() => ownerLife())
    const mutation = useProtectedMutation<CreateBody, Created>({
      ...createWorkItem,
      scope: () => scope,
      queryClient: client(),
    })
    other.stop()
    expect((await mutation.submit(body)).kind).toBe('success')
    expect(calls).toEqual(['POST'])
  })
})

describe('ownerLife', () => {
  it('kapsam dışında sahipsiz ve her zaman canlı; kapsamda sökülmeyle kalıcı olarak ölür', () => {
    const unowned = ownerLife()
    expect(unowned).toMatchObject({ owned: false })
    expect(unowned.alive()).toBe(true)

    const disposed: string[] = []
    const effect = effectScope()
    const life = effect.run(() => ownerLife(() => disposed.push(String(life.alive()))))!
    expect(life).toMatchObject({ owned: true })
    expect(life.alive()).toBe(true)
    effect.stop()
    expect(life.alive()).toBe(false)
    expect(disposed).toEqual(['false'])
  })
})
