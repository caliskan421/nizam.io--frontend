/**
 * CX-F1-Ö-07 — sahibi sökülmüş ekranın geç sonucu (gerçek hook + MSW, geciktirilmiş yanıt).
 * İstek sahip yaşarken gider, yanıt sahip söküldükten sonra gelir: sonuç `isDetached` işaretli,
 * ortak bildirim (`notifyOutcome`) üretmez, `reachesOwner` `false`; geçersizleme yine yapılır.
 * Canlı sahipte ve sahipsiz hook'ta davranış değişmez.
 */
import { QueryClient } from '@tanstack/vue-query'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { effectScope } from 'vue'

import type { components } from '@/shared/api/schema'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { AuthSession } from '@/shared/session/auth-session'
import { notifyOutcome } from '@/shared/ui/confirm'
import { useToast } from '@/shared/ui'

import { BASE, noopCoordination } from '../../../../tests/support/fake-backend'
import { createApiClient } from '../client'
import { isDetached, reachesOwner } from './outcome'
import { useProtectedMutation, type ProtectedMutationOptions } from './use-protected-mutation'

type CreateBody = components['schemas']['CreateWorkItemRequest']
type Created = { work_item_id: string }

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  server.resetHandlers()
  useToast().clear()
})
afterAll(() => server.close())

const scope: ScopeSnapshot = { programId: 'p1', departmentId: 'd1' }
const session = new AuthSession({
  baseUrl: BASE,
  fetch: (r) => globalThis.fetch(r),
  coordination: noopCoordination(),
})
const api = createApiClient({ baseUrl: BASE, session, scope: () => scope })
const body: CreateBody = { title: 'Rapor', start_on: '2026-11-01', end_on: '2026-11-10' }

const createWorkItem: Omit<
  ProtectedMutationOptions<CreateBody, Created, unknown>,
  'queryClient'
> = {
  operation: 'createWorkItem',
  send: async (vars, ctx) => {
    const result = await api.POST('/v1/work-items', {
      params: { header: ctx.headers },
      body: vars,
    })
    return { ...result, data: result.data as Created | undefined }
  },
}

/** Yanıtı elle salınan uç: `reached` istek geldiğinde, `release` yanıtı verir. */
function heldEndpoint(respond: () => Response) {
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  let arrived!: () => void
  const reached = new Promise<void>((resolve) => (arrived = resolve))
  server.use(
    http.post(`${BASE}/v1/work-items`, async () => {
      arrived()
      await held
      return respond()
    }),
  )
  return { reached, release }
}

const failure = () =>
  HttpResponse.json(
    { code: 'work.invalid_input', message: 'x', request_id: 'r', fields: [] },
    { status: 422 },
  )

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const effect = effectScope()
  const mutation = effect.run(() =>
    useProtectedMutation<CreateBody, Created>({
      ...createWorkItem,
      scope: () => scope,
      queryClient,
    }),
  )!
  return { mutation, queryClient, stop: () => effect.stop() }
}

describe('useProtectedMutation — sökülmüş sahibin geç sonucu (CX-F1-Ö-07)', () => {
  it('istek beklerken sökülme → geç hata işaretli; ortak bildirim yok', async () => {
    const g = heldEndpoint(failure)
    const { mutation, stop } = setup()
    const pending = mutation.submit(body)
    await g.reached
    stop()
    g.release()
    const outcome = await pending
    expect(outcome.kind).toBe('failed')
    expect(isDetached(outcome)).toBe(true)
    expect(reachesOwner(outcome)).toBe(false)
    expect(notifyOutcome(outcome)).toBe(false)
    expect(useToast().queue.value).toEqual([])
  })

  it('istek beklerken sökülme → geç başarı işaretli; geçersizleme yine yapılır', async () => {
    const g = heldEndpoint(() => HttpResponse.json({ work_item_id: 'w1' }, { status: 201 }))
    const { mutation, queryClient, stop } = setup()
    const invalidated: unknown[] = []
    const original = queryClient.invalidateQueries.bind(queryClient)
    queryClient.invalidateQueries = (filters, options) => {
      invalidated.push(filters)
      return original(filters, options)
    }
    const pending = mutation.submit(body)
    await g.reached
    stop()
    g.release()
    const outcome = await pending
    expect(outcome.kind).toBe('success')
    expect(reachesOwner(outcome)).toBe(false)
    expect(invalidated.length).toBeGreaterThan(0)
  })

  it('canlı sahip: aynı geç hata işaretsiz, bildirilir (davranış aynı)', async () => {
    const g = heldEndpoint(failure)
    const { mutation, stop } = setup()
    const pending = mutation.submit(body)
    await g.reached
    g.release()
    const outcome = await pending
    expect(isDetached(outcome)).toBe(false)
    expect(reachesOwner(outcome)).toBe(true)
    expect(notifyOutcome(outcome)).toBe(true)
    expect(useToast().queue.value).toHaveLength(1)
    stop()
  })

  it('sahipsiz (kapsam dışı) hook: hiçbir sonuç işaretlenmez', async () => {
    const g = heldEndpoint(failure)
    const queryClient = new QueryClient()
    const mutation = useProtectedMutation<CreateBody, Created>({
      ...createWorkItem,
      scope: () => scope,
      queryClient,
    })
    const pending = mutation.submit(body)
    await g.reached
    g.release()
    expect(reachesOwner(await pending)).toBe(true)
  })
})
