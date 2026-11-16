import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent, ref } from 'vue'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { useScopeStore } from '@/shared/scope/store'
import { useCreateSettle } from './use-create-settle'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const body = {
  title: 'T',
  meeting_date: '2099-01-01T10:00:00Z',
  department_ids: ['d'],
  invite_mode: 'person' as const,
}
const created = {
  meeting: { meeting_id: 'm1' },
  failed_participants: ['x'],
  side_effects: { event_failed: false, failed_messages: 0 },
}

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', lens: 'admin', departmentId: null })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const hooks = {
    uncertain: ref(false),
    fieldErrors: ref<Record<string, string>>({}),
    warn: vi.fn(),
    saved: vi.fn(),
  }
  let settle!: ReturnType<typeof useCreateSettle>
  const app = createApp(
    defineComponent({
      setup() {
        settle = useCreateSettle(hooks)
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  return { settle, hooks, close: () => (app.unmount(), client.clear()) }
}

it('reports success through warn and saved without a notice', async () => {
  server.use(
    http.post('http://localhost/v1/meetings', () => HttpResponse.json(created, { status: 201 })),
  )
  const { settle, hooks, close } = setup()
  await settle.submit('p', body)
  expect(hooks.warn).toHaveBeenCalledWith(created.side_effects, ['x'])
  expect(hooks.saved).toHaveBeenCalledWith('m1')
  expect(settle.notice.value).toBeNull()
  expect(hooks.uncertain.value).toBe(false)
  close()
})

it('keeps the form locked behind a notice after an unknown result and settles the resend', async () => {
  let calls = 0
  server.use(
    http.post('http://localhost/v1/meetings', () => {
      calls += 1
      return calls === 1 ? HttpResponse.error() : HttpResponse.json(created, { status: 200 })
    }),
  )
  const { settle, hooks, close } = setup()
  await settle.submit('p', body)
  expect(hooks.uncertain.value).toBe(true)
  expect(settle.notice.value?.kind).toBe('unknown_outcome')
  expect(hooks.saved).not.toHaveBeenCalled()
  const unknown = settle.notice.value
  if (unknown?.kind !== 'unknown_outcome') throw new Error('belirsiz sonuç bekleniyordu')
  settle.resolved(await unknown.retry!())
  expect(hooks.saved).toHaveBeenCalledWith('m1')
  expect(settle.notice.value).toBeNull()
  expect(hooks.uncertain.value).toBe(false)
  close()
})

it('maps server field errors onto the form and unlocks it', async () => {
  server.use(
    http.post('http://localhost/v1/meetings', () =>
      HttpResponse.json(
        {
          code: 'collaboration.input_invalid',
          message: 'secret',
          request_id: 'r',
          fields: [{ field: 'title', code: 'collaboration.title_required' }],
        },
        { status: 422 },
      ),
    ),
  )
  const { settle, hooks, close } = setup()
  await settle.submit('p', body)
  expect(Object.keys(hooks.fieldErrors.value)).toEqual(['title'])
  expect(hooks.uncertain.value).toBe(false)
  expect(hooks.saved).not.toHaveBeenCalled()
  close()
})
