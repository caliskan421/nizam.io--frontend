import { QueryClient } from '@tanstack/vue-query'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { effectScope, isProxy, reactive, ref } from 'vue'

import type { components } from '@/shared/api/schema'
import type { ApiError } from '@/shared/errors/api-error'
import { onAuthorityLoss } from '@/shared/scope/authority-loss'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { AuthSession } from '@/shared/session/auth-session'

import { BASE, noopCoordination } from '../../../../tests/support/fake-backend'
import { createApiClient } from '../client'
import { queryKeys } from '../query-keys'
import type { MutationOutcome } from './outcome'
import {
  toPlainVars,
  useProtectedMutation,
  type ProtectedMutationOptions,
} from './use-protected-mutation'

type CreateBody = components['schemas']['CreateWorkItemRequest']

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  server.resetHandlers()
  keys.length = 0
  current = scope
})
afterAll(() => server.close())

const keys: Array<string | null> = []
const scope: ScopeSnapshot = { programId: 'p1', departmentId: 'd1' }
const scopeB: ScopeSnapshot = { programId: 'p2', departmentId: 'd2' }
/** İstemcinin ve kancanın okuduğu güncel kapsam (kullanıcı seçici ile değiştirir). */
let current: ScopeSnapshot = scope
const session = new AuthSession({
  baseUrl: BASE,
  fetch: (r) => globalThis.fetch(r),
  coordination: noopCoordination(),
})
const api = createApiClient({ baseUrl: BASE, session, scope: () => current })
const body: CreateBody = { title: 'Rapor', start_on: '2026-11-01', end_on: '2026-11-10' }

