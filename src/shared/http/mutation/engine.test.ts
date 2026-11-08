import { HttpResponse, delay, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { components } from '@/shared/api/schema'
import { AuthSession } from '@/shared/session/auth-session'

import { BASE, noopCoordination } from '../../../../tests/support/fake-backend'
import { createApiClient } from '../client'
import {
  RETRY_WINDOW_MS,
  newAction,
  runAction,
  type EngineOptions,
  type MutationAction,
  type Rerun,
} from './engine'
import { isValidIdempotencyKey } from './idempotency-key'
import type { MutationOutcome } from './outcome'

type CreateBody = components['schemas']['CreateWorkItemRequest']

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  server.resetHandlers()
  seen.length = 0
})
afterAll(() => server.close())

interface Seen {
  method: string
  path: string
  key: string | null
  csrf: string | null
  body: string
  search: string
}
const seen: Seen[] = []

async function record(request: Request, readBody = true): Promise<Seen> {
  const url = new URL(request.url)
  const entry = {
    method: request.method,
    path: url.pathname,
    key: request.headers.get('Idempotency-Key'),
    csrf: request.headers.get('X-Requested-With'),
    body: readBody ? await request.clone().text() : '',
    search: url.search,
  }
  seen.push(entry)
  return entry
}

const envelope = (code: string, extra: Record<string, unknown> = {}) => ({
  code,
  message: 'sunucu metni — gösterilmez',
  request_id: 'req-1',
  ...extra,
})

function client() {
  const session = new AuthSession({
    baseUrl: BASE,
    fetch: (r) => globalThis.fetch(r),
    coordination: noopCoordination(),
  })
  return createApiClient({
    baseUrl: BASE,
    session,
    scope: () => ({ programId: 'p1', departmentId: 'd1' }),
  })
}

const api = client()
const body: CreateBody = { title: 'Rapor', start_on: '2026-11-01', end_on: '2026-11-10' }

function createOptions(
  extra: Partial<EngineOptions<CreateBody, unknown, unknown>> = {},
): EngineOptions<CreateBody, unknown, unknown> {
  return {
    operation: 'createWorkItem',
    send: (vars, ctx) =>
      api.POST('/v1/work-items', {
        params: { header: ctx.headers },
        body: vars,
        signal: ctx.signal,
      }),
    ...extra,
  }
}

function run<V, D, S>(action: MutationAction<V>, opts: EngineOptions<V, D, S>) {
  const rerun: Rerun<V, D, S> = (next) => runAction(next, opts, rerun)
  return runAction(action, opts, rerun)
}

function expectKind<K extends MutationOutcome<unknown, unknown>['kind']>(
  outcome: MutationOutcome<unknown, unknown, unknown>,
  kind: K,
): Extract<MutationOutcome<unknown, unknown, unknown>, { kind: K }> {
  expect(outcome.kind).toBe(kind)
  return outcome as Extract<MutationOutcome<unknown, unknown, unknown>, { kind: K }>
}

describe('yazma motoru — başarı', () => {
  it('201: anahtar + X-Requested-With gider, tekrar değil', async () => {
    server.use(
      http.post(`${BASE}/v1/work-items`, async ({ request }) => {
        await record(request)
        return HttpResponse.json({ id: 'w1' }, { status: 201 })
      }),
    )
    const action = newAction(body)
    const outcome = expectKind(await run(action, createOptions()), 'success')
    expect(outcome).toMatchObject({ status: 201, replayed: false, data: { id: 'w1' } })
    expect(seen).toHaveLength(1)
    expect(seen[0]!.key).toBe(action.idempotencyKey)
    expect(isValidIdempotencyKey(seen[0]!.key!)).toBe(true)
    expect(seen[0]!.csrf).toBe('XMLHttpRequest')
    expect(JSON.parse(seen[0]!.body)).toEqual(body)
  })

  it('200 aynı anahtarın ilk kaynağı: tekrar sonrası başarı, replayed', async () => {
    let calls = 0
    server.use(
      http.post(`${BASE}/v1/work-items`, async ({ request }) => {
        await record(request)
        calls += 1
        if (calls === 1) return HttpResponse.error()
        return HttpResponse.json({ id: 'w1' }, { status: 200 })
      }),
    )
    const first = expectKind(await run(newAction(body), createOptions()), 'unknown_outcome')
    const second = expectKind(await first.retry!(), 'success')
    expect(second).toMatchObject({ status: 200, replayed: true })
    expect(seen.map((s) => s.key)).toEqual([first.idempotencyKey, first.idempotencyKey])
  })
})

