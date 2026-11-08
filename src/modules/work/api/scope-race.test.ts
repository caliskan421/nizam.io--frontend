// W16 devri / CX-F0-E-06 kalan boşluk: korumalı yazmanın gönderim kapısı (engine
// `blockedSend`, kapsam A) ile HTTP ara katmanının kapsamı okuduğu an arasında kapsam B'ye
// geçerse istek A'nın (eylemin yakaladığı hedefin) başlığıyla gitmelidir. Yarış kontrollüdür:
// istemci yöntemi çağrıldığı an (kapıdan sonra, ara katmandan önce) depo B'ye çevrilir;
// gerçek bekleme yok.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type * as HttpModule from '@/shared/http'

import { queryKeys } from '@/shared/http/query-keys'

import {
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  workItem,
} from '../model/__tests__/harness'
import { departmentTarget } from '../model/target'
import { useCreateWorkItem } from './items'

const race = vi.hoisted(() => ({ armed: false }))

vi.mock('@/shared/http', async (importOriginal) => {
  const original = await importOriginal<typeof HttpModule>()
  const { useScopeStore: store } = await import('@/shared/scope/store')
  // Gönderim kapısından SONRA, ara katmandan ÖNCE: `send` istemci yöntemini çağırdığı an
  // kullanıcı kapsamı B'ye çevirmiş olsun.
  const flipThen =
    <F extends (...args: never[]) => unknown>(call: F) =>
    (...args: Parameters<F>) => {
      if (race.armed) {
        race.armed = false
        store().commit({ programId: 'p2', lens: 'coordinator', departmentId: 'd3' })
      }
      return call(...args)
    }
  const api = {
    ...original.api,
    GET: flipThen(original.api.GET),
    POST: flipThen(original.api.POST),
  }
  return { ...original, api }
})

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  race.armed = false
  resetHarness()
})
afterAll(() => server.close())

const body = { title: 'Rapor', start_on: '2026-11-01', end_on: '2026-11-10' }

describe('isteğe özel kapsam başlığı — kontrollü yarış', () => {
  it('kapı A, taşıma anında depo B: istek yine A hedefiyle gider; geçersizleme A kapsamında', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items`, () => json(workItem({ department_id: 'd1' }), 201)),
    )
    const h = harness({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    const scopeA = h.store.snapshot
    const listA = queryKeys.workItems.list(scopeA, { department: 'd1' })
    h.queryClient.setQueryData(listA, { seeded: true })
    const create = h.run(() => useCreateWorkItem())

    // Eylem anında hedef A'dan kurulur ve eylemle dondurulur.
    const target = departmentTarget(scopeA, 'd1')!
    race.armed = true
    const outcome = await create.submit({ target, body })

    expect(race.armed).toBe(false) // kapıdan sonra depo B'ye geçti
    expect(h.store.snapshot).toMatchObject({ programId: 'p2', departmentId: 'd3' })
    expect(outcome.kind).toBe('success')
    const [req] = sent('POST', '/v1/work-items')
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(h.queryClient.getQueryState(listA)?.isInvalidated).toBe(true)
  })

  it('denetim: açık başlık verilmeyen istek taşıma anındaki depo kapsamını (B) alır', async () => {
    server.use(http.get(`${ORIGIN}/v1/program`, () => json({})))
    const h = harness({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    const { api } = await import('@/shared/http')
    race.armed = true
    await api.GET('/v1/program')
    expect(h.store.snapshot.programId).toBe('p2')
    expect(sent('GET', '/v1/program')[0]!.headers.get('X-Nizamio-Program')).toBe('p2')
  })

  it('açık kapsam depo kapsamıyla KARIŞMAZ: S3 uçta yalnız program verilirse istek gönderilmez', async () => {
    const h = harness({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    const { api, unwrap } = await import('@/shared/http')
    await expect(
      unwrap(
        api.GET('/v1/work-items/{id}', {
          params: { header: { 'X-Nizamio-Program': 'p1' }, path: { id: 'w1' } },
        }),
      ),
    ).rejects.toMatchObject({ code: 'client.scope_missing' })
    expect(h.store.snapshot.departmentId).toBe('d1')
    expect(sent('GET', '/v1/work-items/w1')).toHaveLength(0)
  })
})
