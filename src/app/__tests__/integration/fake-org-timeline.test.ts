// Sahte zaman çizelgesi sunucusunun sözleşme sadakati (CX-F3-Ö-06): pin v0.11.0-api —
// bağımlılık silme 200 `StatusResult`, uzatma 1–90 sınırı (dışı 422 `work.input_invalid` +
// alan kodu `work.extend_days_out_of_range`), bağımlılık ekleme tarih sırası (422 alan kodu
// `work.dependency_date_order`; sıra: tekrar 409, döngü 409, sonra tarih).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

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

async function call(method: string, path: string, body?: unknown) {
  const response = await fetch(`${ORIGIN}${path}`, {
    method,
    headers: {
      Authorization: 'Bearer tok-admin',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      'X-Requested-With': 'XMLHttpRequest',
      'X-Nizamio-Program': 'p1',
      'X-Nizamio-Department': 'd1',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  return { status: response.status, body: (await response.json()) as Record<string, unknown> }
}

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
