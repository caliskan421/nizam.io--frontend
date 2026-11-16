// BE-068 (pin v0.23.0-api, F8 W175): createMeeting / addAgendaItem / addMeetingParticipant
// `Idempotency-Key` ile gönderilir; 201 yeni, 200 aynı anahtarın tekrarı (başarı), 404 (silinmiş
// ilk toplantı) olağan hata akışına (`failed` + kod → i18n) düşer; belirsiz sonuçta AYNI anahtar
// ve gövdeyle tek tekrar sunulur.
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

const KEY = /^[A-Za-z0-9_-]{22}$/

describe('BE-068: Idempotency-Key + 200 (tekrar) / 201 / 404', () => {
  for (const status of [200, 201] as const) {
    it(`createMeeting ${status}: başarı; eylem başına anahtar gider`, async () => {
      let key: string | null = null
      server.use(
        http.post('http://localhost/v1/meetings', ({ request }) => {
          key = request.headers.get('Idempotency-Key')
          return HttpResponse.json(CREATED, { status })
        }),
      )
      const { writes, close } = setup()
      const out = await writes.create.submit(createVars)
      expect(out).toMatchObject({ kind: 'success', status, data: { meeting_id: 'm1' } })
      expect(key).toMatch(KEY)
      close()
    })
  }

  it('addAgendaItem ve addMeetingParticipant 200/201: ikisi de başarı, her eylem yeni anahtar', async () => {
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
    expect(keys.every((key) => KEY.test(key ?? ''))).toBe(true)
    expect(new Set(keys).size).toBe(4)
    close()
  })

  it('belirsiz sonuçta aynı anahtar ve gövdeyle tek tekrar; tekrar 200 = ilk kaynak, tek kayıt', async () => {
    const seen: unknown[][] = []
    server.use(
      http.post('http://localhost/v1/meetings', async ({ request }) => {
        seen.push([request.headers.get('Idempotency-Key'), await request.json()])
        return seen.length === 1
          ? HttpResponse.error()
          : HttpResponse.json(CREATED, { status: 200 })
      }),
    )
    const { writes, close } = setup()
    const out = await writes.create.submit(createVars)
    expect(out.kind).toBe('unknown_outcome')
    if (out.kind !== 'unknown_outcome') return
    expect(out.retry).not.toBeNull()
    const again = await out.retry!()
    expect(again).toMatchObject({ kind: 'success', status: 200, replayed: true })
    expect(seen).toHaveLength(2)
    expect(seen[0]![0]).toMatch(KEY)
    expect(seen[1]).toEqual(seen[0])
    close()
  })

  it('tekrar da belirsizse üçüncü kör gönderim yok: retry kapanır', async () => {
    let calls = 0
    server.use(
      http.post('http://localhost/v1/meetings/m/participants', () => {
        calls += 1
        return HttpResponse.error()
      }),
      http.get('http://localhost/v1/*', () => HttpResponse.json({ items: [], next_cursor: '' })),
    )
    const { writes, close } = setup()
    const out = await writes.participant.submit({ programId: 'p', id: 'm', userId: 'u' })
    if (out.kind !== 'unknown_outcome') throw new Error('belirsiz bekleniyordu')
    const second = await out.retry!()
    expect(second.kind).toBe('unknown_outcome')
    if (second.kind === 'unknown_outcome') expect(second.retry).toBeNull()
    expect(calls).toBe(2)
    close()
  })

  it('409 farklı istekle anahtar yeniden kullanımı: otomatik tekrar yok', async () => {
    let calls = 0
    server.use(
      http.post('http://localhost/v1/meetings', () => {
        calls += 1
        return HttpResponse.json(
          {
            code: 'collaboration.idempotency_key_reused',
            message: 'sunucu iletisi',
            request_id: 'r',
            fields: [],
          },
          { status: 409 },
        )
      }),
    )
    const { writes, close } = setup()
    const out = await writes.create.submit(createVars)
    expect(out.kind).toBe('idempotency_key_reused')
    expect(calls).toBe(1)
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
