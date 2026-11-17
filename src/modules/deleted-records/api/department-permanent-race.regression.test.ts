import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest'
import { createApp, defineComponent } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'

import { usePermanentDeleteDepartment } from './writes'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let write!: ReturnType<typeof usePermanentDeleteDepartment>
  const app = createApp(
    defineComponent({
      setup() {
        write = usePermanentDeleteDepartment()
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  const scopes = [
    { programId: 'p1', departmentId: 'd1' },
    { programId: 'p2', departmentId: 'd2' },
  ]
  const affected = scopes.flatMap((scope) => [
    queryKeys.workItems.list(scope, {}),
    queryKeys.workItems.files(scope, 'w1'),
    queryKeys.deletedWorkItems.list(scope, {}),
    queryKeys.archive.list(scope, 'files', {}),
  ])
  for (const key of affected) client.setQueryData(key, 1)
  return { app, client, write, affected }
}

it('kalıcı departman silmede restore yarışı 409 kalsa da iki programın kısmi etkileri yeniden okunur', async () => {
  let calls = 0
  server.use(
    http.delete('http://localhost/v1/admin/permanent/departments/d1', () => {
      calls++
      return HttpResponse.json(
        { code: 'organization.permanent_requires_deleted', message: 'x', request_id: 'r' },
        { status: 409 },
      )
    }),
  )
  const { app, client, write, affected } = setup()
  try {
    const outcome = await write.submit({ programId: 'p1', id: 'd1' })
    expect(outcome).toMatchObject({
      kind: 'failed',
      error: { code: 'organization.permanent_requires_deleted' },
    })
    expect(calls).toBe(1)
    expect(affected.filter((key) => !client.getQueryState(key)?.isInvalidated)).toEqual([])
  } finally {
    app.unmount()
  }
})

it('ön kapı tablo engeli 409, kısmi zincir etkisi olmadığı için görev önbelleğini bayatlatmaz', async () => {
  let calls = 0
  server.use(
    http.delete('http://localhost/v1/admin/permanent/departments/d1', () => {
      calls++
      return HttpResponse.json(
        { code: 'organization.department_in_use', message: 'x', request_id: 'r' },
        { status: 409 },
      )
    }),
  )
  const { app, client, write, affected } = setup()
  try {
    const outcome = await write.submit({ programId: 'p1', id: 'd1' })
    expect(outcome).toMatchObject({
      kind: 'failed',
      error: { code: 'organization.department_in_use' },
    })
    expect(calls).toBe(1)
    expect(affected.every((key) => !client.getQueryState(key)?.isInvalidated)).toBe(true)
  } finally {
    app.unmount()
  }
})
