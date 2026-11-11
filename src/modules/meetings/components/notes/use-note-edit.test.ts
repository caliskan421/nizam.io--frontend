import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent } from 'vue'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { settleQueries } from '@/shared/http/__tests__/settle'
import { useScopeStore } from '@/shared/scope/store'
import { useNoteEdit } from './use-note-edit'
import type { MeetingNote } from '../../model/types'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
it('resolves a 409 against the new revision and sends the selected draft', async () => {
  const requests: Array<{ content: string; expected_revision: number }> = []
  server.use(
    http.patch('http://localhost/v1/meeting-notes/n', async ({ request }) => {
      requests.push((await request.json()) as (typeof requests)[number])
      return requests.length === 1
        ? HttpResponse.json(
            {
              code: 'collaboration.edit_conflict',
              message: 'secret',
              fields: [{ field: 'expected_revision', code: 'collaboration.edit_conflict' }],
            },
            { status: 409 },
          )
        : HttpResponse.json({})
    }),
    http.get('http://localhost/v1/meetings/m/notes', () =>
      HttpResponse.json({
        items: [{ note_id: 'n', content: 'Sunucu', edit_revision: 3 }],
        next_cursor: '',
      }),
    ),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  let edit!: ReturnType<typeof useNoteEdit>
  let refreshed = 0
  const app = createApp(
    defineComponent({
      setup() {
        edit = useNoteEdit(
          () => ({ programId: 'p', id: 'm' }),
          () => 0,
          () => {
            refreshed += 1
          },
        )
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  edit.editing.value = { note_id: 'n', content: 'Taban', edit_revision: 2 } as MeetingNote
  edit.editDraft.value = 'Taslak'
  const saving = edit.saveNote()
  await settleQueries(client)
  expect(edit.conflict.open.value).toBe(true)
  edit.conflict.choose({ content: 'mine' })
  await saving
  expect(requests).toEqual([
    { content: 'Taslak', expected_revision: 2 },
    { content: 'Taslak', expected_revision: 3 },
  ])
  expect(refreshed).toBe(1)
  app.unmount()
  client.clear()
})
it('does not update the screen when the scope changes before the response', async () => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  let received!: () => void
  const receivedRequest = new Promise<void>((resolve) => {
    received = resolve
  })
  server.use(
    http.patch('http://localhost/v1/meeting-notes/n', async () => {
      received()
      await gate
      return HttpResponse.json({})
    }),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  let version = 0
  let refreshed = 0
  let edit!: ReturnType<typeof useNoteEdit>
  const app = createApp(
    defineComponent({
      setup() {
        edit = useNoteEdit(
          () => ({ programId: 'p', id: 'm' }),
          () => version,
          () => {
            refreshed += 1
          },
        )
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  edit.editing.value = { note_id: 'n', content: 'Taban', edit_revision: 2 } as MeetingNote
  edit.editDraft.value = 'Taslak'
  const saving = edit.saveNote()
  await receivedRequest
  version += 1
  release()
  await saving
  expect(refreshed).toBe(0)
  app.unmount()
  client.clear()
})
