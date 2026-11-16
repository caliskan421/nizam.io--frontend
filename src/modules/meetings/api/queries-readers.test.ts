import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent } from 'vue'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { useScopeStore } from '@/shared/scope/store'
import { useDeletedMeetings, useMeeting, useMeetingCandidates } from './queries'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
function readers() {
  return {
    detail: useMeeting('m'),
    deleted: useDeletedMeetings(true),
    candidates: useMeetingCandidates(null, true),
  }
}
it('reads detail, deleted and the single candidates endpoint without roster fan-out', async () => {
  const paths: string[] = []
  server.use(
    http.get('http://localhost/v1/*', ({ request }) => {
      const path = new URL(request.url).pathname
      paths.push(path)
      expect(request.headers.get('X-Nizamio-Program')).toBe('p')
      expect(request.headers.get('X-Nizamio-Department')).toBeNull()
      return HttpResponse.json({
        items: [],
        next_cursor: '',
        notes: { items: [], next_cursor: '' },
      })
    }),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: 'd', lens: 'coordinator' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let result!: ReturnType<typeof readers>
  const app = createApp(
    defineComponent({
      setup() {
        result = readers()
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  await Promise.all([
    result.detail.suspense(),
    result.deleted.suspense(),
    result.candidates.suspense(),
  ])
  expect(paths.sort()).toEqual(
    ['/v1/meetings/participant-candidates', '/v1/meetings/deleted', '/v1/meetings/m'].sort(),
  )
  expect(result.candidates.data.value).toEqual({ people: [] })
  app.unmount()
  client.clear()
})
