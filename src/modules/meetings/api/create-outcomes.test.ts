// K-4 (pin v0.23.0-api): createMeeting / addAgendaItem / addMeetingParticipant 200 (tekrar) / 201 / 404
// ve isteğe bağlı `Idempotency-Key`. Davranış değişmez: anahtar GÖNDERİLMEZ (canlıya alma W175'in),
// 200 de başarı sayılır, 404 olağan hata akışına (`failed` + kod → i18n) düşer.
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp, defineComponent } from 'vue'

import { useScopeStore } from '@/shared/scope/store'

import { useAddAgendaItem, useAddMeetingParticipant } from './detail-writes'
import { useCreateMeeting } from './meeting-writes'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())

const CREATED = { meeting_id: 'm1' }

function makeWrites() {
  return {
    create: useCreateMeeting(),
    agenda: useAddAgendaItem(),
    participant: useAddMeetingParticipant(),
  }
}

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', lens: 'admin', departmentId: null })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  let writes!: ReturnType<typeof makeWrites>
  const app = createApp(
    defineComponent({
      setup() {
        writes = makeWrites()
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  return { writes, close: () => (app.unmount(), client.clear()) }
}

const createVars = {
  programId: 'p',
  body: {
    title: 'T',
    meeting_date: '2026-11-12T10:00:00Z',
    department_ids: ['d'],
    invite_mode: 'person' as const,
  },
}

describe('K-4: 200 (tekrar) / 201 / 404 — anahtar gönderilmez', () => {
  for (const status of [200, 201] as const) {
    it(`createMeeting ${status}: başarı; Idempotency-Key gönderilmez`, async () => {
      let key: string | null = 'unset'
      server.use(
        http.post('http://localhost/v1/meetings', ({ request }) => {
          key = request.headers.get('Idempotency-Key')
          return HttpResponse.json(CREATED, { status })
        }),
      )
      const { writes, close } = setup()
      const out = await writes.create.submit(createVars)
      expect(out).toMatchObject({ kind: 'success', status, data: { meeting_id: 'm1' } })
      expect(key).toBeNull()
      close()
    })
  }

  it('addAgendaItem ve addMeetingParticipant 200/201: ikisi de başarı, anahtarsız', async () => {
    const keys: (string | null)[] = []
    let n = 0
    server.use(
      http.post('http://localhost/v1/meetings/m/agenda', ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key'))
        return HttpResponse.json({ agenda_item_id: 'a1' }, { status: n++ % 2 === 0 ? 200 : 201 })
      }),
      http.post('http://localhost/v1/meetings/m/participants', ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key'))
        return HttpResponse.json({}, { status: n++ % 2 === 0 ? 200 : 201 })
      }),
    )
    const { writes, close } = setup()
    const target = { programId: 'p', id: 'm' }
    const outs = [
      await writes.agenda.submit({ ...target, body: { title: 'Gündem' } }),
      await writes.agenda.submit({ ...target, body: { title: 'Gündem 2' } }),
      await writes.participant.submit({ ...target, userId: 'u' }),
      await writes.participant.submit({ ...target, userId: 'u2' }),
    ]
    expect(outs.map((o) => o.kind)).toEqual(Array(4).fill('success'))
    expect(outs.map((o) => (o.kind === 'success' ? o.status : 0))).toEqual([200, 201, 200, 201])
    expect(keys).toEqual([null, null, null, null])
    close()
  })

  it('404: olağan hata akışı (failed + kod); kör tekrar yok', async () => {
    let calls = 0
    server.use(
      http.post('http://localhost/v1/meetings', () => {
        calls += 1
        return HttpResponse.json(
          {
            code: 'collaboration.meeting_not_found',
            message: 'sunucu iletisi',
            request_id: 'r',
            fields: [],
          },
          { status: 404 },
        )
      }),
    )
    const { writes, close } = setup()
    const out = await writes.create.submit(createVars)
    expect(out.kind).toBe('failed')
    if (out.kind === 'failed') {
      expect(out.error.code).toBe('collaboration.meeting_not_found')
      expect(out.error.status).toBe(404)
    }
    expect(calls).toBe(1)
    close()
  })
})