function setup<V, D>(
  options: Omit<ProtectedMutationOptions<V, D, unknown>, 'queryClient' | 'scope'>,
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const effect = effectScope()
  const mutation = effect.run(() =>
    useProtectedMutation<V, D>({
      generation: () => session.generation,
      ...options,
      queryClient,
      scope: () => current,
    }),
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

  it('A’da sonuç bilinmiyor → B’ye geçildi → retry gönderilmez (scope_changed)', async () => {
    let calls = 0
    server.use(
      http.post(`${BASE}/v1/work-items`, ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key'))
        calls += 1
        return calls === 1 ? HttpResponse.error() : HttpResponse.json({ id: 'w1' }, { status: 200 })
      }),
    )
    const { mutation, stop } = setup<CreateBody, unknown>(createWorkItem)
    const first = await mutation.submit(body)
    if (first.kind !== 'unknown_outcome') throw new Error(first.kind)

    current = scopeB
    const blocked = await first.retry!()
    expect(blocked).toMatchObject({ kind: 'scope_changed', scope, draft: body })
    expect(keys).toHaveLength(1)

    current = { ...scope }
    expect(await first.retry!()).toMatchObject({ kind: 'success', replayed: true })
    expect(keys).toEqual([first.idempotencyKey, first.idempotencyKey])
    stop()
  })

  it('başarı geçersizlemesi yakalanan kapsamla yapılır (gönderim sırasında kapsam değişse de)', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    let arrived!: () => void
    const reached = new Promise<void>((resolve) => (arrived = resolve))
    const programs: Array<string | null> = []
    server.use(
      http.post(`${BASE}/v1/work-items`, async ({ request }) => {
        programs.push(request.headers.get('X-Nizamio-Program'))
        arrived()
        await gate
        return HttpResponse.json({ id: 'w1' }, { status: 201 })
      }),
    )
    const { mutation, queryClient, stop } = setup<CreateBody, unknown>(createWorkItem)
    const { seeded, invalidated } = seed(queryClient)
    const listB = queryKeys.workItems.list(scopeB, { status: 'yeni' })
    queryClient.setQueryData(listB, { seeded: true })

    const pending = mutation.submit(body)
    await reached
    current = scopeB
    release()
    expect((await pending).kind).toBe('success')
    expect(programs).toEqual(['p1'])
    expect(invalidated(seeded.list)).toBe(true)
    expect(invalidated(listB)).toBe(false)
    stop()
  })

  it.each([
    ['organization.not_authorized', 403],
    ['work.program_scope_invalid', 404],
  ] as const)(
    '%s: sonuç failed döner ve QueryClient yetki kaybı kanalına yayınlanır',
    async (code, status) => {
      server.use(
        http.post(`${BASE}/v1/work-items`, () =>
          HttpResponse.json({ code, message: 'x', request_id: 'r' }, { status }),
        ),
      )
      const { mutation, queryClient, stop } = setup<CreateBody, unknown>(createWorkItem)
      const heard: ApiError[] = []
      const other: ApiError[] = []
      const off = onAuthorityLoss(queryClient, (e) => heard.push(e))
      const offOther = onAuthorityLoss(new QueryClient(), (e) => other.push(e))
      const outcome = await mutation.submit(body)
      expect(outcome).toMatchObject({ kind: 'failed', error: { code } })
      expect(heard.map((e) => e.code)).toEqual([code])
      expect(other).toEqual([])
      off()
      offOther()
      stop()
    },
  )

  it('conflict_retry otomatik tekrarı: ilk istek beklerken B’ye geçildi → ikinci istek çıkmaz', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    let arrived!: () => void
    const reached = new Promise<void>((resolve) => (arrived = resolve))
    const programs: Array<string | null> = []
    server.use(
      http.post(`${BASE}/v1/work-items`, async ({ request }) => {
        programs.push(request.headers.get('X-Nizamio-Program'))
        keys.push(request.headers.get('Idempotency-Key'))
        if (programs.length > 1) return HttpResponse.json({ id: 'w1' }, { status: 201 })
        arrived()
        await gate
        return HttpResponse.json(
          { code: 'platform.conflict_retry', message: 'x', request_id: 'r' },
          { status: 409 },
        )
      }),
    )
    const { mutation, queryClient, stop } = setup<CreateBody, unknown>(createWorkItem)
    const { seeded, invalidated } = seed(queryClient)

    const pending = mutation.submit(body)
    await reached
    current = scopeB
    release()
    const outcome = await pending

    expect(outcome).toMatchObject({ kind: 'scope_changed', scope, draft: body })
    expect(programs).toEqual(['p1'])
    expect(outcome.kind === 'scope_changed' && outcome.idempotencyKey).toBe(keys[0])
    expect(invalidated(seeded.list)).toBe(false)
    stop()
  })

  it('aynı kapsamda conflict_retry: aynı anahtarla tek otomatik tekrar gider', async () => {
    server.use(
      http.post(`${BASE}/v1/work-items`, ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key'))
        return keys.length === 1
          ? HttpResponse.json(
              { code: 'platform.conflict_retry', message: 'x', request_id: 'r' },
              { status: 409 },
            )
          : HttpResponse.json({ id: 'w1' }, { status: 201 })
      }),
    )
    const { mutation, stop } = setup<CreateBody, unknown>(createWorkItem)
    expect((await mutation.submit(body)).kind).toBe('success')
    expect(keys).toHaveLength(2)
    expect(keys[0]).toBe(keys[1])
    stop()
  })

  it('çıkış (oturum nesli değişti) → retry istek atmaz, session_ended', async () => {
    server.use(
      http.post(`${BASE}/v1/work-items`, ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key'))
        return HttpResponse.error()
      }),
    )
    const { mutation, stop } = setup<CreateBody, unknown>(createWorkItem)
    const first = await mutation.submit(body)
    if (first.kind !== 'unknown_outcome') throw new Error(first.kind)

    session.clear()
    const blocked = await first.retry!()
    expect(blocked).toMatchObject({ kind: 'failed', error: { code: 'client.session_ended' } })
    expect(keys).toHaveLength(1)
    stop()
  })

  it('çıkış (oturum nesli değişti) → confirm istek atmaz', async () => {
    let calls = 0
    server.use(
      http.delete(`${BASE}/v1/departments/dep1/memberships/acc1`, () => {
        calls += 1
        return HttpResponse.json(
          { code: 'organization.confirmation_required', message: 'x', request_id: 'r' },
          { status: 409 },
        )
      }),
    )
    const { mutation, stop } = setup<{ id: string; accountId: string }, unknown>({
      operation: 'removeMember',
      send: (vars, ctx) =>
        api.DELETE('/v1/departments/{id}/memberships/{accountId}', {
          params: { path: vars, header: ctx.headers },
        }),
    })
    const first = await mutation.submit({ id: 'dep1', accountId: 'acc1' })
    if (first.kind !== 'confirmation_required') throw new Error(first.kind)
    session.clear()
    expect(await first.confirm()).toMatchObject({
      kind: 'failed',
      error: { code: 'client.session_ended' },
    })
    expect(calls).toBe(1)
    stop()
  })
})

