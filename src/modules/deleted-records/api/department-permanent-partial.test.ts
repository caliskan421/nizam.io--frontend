import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest'
import { createApp, defineComponent } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'

import { usePermanentDeleteDepartment, usePermanentDeleteWorkItem } from './writes'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function setup<T>(use: () => T) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let write!: T
  const app = createApp(
    defineComponent({
      setup() {
        write = use()
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  const keys = ['p1', 'p2'].map((programId) =>
    queryKeys.workItems.list({ programId, departmentId: null }, {}),
  )
  for (const key of keys) client.setQueryData(key, 1)
  const stale = () => keys.map((key) => client.getQueryState(key)?.isInvalidated === true)
  return { app, write, stale }
}

const reply = (path: string, status: number, code: string) =>
  http.delete(`http://localhost${path}`, () =>
    HttpResponse.json({ code, message: 'x', request_id: 'r' }, { status }),
  )

it('5xx sonuç bilinmiyor: iki program yeniden okunur, yeniden deneme verilmez', async () => {
  server.use(reply('/v1/admin/permanent/departments/d1', 503, 'platform.unavailable'))
  const { app, write, stale } = setup(usePermanentDeleteDepartment)
  try {
    const outcome = await write.submit({ programId: 'p1', id: 'd1' })
    expect(outcome).toMatchObject({ kind: 'unknown_outcome', retry: null })
    expect(stale()).toEqual([true, true])
  } finally {
    app.unmount()
  }
})

it('aynı kod başka işlemde genel "zaten uygulanmış" sayılmaz: yeniden okuma yok', async () => {
  server.use(
    reply('/v1/admin/permanent/work-items/w1', 409, 'organization.permanent_requires_deleted'),
  )
  const { app, write, stale } = setup(usePermanentDeleteWorkItem)
  try {
    const outcome = await write.submit({ programId: 'p1', id: 'w1' })
    expect(outcome).toMatchObject({ kind: 'failed' })
    expect(stale()).toEqual([false, false])
  } finally {
    app.unmount()
  }
})
