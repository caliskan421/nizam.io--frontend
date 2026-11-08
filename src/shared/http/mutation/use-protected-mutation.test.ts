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
import { queryKeys } from '../query-keys'
import type { MutationOutcome } from './outcome'
import { useProtectedMutation, type ProtectedMutationOptions } from './use-protected-mutation'

type CreateBody = components['schemas']['CreateWorkItemRequest']

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  server.resetHandlers()
  keys.length = 0
})
afterAll(() => server.close())

const keys: Array<string | null> = []
const scope: ScopeSnapshot = { programId: 'p1', departmentId: 'd1' }
const api = createApiClient({
  baseUrl: BASE,
  session: new AuthSession({
    baseUrl: BASE,
    fetch: (r) => globalThis.fetch(r),
    coordination: noopCoordination(),
  }),
  scope: () => scope,
})
const body: CreateBody = { title: 'Rapor', start_on: '2026-11-01', end_on: '2026-11-10' }

function setup<V, D>(
  options: Omit<ProtectedMutationOptions<V, D, unknown>, 'queryClient' | 'scope'>,
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const effect = effectScope()
  const mutation = effect.run(() =>
    useProtectedMutation<V, D>({ ...options, queryClient, scope: () => scope }),
  )!
  return { mutation, queryClient, stop: () => effect.stop() }
}

const createWorkItem: Omit<
  ProtectedMutationOptions<CreateBody, unknown, unknown>,
  'queryClient'
> = {
  operation: 'createWorkItem',
  send: (vars, ctx) => api.POST('/v1/work-items', { params: { header: ctx.headers }, body: vars }),
}

function seed(queryClient: QueryClient) {
  const seeded = {
    list: queryKeys.workItems.list(scope, { status: 'yeni' }),
    item: queryKeys.workItems.item(scope, 'w1'),
    otherItem: queryKeys.workItems.item(scope, 'w2'),
    notes: queryKeys.workItems.notes(scope, 'w1'),
    gantt: queryKeys.gantt.face(scope, 'program'),
    me: queryKeys.me.root(),
    otherScopeList: queryKeys.workItems.list({ programId: 'p2', departmentId: 'd9' }, {}),
  }
  for (const key of Object.values(seeded)) queryClient.setQueryData(key, { seeded: true })
  const invalidated = (key: readonly unknown[]) =>
    queryClient.getQueryState(key)?.isInvalidated ?? false
  return { seeded, invalidated }
}

describe('useProtectedMutation', () => {
  it('başarı: §6 geçersizleme listesi yeniden okunur, başka kapsam ve kaynak dokunulmaz', async () => {
    server.use(
      http.post(`${BASE}/v1/work-items`, ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key'))
        return HttpResponse.json({ id: 'w1' }, { status: 201 })
      }),
    )
    const { mutation, queryClient, stop } = setup<CreateBody, unknown>({
      ...createWorkItem,
      invalidation: () => ({ workItemId: 'w1' }),
    })
    const { seeded, invalidated } = seed(queryClient)
    const outcome = await mutation.submit(body)
    expect(outcome.kind).toBe('success')
    expect(mutation.outcome.value?.kind).toBe('success')
    expect(invalidated(seeded.list)).toBe(true)
    expect(invalidated(seeded.item)).toBe(true)
    expect(invalidated(seeded.gantt)).toBe(true)
    expect(invalidated(seeded.otherItem)).toBe(false)
    expect(invalidated(seeded.notes)).toBe(false)
    expect(invalidated(seeded.me)).toBe(false)
    expect(invalidated(seeded.otherScopeList)).toBe(false)
    stop()
  })

  it('başarısızlıkta geçersizleme yok; iyimser güncelleme yok', async () => {
    server.use(
      http.post(`${BASE}/v1/work-items`, () =>
        HttpResponse.json(
          { code: 'work.not_authorized', message: 'x', request_id: 'r' },
          { status: 403 },
        ),
      ),
    )
    const { mutation, queryClient, stop } = setup<CreateBody, unknown>(createWorkItem)
    const { seeded, invalidated } = seed(queryClient)
    const outcome = await mutation.submit(body)
    expect(outcome.kind).toBe('failed')
    expect(invalidated(seeded.list)).toBe(false)
    expect(queryClient.getQueryData(seeded.list)).toEqual({ seeded: true })
    stop()
  })

  it('submit yeni anahtar; sonucun retry’ı aynı anahtar; isPending izlenir', async () => {
    let calls = 0
    server.use(
      http.post(`${BASE}/v1/work-items`, ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key'))
        calls += 1
        return calls === 1
          ? HttpResponse.error()
          : HttpResponse.json({ id: 'w1' }, { status: calls === 2 ? 200 : 201 })
      }),
    )
    const { mutation, stop } = setup<CreateBody, unknown>(createWorkItem)
    const pending = mutation.submit(body)
    await Promise.resolve()
    expect(mutation.isPending.value).toBe(true)
    const first = await pending
    expect(mutation.isPending.value).toBe(false)
    expect(first.kind).toBe('unknown_outcome')
    const retried = await (
      first as Extract<
        MutationOutcome<CreateBody, unknown>,
        {
          kind: 'unknown_outcome'
        }
      >
    ).retry!()
    expect(retried).toMatchObject({ kind: 'success', replayed: true })
    await mutation.submit(body)
    expect(keys[0]).toBe(keys[1])
    expect(keys[2]).not.toBe(keys[0])
    stop()
  })

  it('confirmation_required → confirm: üyelik geçersizlenir (me, users)', async () => {
    server.use(
      http.delete(`${BASE}/v1/departments/dep1/memberships/acc1`, ({ request }) =>
        new URL(request.url).searchParams.get('confirm') === 'true'
          ? HttpResponse.json({ membership_id: 'm1', unassigned_tasks: 1, warning: '' })
          : HttpResponse.json(
              {
                code: 'organization.confirmation_required',
                message: 'x',
                request_id: 'r',
                fields: [{ field: 'work_item', code: 'organization.task_title', message: 'Rapor' }],
              },
              { status: 409 },
            ),
      ),
    )
    const { mutation, queryClient, stop } = setup<{ id: string; accountId: string }, unknown>({
      operation: 'removeMember',
      send: (vars, ctx) =>
        api.DELETE('/v1/departments/{id}/memberships/{accountId}', {
          params: {
            path: vars,
            query: ctx.confirm ? { confirm: 'true' } : {},
            header: ctx.headers,
          },
        }),
    })
    const { seeded, invalidated } = seed(queryClient)
    queryClient.setQueryData(queryKeys.users.list({ q: '' }), [])
    const first = await mutation.submit({ id: 'dep1', accountId: 'acc1' })
    if (first.kind !== 'confirmation_required') throw new Error(first.kind)
    expect(first.taskTitles).toEqual(['Rapor'])
    expect(invalidated(seeded.me)).toBe(false)
    const second = await first.confirm()
    expect(second.kind).toBe('success')
    expect(invalidated(seeded.me)).toBe(true)
    expect(invalidated(queryKeys.users.list({ q: '' }))).toBe(true)
    expect(invalidated(seeded.list)).toBe(false)
    stop()
  })
})
