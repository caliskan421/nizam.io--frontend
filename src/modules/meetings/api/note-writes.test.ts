import type { ReviseMeetingNoteRequest } from '../model/types'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent } from 'vue'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import {
  useAddMeetingNote,
  useUpdateMeetingNote,
  useDeleteMeetingNote,
  useConvertNoteToTask,
} from './note-writes'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())

function setupWrites() {
  return {
    add: useAddMeetingNote(),
    update: useUpdateMeetingNote(),
    remove: useDeleteMeetingNote(),
    convert: useConvertNoteToTask(),
  }
}

it('writes all meeting operations through S2 without idempotency keys', async () => {
  const seen: string[] = []
  server.use(
    http.all('http://localhost/v1/*', ({ request }) => {
      expect(request.headers.get('X-Nizamio-Program')).toBe('p')
      expect(request.headers.get('X-Nizamio-Department')).toBeNull()
      expect(request.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
      if (new URL(request.url).pathname === '/v1/meetings/m/notes')
        expect(request.headers.get('Idempotency-Key')).toBeTruthy()
      else expect(request.headers.get('Idempotency-Key')).toBeNull()
      seen.push(`${request.method} ${new URL(request.url).pathname}`)
      if (request.method === 'DELETE') return new HttpResponse(null, { status: 204 })
      return HttpResponse.json({})
    }),
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', lens: 'admin', departmentId: null })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let writes!: ReturnType<typeof setupWrites>
  const app = createApp(
    defineComponent({
      setup() {
        writes = setupWrites()
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  const scope = useScopeStore().snapshot
  const keys = [
    queryKeys.meetings.noteList(scope, 'm'),
    queryKeys.workItems.list(scope, {}),
    queryKeys.workItems.counts(scope, {}),
    queryKeys.shellBadges.counts(scope, {}),
    queryKeys.report.dashboard(scope),
  ]
  for (const key of keys) client.setQueryData(key, { before: true })
  const target = { programId: 'p', id: 'm' }
  const note = { ...target, noteId: 'n' }
  const outcomes = [
    await writes.add.submit({ ...target, body: { content: 'Note' } }),
    await writes.update.submit({ ...note, body: { content: 'Edit', expected_revision: 2 } }),
    await writes.remove.submit(note),
    await writes.convert.submit({
      ...note,
      body: { start_date: '2026-11-12', end_date: '2026-11-13' },
    }),
  ]
  expect(outcomes.map((o) => o.kind)).toEqual(Array(4).fill('success'))
  for (const key of keys) expect(client.getQueryState(key)?.isInvalidated).toBe(true)
  expect(seen).toEqual([
    'POST /v1/meetings/m/notes',
    'PATCH /v1/meeting-notes/n',
    'DELETE /v1/meeting-notes/n',
    'POST /v1/meeting-notes/n/convert-to-task',
  ])
  let sentRevision: unknown
  server.use(
    http.patch('http://localhost/v1/meeting-notes/n', async ({ request }) => {
      sentRevision = ((await request.json()) as ReviseMeetingNoteRequest).expected_revision
      return HttpResponse.json(
        {
          code: 'collaboration.edit_conflict',
          message: 'secret',
          fields: [{ field: 'expected_revision', code: 'collaboration.edit_conflict' }],
        },
        { status: 409 },
      )
    }),
    http.get('http://localhost/v1/meetings/m/notes', () =>
      HttpResponse.json({
        items: [{ note_id: 'n', content: 'server', edit_revision: 3 }],
        next_cursor: '',
      }),
    ),
  )
  const conflict = await writes.update.submit({
    ...note,
    body: { content: 'draft', expected_revision: 2 },
  })
  expect(sentRevision).toBe(2)
  expect(conflict.kind).toBe('edit_conflict')
  if (conflict.kind === 'edit_conflict')
    expect(conflict.server).toMatchObject({ content: 'server', edit_revision: 3 })
  const sentKeys: string[] = []
  server.use(
    http.post('http://localhost/v1/meetings/m/notes', ({ request }) => {
      sentKeys.push(request.headers.get('Idempotency-Key') ?? '')
      return sentKeys.length === 1 ? HttpResponse.error() : HttpResponse.json({})
    }),
  )
  expect((await writes.add.submit({ ...target, body: { content: 'again' } })).kind).toBe('success')
  expect(sentKeys).toHaveLength(2)
  expect(sentKeys[0]).toBeTruthy()
  expect(sentKeys[1]).toBe(sentKeys[0])
  app.unmount()
  client.clear()
})
