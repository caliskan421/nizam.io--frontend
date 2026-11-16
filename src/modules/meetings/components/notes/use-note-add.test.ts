import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent } from 'vue'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { useScopeStore } from '@/shared/scope/store'
import { useNoteAdd } from './use-note-add'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function setup(version = () => 0) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const refresh = vi.fn()
  let add!: ReturnType<typeof useNoteAdd>
  const app = createApp(
    defineComponent({
      setup() {
        add = useNoteAdd(() => ({ programId: 'p', id: 'm' }), version, refresh)
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  return { add, refresh, close: () => (app.unmount(), client.clear()) }
}

it('sends the draft with an idempotency key, then clears it and refreshes', async () => {
  let key: string | null = null
  server.use(
    http.post('http://localhost/v1/meetings/m/notes', ({ request }) => {
      key = request.headers.get('Idempotency-Key')
      return HttpResponse.json({ note_id: 'n' }, { status: 201 })
    }),
  )
  const { add, refresh, close } = setup()
  add.draft.value = 'Karar'
  await add.addNote()
  expect(key).toMatch(/^[A-Za-z0-9_-]{22}$/)
  expect(add.draft.value).toBe('')
  expect(refresh).toHaveBeenCalledOnce()
  close()
})

it('does not resend an unchanged draft after an unknown outcome and ignores empty or too long text', async () => {
  let calls = 0
  server.use(
    http.post('http://localhost/v1/meetings/m/notes', () => {
      calls += 1
      return HttpResponse.error()
    }),
  )
  const { add, close } = setup()
  add.draft.value = '   '
  await add.addNote()
  add.draft.value = 'x'.repeat(5001)
  await add.addNote()
  expect(calls).toBe(0)
  add.draft.value = 'Not'
  await add.addNote()
  expect(add.unknownDraft.value).toBe('Not')
  const afterFirst = calls
  expect(afterFirst).toBeGreaterThan(0)
  await add.addNote()
  expect(calls).toBe(afterFirst)
  close()
})

it('drops the result when the owner version changed while the request was in flight', async () => {
  let version = 0
  server.use(
    http.post('http://localhost/v1/meetings/m/notes', () => {
      version = 1
      return HttpResponse.json({ note_id: 'n' }, { status: 201 })
    }),
  )
  const { add, refresh, close } = setup(() => version)
  add.draft.value = 'Not'
  await add.addNote()
  expect(refresh).not.toHaveBeenCalled()
  expect(add.draft.value).toBe('Not')
  close()
})
