// Sahte zaman çizelgesi sunucusunun sözleşme sadakati (CX-F3-Ö-06; WP2b: pin v0.15.0-api — satır
// `dates_revision`/`pending_date_request`/`subtask_counts`, `X-Result-Truncated`, extend/talep
// `Idempotency-Key` + `expected_dates_revision` + `replayed`). Pin v0.15.0-api —
// bağımlılık silme 200 `StatusResult`, uzatma 1–90 sınırı (dışı 422 `work.input_invalid` +
// alan kodu `work.extend_days_out_of_range`), bağımlılık ekleme tarih sırası (422 alan kodu
// `work.dependency_date_order`; sıra: tekrar 409, döngü 409, sonra tarih).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { addDays } from './fake-org-timeline'
import { createBackend, PEOPLE, seedTimeline } from './harness'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const ORIGIN = 'http://localhost'

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  backend.reset()
  seedTimeline(backend.db)
  backend.db.tokens.set('tok-admin', PEOPLE.admin.account_id)
})
afterEach(() => backend.reset())
afterAll(() => backend.server.close())

async function call(
  method: string,
  path: string,
  body?: unknown,
  extra: Record<string, string> = {},
) {
  const response = await fetch(`${ORIGIN}${path}`, {
    method,
    headers: {
      ...extra,
      Authorization: 'Bearer tok-admin',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      'X-Requested-With': 'XMLHttpRequest',
      'X-Nizamio-Program': 'p1',
      'X-Nizamio-Department': 'd1',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  return {
    status: response.status,
    truncated: response.headers.get('X-Result-Truncated'),
    body: (await response.json()) as Record<string, unknown>,
  }
}

const KEY = 'AAAAAAAAAAAAAAAAAAAAAA' // 22 bayt

describe('sahte sunucu — pin sözleşmesi', () => {
  it('bağımlılık silme 200 StatusResult döner ve kenarı kaldırır', async () => {
    const res = await call('DELETE', '/v1/work-items/w2/dependencies/dep-1')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'removed' })
    expect(backend.db.dependencies).toHaveLength(0)
  })

  it.each([0, -1, 91, 1.5, 'x'])(
    'uzatma days=%s → 422 work.input_invalid (alan kodu)',
    async (days) => {
      const res = await call('POST', '/v1/work-items/w1/extend', { days })
      expect(res.status).toBe(422)
      expect(res.body.code).toBe('work.input_invalid')
      expect(res.body.fields).toEqual([{ field: 'days', code: 'work.extend_days_out_of_range' }])
    },
  )

  it.each([1, 90])('uzatma days=%s sınır değeri kabul edilir', async (days) => {
    const res = await call('POST', '/v1/work-items/w1/extend', { days })
    expect(res.status).toBe(200)
  })

  it('bağımlılık ekleme: bağımlı, ön görevin bitişinden önce başlıyorsa 422 work.dependency_date_order', async () => {
    // w3 (11-04) → ön görev w4 (bitiş 12-11) olamaz; döngü/tekrar yok.
    const res = await call('POST', '/v1/work-items/w3/dependencies', {
      depends_on_work_item_id: 'w4',
    })
    expect(res.status).toBe(422)
    expect(res.body.code).toBe('work.input_invalid')
    expect(res.body.fields).toEqual([{ field: 'start_on', code: 'work.dependency_date_order' }])
    expect(backend.db.dependencies).toHaveLength(1)
  })

  it('tarih sırası uygunsa 201; döngü tarih denetiminden ÖNCE 409', async () => {
    backend.db.items.find((i) => i.work_item_id === 'w4')!.start_on = '2026-12-20'
    const ok = await call('POST', '/v1/work-items/w4/dependencies', {
      depends_on_work_item_id: 'w3',
    })
    expect(ok.status).toBe(201)
    const cycle = await call('POST', '/v1/work-items/w1/dependencies', {
      depends_on_work_item_id: 'w2',
    })
    expect(cycle.status).toBe(409)
    expect(cycle.body.code).toBe('work.dependency_cycle')
  })
})

describe('sahte sunucu — v0.15 Gantt satırı ve kesilme (BE-051/052/053/019)', () => {
  it('satır dates_revision, pending_date_request ve subtask_counts taşır', async () => {
    backend.db.subtasks.w1 = [
      { subtask_id: 's1', done: true },
      { subtask_id: 's2', done: false },
    ]
    const res = await call('GET', '/v1/work-items/gantt/admin')
    const row = (res.body.tasks as Record<string, unknown>[]).find((t) => t.work_item_id === 'w1')!
    expect(row.subtask_counts).toEqual({ total: 2, done: 1 })
    expect(row.dates_revision).toBe(1)
    expect(row).toHaveProperty('pending_date_request')
  })

  it('kesilme yalnız 200’den fazla kalemde X-Result-Truncated: true; tam 200 kalemde başlık yok', async () => {
    const make = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ ...backend.db.items[0]!, work_item_id: `m${i}` }))
    backend.db.items.splice(0, backend.db.items.length, ...make(200))
    expect((await call('GET', '/v1/work-items/gantt/admin')).truncated).toBeNull()
    backend.db.items.splice(0, backend.db.items.length, ...make(201))
    expect((await call('GET', '/v1/work-items/gantt/admin')).truncated).toBe('true')
  })
})

describe('sahte sunucu — Idempotency-Key ve expected_dates_revision (BE-056)', () => {
  it('uzatma: aynı anahtar + aynı istek 200 replayed:true ve TEK uzatma; farklı istek 409 reused', async () => {
    const before = backend.db.items.find((i) => i.work_item_id === 'w1')!.end_on as string
    const key = { 'Idempotency-Key': KEY }
    const first = await call('POST', '/v1/work-items/w1/extend', { days: 2 }, key)
    expect(first.body.replayed).toBe(false)
    const again = await call('POST', '/v1/work-items/w1/extend', { days: 2 }, key)
    expect(again.status).toBe(200)
    expect(again.body).toEqual({ ...first.body, replayed: true })
    expect(backend.db.items.find((i) => i.work_item_id === 'w1')!.end_on).toBe(addDays(before, 2))
    const other = await call('POST', '/v1/work-items/w1/extend', { days: 3 }, key)
    expect(other.status).toBe(409)
    expect(other.body.code).toBe('work.idempotency_key_reused')
  })

  it('anahtar uzunluğu 22–200 dışı 422 work.request_key_invalid', async () => {
    const res = await call(
      'POST',
      '/v1/work-items/w1/extend',
      { days: 2 },
      { 'Idempotency-Key': 'kisa' },
    )
    expect(res.status).toBe(422)
    expect(res.body.fields).toEqual([
      { field: 'idempotency_key', code: 'work.request_key_invalid' },
    ])
  })

  it('bayat expected_dates_revision → 409 work.edit_conflict; uzatma uygulanmaz', async () => {
    const before = backend.db.items.find((i) => i.work_item_id === 'w1')!.end_on
    const res = await call('POST', '/v1/work-items/w1/extend', {
      days: 2,
      expected_dates_revision: 99,
    })
    expect(res.status).toBe(409)
    expect(res.body.code).toBe('work.edit_conflict')
    expect(backend.db.items.find((i) => i.work_item_id === 'w1')!.end_on).toBe(before)
  })
})
