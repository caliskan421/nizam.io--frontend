import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest'

import { authSession } from '@/shared/http'

import { apiTransport } from './transport'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => {
  authSession.establish({
    token: 'tok-1',
    account_id: 'a1',
    expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    force_password_change: false,
  } as never)
})

const request = () => ({
  path: '/v1/chats/stream' as const,
  programId: 'p1',
  signal: new AbortController().signal,
  lastEventId: null,
})

it('akışı Authorization + X-Nizamio-Program ile açar; çerez/EventSource yok, yazma başlığı yok', async () => {
  let seen: Headers | null = null
  server.use(
    http.get('http://localhost/v1/chats/stream', ({ request: r }) => {
      seen = r.headers
      return new HttpResponse(': ok\n\nevent: typing\ndata: {}\n\n', {
        headers: { 'Content-Type': 'text/event-stream' },
      })
    }),
  )
  const result = await apiTransport(request())
  expect(result.kind).toBe('open')
  expect(seen!.get('Authorization')).toBe('Bearer tok-1')
  expect(seen!.get('X-Nizamio-Program')).toBe('p1')
  expect(seen!.get('X-Requested-With')).toBeNull()
  expect(seen!.get('Last-Event-ID')).toBeNull()
  if (result.kind === 'open') {
    const text = await new Response(result.body).text()
    expect(text).toContain('event: typing')
  }
})

it('son olay kimliği varsa Last-Event-ID gönderir', async () => {
  let id: string | null = null
  server.use(
    http.get('http://localhost/v1/chats/stream', ({ request: r }) => {
      id = r.headers.get('Last-Event-ID')
      return new HttpResponse(': ok\n\n', { headers: { 'Content-Type': 'text/event-stream' } })
    }),
  )
  await apiTransport({ ...request(), lastEventId: '42' })
  expect(id).toBe('42')
})

it('429 Retry-After saniyesini ms olarak verir; 403 reddedilir', async () => {
  server.use(
    http.get('http://localhost/v1/chats/stream', () =>
      HttpResponse.json(
        { code: 'platform.rate_limited' },
        { status: 429, headers: { 'Retry-After': '7' } },
      ),
    ),
  )
  expect(await apiTransport(request())).toEqual({
    kind: 'rejected',
    status: 429,
    retryAfterMs: 7000,
  })
  server.use(
    http.get('http://localhost/v1/chats/stream', () =>
      HttpResponse.json({ code: 'messaging.not_authorized' }, { status: 403 }),
    ),
  )
  expect(await apiTransport(request())).toMatchObject({ kind: 'rejected', status: 403 })
})

it('oturum akış açılırken değişirse sonuç kullanılmaz (sessionBound)', async () => {
  server.use(
    http.get('http://localhost/v1/chats/stream', () => {
      authSession.clear()
      return new HttpResponse(': ok\n\n', { headers: { 'Content-Type': 'text/event-stream' } })
    }),
  )
  await expect(apiTransport(request())).rejects.toThrow()
})
