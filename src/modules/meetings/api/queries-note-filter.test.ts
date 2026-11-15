import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent, ref } from 'vue'
import type { NoteFilter } from '../model/types'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { useMeetingNotes } from './queries'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())

it('does not seed filtered note reads and sends the server filter with exact counts', async () => {
  const seen: URL[] = []
  server.use(
    http.get('http://localhost/v1/meetings/m/notes', ({ request }) => {
      seen.push(new URL(request.url))
      return HttpResponse.json({
        items: [{ note_id: 'c' }],
        next_cursor: '',
        total: 1,
        counts: { all: 9, converted: 1, mine: 2 },
      })
    }),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  store.commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient()
  client.setQueryData(queryKeys.meetings.detail(store.snapshot, 'm'), {
    notes: { items: [{ note_id: 'seed' }], next_cursor: '' },
  })
  const filter = ref<NoteFilter>('converted')
  let notes!: ReturnType<typeof useMeetingNotes>
  const app = createApp(
    defineComponent({
      setup() {
        notes = useMeetingNotes('m', filter)
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  expect(notes.data.value).toBeUndefined()
  await notes.suspense()
  expect(seen[0]?.searchParams.get('converted')).toBe('true')
  expect(seen[0]?.searchParams.has('author')).toBe(false)
  expect(notes.data.value?.pages[0]?.counts).toEqual({ all: 9, converted: 1, mine: 2 })
  filter.value = 'mine'
  await import('vue').then(({ nextTick }) => nextTick())
  await notes.suspense()
  expect(seen.at(-1)?.searchParams.get('author')).toBe('me')
  expect(seen.at(-1)?.searchParams.has('converted')).toBe(false)
  expect(seen.at(-1)?.searchParams.has('cursor')).toBe(false)
  app.unmount()
  client.clear()
})
