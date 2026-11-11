import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent } from 'vue'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { authSession } from '@/shared/http'
import { isDetached } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'
import { useAddMeetingNote, useUpdateMeetingNote } from './note-writes'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
function setupWrites() {
  return { add: useAddMeetingNote(), update: useUpdateMeetingNote() }
}
function boot() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  store.commit({ programId: 'p', departmentId: null, lens: 'admin' })
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
  return { app, client, store, writes }
}

it.each(['lens', 'session', 'owner'] as const)(
  'stops conflict page reading after %s changes',
  async (change) => {
    let release!: () => void
    let started!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const requested = new Promise<void>((resolve) => {
      started = resolve
    })
    let reads = 0
    server.use(
      http.patch('http://localhost/v1/meeting-notes/n', () =>
        HttpResponse.json({ code: 'collaboration.edit_conflict', fields: [] }, { status: 409 }),
      ),
      http.get('http://localhost/v1/meetings/m/notes', async () => {
        reads += 1
        started()
        await gate
        return HttpResponse.json({ items: [], next_cursor: 'next' })
      }),
    )
    const { app, client, store, writes } = boot()
    const pending = writes.update.submit({
      programId: 'p',
      id: 'm',
      noteId: 'n',
      body: { content: 'x', expected_revision: 1 },
    })
    await requested
    if (change === 'lens') store.commit({ programId: 'p', departmentId: 'd', lens: 'coordinator' })
    if (change === 'session') authSession.clear()
    if (change === 'owner') app.unmount()
    release()
    const outcome = await pending
    expect(outcome.kind).toBe('edit_conflict')
    expect(reads).toBe(1)
    if (change === 'owner') expect(isDetached(outcome)).toBe(true)
    if (change !== 'owner') app.unmount()
    client.clear()
  },
)

it.each(['keyed', 'keyless'] as const)('does not retry a detached %s write', async (kind) => {
  let release!: () => void
  let started!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const requested = new Promise<void>((resolve) => {
    started = resolve
  })
  let calls = 0
  server.use(
    http.all('http://localhost/v1/*', async () => {
      calls += 1
      started()
      await gate
      return HttpResponse.error()
    }),
  )
  const { app, client, writes } = boot()
  const target = { programId: 'p', id: 'm' }
  const pending =
    kind === 'keyed'
      ? writes.add.submit({ ...target, body: { content: 'x' } })
      : writes.update.submit({
          ...target,
          noteId: 'n',
          body: { content: 'x', expected_revision: 1 },
        })
  await requested
  app.unmount()
  release()
  const outcome = await pending
  expect(isDetached(outcome)).toBe(true)
  expect(calls).toBe(1)
  if (outcome.kind === 'unknown_outcome') expect(outcome.retry).toBeNull()
  client.clear()
})