describe('yazma motoru — anahtar yaşam döngüsü (CX-S-02)', () => {
  it('ağ tekrarında aynı anahtar + aynı gövde; taslak sonradan değişse de gövde sabit', async () => {
    let calls = 0
    server.use(
      http.post(`${BASE}/v1/work-items`, async ({ request }) => {
        await record(request)
        calls += 1
        return calls < 3
          ? HttpResponse.json(envelope('platform.unavailable'), { status: 503 })
          : HttpResponse.json({ id: 'w1' }, { status: 201 })
      }),
    )
    const draft = { ...body }
    const first = expectKind(await run(newAction(draft), createOptions()), 'unknown_outcome')
    draft.title = 'Kullanıcı formu sonradan değiştirdi'
    const second = expectKind(await first.retry!(), 'unknown_outcome')
    expect(second.idempotencyKey).toBe(first.idempotencyKey)
    expectKind(await second.retry!(), 'success')
    expect(new Set(seen.map((s) => s.key)).size).toBe(1)
    expect(new Set(seen.map((s) => s.body)).size).toBe(1)
    expect(JSON.parse(seen[2]!.body).title).toBe('Rapor')
  })

  it('düzeltip yeniden gönderme yeni eylemdir: yeni anahtar', async () => {
    server.use(
      http.post(`${BASE}/v1/work-items`, async ({ request }) => {
        await record(request)
        return HttpResponse.json({ id: 'w1' }, { status: 201 })
      }),
    )
    await run(newAction(body), createOptions())
    await run(newAction({ ...body, title: 'Düzeltilmiş' }), createOptions())
    await run(newAction(body), createOptions())
    const keys = seen.map((s) => s.key)
    expect(new Set(keys).size).toBe(3)
  })
})

