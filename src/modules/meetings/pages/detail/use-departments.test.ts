import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent } from 'vue'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { settleQueries } from '@/shared/http/__tests__/settle'
import { useScopeStore } from '@/shared/scope/store'
import { useDepartments } from './use-departments'
const server = setupServer(
  http.get('http://localhost/v1/program/departments', () =>
    HttpResponse.json({ departments: [{ department_id: 'd', code: 'ABC' }] }),
  ),
)
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
it('reads program department codes through the shared reader', async () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  let result!: ReturnType<typeof useDepartments>
  const app = createApp(
    defineComponent({
      setup() {
        result = useDepartments()
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  await settleQueries(client)
  expect(result.value[0]?.code).toBe('ABC')
  app.unmount()
  client.clear()
})
