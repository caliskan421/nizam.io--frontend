import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { createApp, defineComponent, ref } from 'vue'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { queryKeys } from '@/shared/http/query-keys'
import { purgeScopedQueries } from '@/shared/scope/lifecycle'
import { useScopeStore } from '@/shared/scope/store'

import { useDeletedAccounts, useDeletedWorkItems } from '../api/queries'

const ORIGIN = 'http://localhost'
const server = setupServer()
const seen: Array<{ path: string; program: string | null; query: URLSearchParams }> = []
server.events.on('request:start', ({ request }) => {
  const url = new URL(request.url)
  seen.push({
    path: url.pathname,
    program: request.headers.get('X-Nizamio-Program'),
    query: url.searchParams,
  })
})
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  seen.length = 0
  server.resetHandlers()
})
afterAll(() => server.close())

function setup(enabled: { tasks: boolean; accounts: boolean }) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const flags = { tasks: ref(enabled.tasks), accounts: ref(enabled.accounts) }
  let queries!: {
    tasks: ReturnType<typeof useDeletedWorkItems>
    accounts: ReturnType<typeof useDeletedAccounts>
  }
  const app = createApp(
    defineComponent({
      setup() {
        queries = {
          tasks: useDeletedWorkItems(flags.tasks),
          accounts: useDeletedAccounts(flags.accounts),
        }
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  return { client, store, flags, queries, app }
}

describe('silinen görev ve hesap okuyucuları', () => {
  it('görev: S2 program başlığı, limit 200, imleç sonraki sayfaya; hesap: S1 başlıksız', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/admin/deleted/work-items`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor')
        return Response.json(
          cursor
            ? { items: [] }
            : {
                items: [
                  {
                    work_item_id: 'w1',
                    title: 'T',
                    department_id: 'd1',
                    status: 's',
                    deleted_at: '2026-11-12T10:00:00Z',
                    file_count: 0,
                  },
                ],
                next_cursor: 'c2',
              },
        )
      }),
      http.get(`${ORIGIN}/v1/admin/deleted/accounts`, () =>
        Response.json({ accounts: [{ account_id: 'a1', full_name: 'Ayşe' }] }),
      ),
    )
    const { client, queries, app } = setup({ tasks: true, accounts: true })
    await settleQueries(client)
    expect(seen.map((r) => [r.path, r.program])).toEqual([
      ['/v1/admin/deleted/work-items', 'p1'],
      ['/v1/admin/deleted/accounts', null],
    ])
    expect(seen.every((r) => r.query.get('limit') === '200')).toBe(true)
    expect(queries.tasks.hasNextPage.value).toBe(true)
    expect(queries.accounts.hasNextPage.value).toBe(false)
    await queries.tasks.fetchNextPage()
    expect(seen[2]!.query.get('cursor')).toBe('c2')
    expect(queries.tasks.hasNextPage.value).toBe(false)
    app.unmount()
  })

  it('devre dışı sekme ağ isteği atmaz', async () => {
    const { client, app } = setup({ tasks: false, accounts: false })
    await settleQueries(client)
    expect(seen).toEqual([])
    app.unmount()
  })

  it('kapsam değişince S2 listesi düşer, hesap geneli liste kalır (K2)', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/admin/deleted/work-items`, () => Response.json({ items: [] })),
      http.get(`${ORIGIN}/v1/admin/deleted/accounts`, () => Response.json({ accounts: [] })),
    )
    const { client, store, app } = setup({ tasks: true, accounts: true })
    await settleQueries(client)
    const taskKey = queryKeys.deletedWorkItems.list(store.snapshot, { limit: 200 })
    const accountKey = queryKeys.deletedAccounts.list({ limit: 200 })
    expect(client.getQueryData(taskKey)).toBeDefined()
    expect(client.getQueryData(accountKey)).toBeDefined()
    purgeScopedQueries(client)
    expect(client.getQueryData(taskKey)).toBeUndefined()
    expect(client.getQueryData(accountKey)).toBeDefined()
    app.unmount()
  })
})
