import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent } from 'vue'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { useMeetingNotes } from './queries'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())

it('seeds the first notes page from the detail cache', () => {
  server.use(
    http.get('http://localhost/v1/meetings/m/notes', () =>
      HttpResponse.json({ items: [], next_cursor: '' }),
    ),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  store.commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient()
  client.setQueryData(queryKeys.meetings.detail(store.snapshot, 'm'), {
    notes: { items: [{ note_id: 'n' }], next_cursor: 'next' },
  })
  let notes!: ReturnType<typeof useMeetingNotes>
  const app = createApp(
    defineComponent({
      setup() {
        notes = useMeetingNotes('m')
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  expect(notes.data.value?.pages[0]?.items[0]?.note_id).toBe('n')
  expect(notes.data.value?.pages[0]?.next_cursor).toBe('next')
  app.unmount()
  client.clear()
})