describe('submit(vars, { context }) — bileşik işlemde ilk eylemin bağlamı (CX-F1-E-03)', () => {
  it('başarı bağlamı taşır; aynı bağlam güncelken gider, B’de / nesil değişince gönderilmez', async () => {
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
    const first = await mutation.submit(body)
    if (first.kind !== 'success') throw new Error(first.kind)
    const context = first.context!
    expect(context).toEqual({ scope, generation: session.generation })
    expect((await mutation.submit(body, { context })).kind).toBe('success')
    expect(keys).toHaveLength(2)

    current = scopeB
    const listB = queryKeys.workItems.list(scopeB, {})
    queryClient.setQueryData(listB, { seeded: true })
    expect(await mutation.submit(body, { context })).toMatchObject({ kind: 'scope_changed', scope })
    current = scope
    session.clear()
    expect(await mutation.submit(body, { context })).toMatchObject({
      kind: 'failed',
      error: { code: 'client.session_ended' },
    })
    expect(keys).toHaveLength(2)
    expect(queryClient.getQueryState(listB)?.isInvalidated).toBe(false)
    stop()
  })
})

describe('başarısız sonuç da eylem bağlamını taşır (CX-F1-E-02)', () => {
  it('sunucu hatası → failed.context = eylemin kapsamı + nesli; istemci kapısı hatasında yok', async () => {
    server.use(
      http.post(`${BASE}/v1/work-items`, () =>
        HttpResponse.json(
          { code: 'work.subtasks_open', message: 'x', request_id: 'r' },
          { status: 409 },
        ),
      ),
    )
    const { mutation, stop } = setup<CreateBody, unknown>(createWorkItem)
    const failed = await mutation.submit(body)
    expect(failed).toMatchObject({
      kind: 'failed',
      context: { scope, generation: session.generation },
    })
    if (failed.kind !== 'failed') throw new Error(failed.kind)
    session.clear()
    const blocked = await mutation.submit(body, { context: failed.context })
    expect(blocked).toMatchObject({ kind: 'failed', error: { code: 'client.session_ended' } })
    expect(blocked.kind === 'failed' && blocked.context).toBeUndefined()
    stop()
  })
})

describe('Vue vekili taşıyan değişkenler (toPlainVars)', () => {
  it('reactive + iç içe ref: gönderim başarılı, gövde dondurulmuş düz kopya', async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(`${BASE}/v1/work-items`, async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({ id: 'w1' }, { status: 201 })
      }),
    )
    let seen: unknown
    const { mutation, stop } = setup<CreateBody, unknown>({
      operation: 'createWorkItem',
      send: (vars, ctx) => {
        seen = vars
        return api.POST('/v1/work-items', { params: { header: ctx.headers }, body: vars })
      },
    })
    const form = reactive({ ...body, title: ref('Taslak') })
    const outcome = await mutation.submit(form)
    expect(outcome.kind).toBe('success')
    expect(isProxy(seen)).toBe(false)
    expect(seen).toEqual({ ...body, title: 'Taslak' })
    expect(bodies).toEqual([{ ...body, title: 'Taslak' }])
    // Gönderimden sonra formu değiştirmek dondurulmuş gövdeyi etkilemez.
    ;(form as { title: string }).title = 'Değişti'
    expect(seen).toEqual({ ...body, title: 'Taslak' })
    stop()
  })

  it('File/Blob/FormData/Date aynen korunur; diziler ve döngüler açılır', () => {
    const file = new File(['abc'], 'a.txt')
    const form = new FormData()
    const date = new Date(0)
    const node: Record<string, unknown> = { name: 'kök' }
    node.self = node
    const input = reactive({ file, form, date, list: [ref(1), reactive({ x: 2 })], node })
    const plain = toPlainVars(input)
    expect(isProxy(plain)).toBe(false)
    expect(plain.file).toBe(file)
    expect(plain.form).toBe(form)
    expect(plain.date).toBe(date)
    expect(plain.list).toEqual([1, { x: 2 }])
    expect(isProxy(plain.list[1])).toBe(false)
    expect(plain.node.self).toBe(plain.node)
  })
})
