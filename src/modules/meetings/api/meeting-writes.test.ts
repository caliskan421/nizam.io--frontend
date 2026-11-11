import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent } from 'vue'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { useScopeStore } from '@/shared/scope/store'
import {
  useCreateMeeting,
  useDeleteMeeting,
  usePermanentDeleteMeeting,
  useRestoreMeeting,
  useUpdateMeeting,
} from './meeting-writes'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())

function setupWrites() {
  return {
    create: useCreateMeeting(),
    update: useUpdateMeeting(),
    remove: useDeleteMeeting(),
    restore: useRestoreMeeting(),
    permanent: usePermanentDeleteMeeting(),
  }
}

it('writes all meeting operations through S2 without idempotency keys', async () => {
  const seen: string[] = []
  server.use(
    http.all('http://localhost/v1/*', ({ request }) => {
      expect(request.headers.get('X-Nizamio-Program')).toBe('p')
      expect(request.headers.get('X-Nizamio-Department')).toBeNull()
      expect(request.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
      expect(request.headers.get('Idempotency-Key')).toBeNull()
      seen.push(`${request.method} ${new URL(request.url).pathname}`)
      if (request.method === 'DELETE' && new URL(request.url).pathname === '/v1/meetings/m')
        return new HttpResponse(null, { status: 204 })
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
  const target = { programId: 'p', id: 'm' }
  const outcomes = [
    await writes.create.submit({
      programId: 'p',
      body: {
        title: 'T',
        meeting_date: '2026-11-12T10:00:00Z',
        department_ids: ['d'],
        invite_mode: 'person',
      },
    }),
    await writes.update.submit({ ...target, body: { title: 'New' } }),
    await writes.remove.submit(target),
    await writes.restore.submit(target),
    await writes.permanent.submit(target),
  ]
  expect(outcomes.map((o) => o.kind)).toEqual(Array(5).fill('success'))
  expect(seen).toEqual([
    'POST /v1/meetings',
    'PATCH /v1/meetings/m',
    'DELETE /v1/meetings/m',
    'PATCH /v1/admin/restore/meetings/m',
    'DELETE /v1/admin/permanent/meetings/m',
  ])
  let uncertainCalls = 0
  server.use(
    http.patch('http://localhost/v1/meetings/m', () => {
      uncertainCalls += 1
      return HttpResponse.error()
    }),
  )
  const uncertain = await writes.update.submit({ ...target, body: { title: 'Unknown' } })
  expect(uncertain.kind).toBe('unknown_outcome')
  if (uncertain.kind === 'unknown_outcome') expect(uncertain.retry).toBeNull()
  expect(uncertainCalls).toBe(1)
  app.unmount()
  client.clear()
})
