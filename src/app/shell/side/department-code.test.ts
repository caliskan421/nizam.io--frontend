import { flushPromises } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useProgramDepartments } from '@/modules/work/public'
import { isScopedQueryKey, queryKeys } from '@/shared/http/query-keys'
import { isListTruncated } from '@/shared/http/truncation'
import { purgeScopedQueries } from '@/shared/scope/lifecycle'

import { createFakeLifecycle, setupWithScope, sideContext } from './__tests__/fake-lifecycle'
import { useDepartmentCode } from './department-code'

type Row = { department_id: string; display_name: string; code?: string }
type Fetcher = () => Promise<{ departments: Row[]; truncated?: true }>

async function boot(fetcher: Fetcher | undefined, active = true) {
  const ctx = await sideContext()
  const { lifecycle, store } = createFakeLifecycle({
    lenses: [{ lens: 'coordinator', departmentCount: 1 }],
    departments: [{ departmentId: 'd1', displayName: 'Sistem koordinatörlüğü' }],
  })
  store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
  const result = setupWithScope(ctx, lifecycle, () => useDepartmentCode(ref(active), fetcher))
  await flushPromises()
  return { ...result, ctx, store }
}

describe('dar menü birim kodu (E-00-40)', () => {
  it('ProgramDepartment.code department_id ile eşlenir; anahtar scoped departments', async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve({
        departments: [
          { department_id: 'd0', display_name: 'Başka', code: 'BAŞ' },
          { department_id: 'd1', display_name: 'Sistem koordinatörlüğü', code: 'SİS' },
        ],
      }),
    )
    const { code, ctx, store } = await boot(fetcher)
    expect(code.value).toBe('SİS')
    const key = queryKeys.departments.all(store.snapshot)
    // Paylaşılan anahtarın tek şekli: `{ departments, truncated? }` (dizi değil; W71c).
    expect(ctx.queryClient.getQueryData<{ departments: Row[] }>(key)?.departments).toHaveLength(2)
    expect(isScopedQueryKey(key)).toBe(true)
    purgeScopedQueries(ctx.queryClient)
    expect(ctx.queryClient.getQueryData(key)).toBeUndefined()
  })

  it('kod yoksa ya da okuma başarısızsa baş harf', async () => {
    const none = await boot(() =>
      Promise.resolve({ departments: [{ department_id: 'd1', display_name: 'x' }] }),
    )
    expect(none.code.value).toBe('SK')
    const failed = await boot(() => Promise.reject(new Error('403')))
    expect(failed.code.value).toBe('SK')
  })

  it('etkin değilken istenmez', async () => {
    const fetcher = vi.fn(() => Promise.resolve({ departments: [] }))
    const { code } = await boot(fetcher, false)
    expect(fetcher).not.toHaveBeenCalled()
    expect(code.value).toBe('SK')
  })
})

// Tek şekil (W71c): K/Ü merceğinde dar menü birim kodu ve 03 görev listesinin ad sözlüğü AYNI
// `scoped(['departments'])` anahtarını aynı anda okur → tek istek, ikisi de doğru veri (eskiden
// menü dizi yazıyordu; hangisi önce doldurursa öteki yanlış şekli okuyordu).
describe('scoped departments anahtarı: dar menü + görev listesi aynı anda (tek şekil)', () => {
  const server = setupServer(
    http.get('http://localhost/v1/program/departments', () =>
      HttpResponse.json(
        {
          departments: [
            { department_id: 'd0', display_name: 'Başka', code: 'BAS' },
            { department_id: 'd1', display_name: 'Sistem koordinatörlüğü', code: 'SIS' },
          ],
        },
        { headers: { 'X-Result-Truncated': 'true' } },
      ),
    ),
  )
  const seen: string[] = []
  server.events.on('request:start', ({ request }) => {
    seen.push(`${request.headers.get('X-Nizamio-Program')} ${new URL(request.url).pathname}`)
  })
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
  afterAll(() => server.close())

  it.each(['menü önce', 'liste önce'])('%s: tek istek, ikisi de doğru veri', async (order) => {
    seen.length = 0
    const ctx = await sideContext()
    const { lifecycle, store } = createFakeLifecycle({
      lenses: [{ lens: 'coordinator', departmentCount: 1 }],
      departments: [{ departmentId: 'd1', displayName: 'Sistem koordinatörlüğü' }],
    })
    store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    const both = setupWithScope(ctx, lifecycle, () => {
      if (order === 'menü önce') {
        const menu = useDepartmentCode(ref(true))
        return { menu, list: useProgramDepartments() }
      }
      const list = useProgramDepartments()
      return { menu: useDepartmentCode(ref(true)), list }
    })
    await vi.waitFor(() => expect(both.menu.code.value).toBe('SIS'))
    await flushPromises()
    expect(both.list.byId.value.get('d0')?.code).toBe('BAS')
    expect(seen).toEqual(['p1 /v1/program/departments'])
    const data = ctx.queryClient.getQueryData(queryKeys.departments.all(store.snapshot))
    expect(isListTruncated(data)).toBe(true)
  })
})
