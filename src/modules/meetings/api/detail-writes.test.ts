import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, defineComponent } from 'vue'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { useScopeStore } from '@/shared/scope/store'
import {
  useAddAgendaItem,
  useUpdateAgendaItem,
  useDeleteAgendaItem,
  useAddMeetingParticipant,
  useRemoveMeetingParticipant,
} from './detail-writes'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())

function setupWrites() {
  return {
    add: useAddAgendaItem(),
    update: useUpdateAgendaItem(),
    remove: useDeleteAgendaItem(),
    participant: useAddMeetingParticipant(),
    removeParticipant: useRemoveMeetingParticipant(),
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
  const target = { programId: 'p', id: 'm' }
  const outcomes = [
    await writes.add.submit({ ...target, body: { title: 'Agenda' } }),
    await writes.update.submit({ programId: 'p', itemId: 'a', body: { is_checked: true } }),
    await writes.remove.submit({ programId: 'p', itemId: 'a' }),
    await writes.participant.submit({ ...target, userId: 'u' }),
    await writes.removeParticipant.submit({ ...target, userId: 'u' }),
  ]
  expect(outcomes.map((o) => o.kind)).toEqual(Array(5).fill('success'))
  expect(seen).toEqual([
    'POST /v1/meetings/m/agenda',
    'PATCH /v1/meeting-agenda/a',
    'DELETE /v1/meeting-agenda/a',
    'POST /v1/meetings/m/participants',
    'DELETE /v1/meetings/m/participants/u',
  ])
  let uncertainCalls = 0
  server.use(
    http.patch('http://localhost/v1/meeting-agenda/a', () => {
      uncertainCalls += 1
      return HttpResponse.error()
    }),
  )
  const uncertain = await writes.update.submit({
    programId: 'p',
    itemId: 'a',
    body: { title: 'Unknown' },
  })
  expect(uncertain.kind).toBe('unknown_outcome')
  if (uncertain.kind === 'unknown_outcome') expect(uncertain.retry).toBeNull()
  expect(uncertainCalls).toBe(1)
  app.unmount()
  client.clear()
})