describe('yazma motoru — sınıflar', () => {
  it('platform.conflict_retry: aynı anahtarla tek otomatik tekrar → başarı', async () => {
    let calls = 0
    server.use(
      http.post(`${BASE}/v1/work-items`, async ({ request }) => {
        await record(request)
        calls += 1
        return calls === 1
          ? HttpResponse.json(envelope('platform.conflict_retry'), { status: 409 })
          : HttpResponse.json({ id: 'w1' }, { status: 201 })
      }),
    )
    expectKind(await run(newAction(body), createOptions()), 'success')
    expect(seen).toHaveLength(2)
    expect(seen[0]!.key).toBe(seen[1]!.key)
    expect(seen[0]!.body).toBe(seen[1]!.body)
  })

  it('platform.conflict_retry ikinci kez: conflict_retry, üçüncü gönderim yok', async () => {
    server.use(
      http.post(`${BASE}/v1/work-items`, async ({ request }) => {
        await record(request)
        return HttpResponse.json(envelope('platform.conflict_retry'), { status: 409 })
      }),
    )
    expectKind(await run(newAction(body), createOptions()), 'conflict_retry')
    expect(seen).toHaveLength(2)
  })

  it('*.idempotency_key_reused: otomatik tekrar yok', async () => {
    server.use(
      http.post(`${BASE}/v1/work-items`, async ({ request }) => {
        await record(request)
        return HttpResponse.json(envelope('work.idempotency_key_reused'), { status: 409 })
      }),
    )
    const outcome = expectKind(
      await run(newAction(body), createOptions()),
      'idempotency_key_reused',
    )
    expect(outcome.error.code).toBe('work.idempotency_key_reused')
    expect(seen).toHaveLength(1)
  })

  it('429: Retry-After saniyesi taşınır, otomatik tekrar yok', async () => {
    server.use(
      http.post(`${BASE}/v1/work-items`, async ({ request }) => {
        await record(request)
        return HttpResponse.json(envelope('platform.rate_limited'), {
          status: 429,
          headers: { 'Retry-After': '42' },
        })
      }),
    )
    const outcome = expectKind(await run(newAction(body), createOptions()), 'rate_limited')
    expect(outcome.retryAfter).toBe(42)
    expect(seen).toHaveLength(1)
  })

  it('sonuç bilinmiyor: ağ hatası, 503 ve zaman aşımı; taslak + anahtar korunur', async () => {
    const cases: Array<[string, () => Promise<Response> | Response, string]> = [
      ['network', () => HttpResponse.error(), 'network'],
      ['503', () => HttpResponse.json(envelope('platform.unavailable'), { status: 503 }), 'server'],
      ['502 düz metin', () => new HttpResponse('Bad gateway', { status: 502 }), 'server'],
      [
        'timeout',
        async () => {
          await delay('infinite')
          return HttpResponse.json({})
        },
        'timeout',
      ],
    ]
    for (const [, respond, reason] of cases) {
      server.use(http.post(`${BASE}/v1/work-items`, () => respond()))
      const action = newAction(body)
      const outcome = expectKind(
        await run(action, createOptions({ timeoutMs: 30 })),
        'unknown_outcome',
      )
      expect(outcome.reason).toBe(reason)
      expect(outcome.draft).toEqual(body)
      expect(outcome.idempotencyKey).toBe(action.idempotencyKey)
      expect(outcome.retry).toBeTypeOf('function')
    }
  })

  it('sonuç bilinmiyor: 24 saat sonra retry yok', async () => {
    server.use(http.post(`${BASE}/v1/work-items`, () => HttpResponse.error()))
    let clock = 1_000
    const now = () => clock
    const first = expectKind(
      await run(newAction(body, { now }), createOptions({ now })),
      'unknown_outcome',
    )
    clock += RETRY_WINDOW_MS - 1
    const second = expectKind(await first.retry!(), 'unknown_outcome')
    expect(second.retry).not.toBeNull()
    clock += 1
    const third = expectKind(await second.retry!(), 'unknown_outcome')
    expect(third.retry).toBeNull()
  })

  it('diğer hatalar failed: kod korunur, sunucu metni taşınmaz', async () => {
    server.use(
      http.post(`${BASE}/v1/work-items`, () =>
        HttpResponse.json(
          envelope('work.input_invalid', {
            fields: [{ field: 'title', code: 'work.title_required', message: 'x' }],
          }),
          { status: 422 },
        ),
      ),
    )
    const outcome = expectKind(await run(newAction(body), createOptions()), 'failed')
    expect(outcome.error.code).toBe('work.input_invalid')
    expect(outcome.error.fields[0]).toMatchObject({ field: 'title', code: 'work.title_required' })
    expect(outcome.error.message).not.toContain('sunucu metni')
  })
})

describe('yazma motoru — edit_conflict', () => {
  type Patch = components['schemas']['UpdateWorkItemRequest']

  it('alanlar + sunucunun güncel değeri; otomatik tekrar yok', async () => {
    let patches = 0
    server.use(
      http.patch(`${BASE}/v1/work-items/w1`, async ({ request }) => {
        await record(request)
        patches += 1
        return HttpResponse.json(
          envelope('work.edit_conflict', {
            fields: [{ field: 'expected_revision', code: 'work.edit_conflict', message: 'x' }],
          }),
          { status: 409 },
        )
      }),
      http.get(`${BASE}/v1/work-items/w1`, () =>
        HttpResponse.json({ id: 'w1', title: 'Sunucu', edit_revision: 4 }),
      ),
    )
    const draft: Patch = { title: 'Benim', expected_revision: 3 }
    const outcome = expectKind(
      await run(newAction(draft), {
        operation: 'updateWorkItem',
        send: (vars, ctx) =>
          api.PATCH('/v1/work-items/{id}', {
            params: { path: { id: 'w1' }, header: ctx.headers },
            body: vars,
          }),
        readCurrent: async () => {
          const res = await api.GET('/v1/work-items/{id}', { params: { path: { id: 'w1' } } })
          return res.data
        },
      }),
      'edit_conflict',
    )
    expect(outcome.groups).toEqual(['expected_revision'])
    expect(outcome.draft).toEqual(draft)
    expect(outcome.server).toMatchObject({ title: 'Sunucu', edit_revision: 4 })
    expect(patches).toBe(1)
    expect(seen[0]!.csrf).toBe('XMLHttpRequest')
  })

  it('güncel değer okunamazsa server null', async () => {
    server.use(
      http.post(`${BASE}/v1/work-items`, () =>
        HttpResponse.json(envelope('work.edit_conflict', { fields: [] }), { status: 409 }),
      ),
    )
    const outcome = expectKind(
      await run(
        newAction(body),
        createOptions({ readCurrent: () => Promise.reject(new Error('okunamadı')) }),
      ),
      'edit_conflict',
    )
    expect(outcome.server).toBeNull()
  })
})

describe('yazma motoru — confirmation_required (yalnız organizasyon uçları)', () => {
  const path = `${BASE}/v1/departments/dep1/memberships/acc1`
  const confirmEnvelope = envelope('organization.confirmation_required', {
    fields: [
      { field: 'work_item', code: 'organization.task_title', message: 'Rapor yaz' },
      { field: 'work_item', code: 'organization.task_title', message: 'Sunum' },
    ],
  })

  const removeOptions: EngineOptions<{ id: string; accountId: string }, unknown, unknown> = {
    operation: 'removeMember',
    send: (vars, ctx) =>
      api.DELETE('/v1/departments/{id}/memberships/{accountId}', {
        params: {
          path: vars,
          query: ctx.confirm ? { confirm: 'true' } : {},
          header: ctx.headers,
        },
      }),
  }

  it('fields[] görev başlıkları + confirm → ?confirm=true ile yeni eylem', async () => {
    server.use(
      http.delete(path, async ({ request }) => {
        const entry = await record(request)
        return entry.search.includes('confirm=true')
          ? HttpResponse.json({ membership_id: 'm1', unassigned_tasks: 2, warning: '' })
          : HttpResponse.json(confirmEnvelope, { status: 409 })
      }),
    )
    const first = expectKind(
      await run(newAction({ id: 'dep1', accountId: 'acc1' }), removeOptions),
      'confirmation_required',
    )
    expect(first.taskTitles).toEqual(['Rapor yaz', 'Sunum'])
    const second = expectKind(await first.confirm(), 'success')
    expect(second.data).toMatchObject({ unassigned_tasks: 2 })
    expect(seen.map((s) => s.search)).toEqual(['', '?confirm=true'])
    expect(seen[0]!.key).not.toBe(seen[1]!.key)
    expect(seen.every((s) => s.csrf === 'XMLHttpRequest')).toBe(true)
  })

  it('onaylı istek yine 409 dönerse failed (döngü yok)', async () => {
    server.use(http.delete(path, () => HttpResponse.json(confirmEnvelope, { status: 409 })))
    const first = expectKind(
      await run(newAction({ id: 'dep1', accountId: 'acc1' }), removeOptions),
      'confirmation_required',
    )
    expectKind(await first.confirm(), 'failed')
  })

  it('organizasyon dışı uçta aynı kod failed sayılır (istemci onay diyaloğu ayrı)', async () => {
    server.use(
      http.delete(`${BASE}/v1/work-items/w1`, () =>
        HttpResponse.json(confirmEnvelope, { status: 409 }),
      ),
    )
    const outcome = await run(newAction({}), {
      operation: 'deleteWorkItem',
      send: (_vars, ctx) =>
        api.DELETE('/v1/work-items/{id}', { params: { path: { id: 'w1' }, header: ctx.headers } }),
    })
    expect(expectKind(outcome, 'failed').error.code).toBe('organization.confirmation_required')
  })
})

describe('X-Requested-With istisnasız', () => {
  it('sözleşmenin CSRF istemediği attachFile da başlığı taşır', async () => {
    server.use(
      http.post(`${BASE}/v1/work-items/w1/files`, async ({ request }) => {
        await record(request, false)
        return HttpResponse.json({ file_id: 'f1' }, { status: 201 })
      }),
    )
    const outcome = await run(newAction({ name: 'a.txt' }), {
      operation: 'attachFile',
      send: (vars, ctx) =>
        api.POST('/v1/work-items/{id}/files', {
          params: { path: { id: 'w1' }, query: { tag: 'ister' }, header: ctx.headers },
          body: { file: vars.name },
          bodySerializer: () => {
            const form = new FormData()
            form.append('file', new Blob(['x']), vars.name)
            return form
          },
        }),
    })
    expectKind(outcome, 'success')
    expect(seen[0]!.csrf).toBe('XMLHttpRequest')
    expect(seen[0]!.key).not.toBeNull()
  })
})
