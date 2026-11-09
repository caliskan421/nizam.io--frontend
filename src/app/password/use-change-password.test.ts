import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, type App } from 'vue'

import { redactPasswords, useChangePassword } from './use-change-password'

const ORIGIN = 'http://localhost'
const PASSWORD_URL = `${ORIGIN}/v1/auth/password`
const CURRENT = 'Gecici-Parola-1'
const NEXT = 'Yeni-Parola-2026'

const server = setupServer()
const bodies: unknown[] = []
const headers: Headers[] = []
server.events.on('request:start', ({ request }) => {
  headers.push(new Headers(request.headers))
  void request
    .clone()
    .json()
    .then((b: unknown) => bodies.push(b))
    .catch(() => undefined)
})

let app: App | null = null

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const queryClient = new QueryClient()
  let hook!: ReturnType<typeof useChangePassword>
  app = createApp(
    defineComponent({
      setup() {
        hook = useChangePassword()
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient })
  app.mount(document.createElement('div'))
  return { hook, queryClient }
}

const leaks = (value: unknown) => {
  const text = JSON.stringify(value ?? null)
  return text.includes(CURRENT) || text.includes(NEXT)
}

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  app?.unmount()
  app = null
  server.resetHandlers()
  bodies.length = 0
  headers.length = 0
})
afterAll(() => server.close())

describe('useChangePassword (changePassword, POST /v1/auth/password)', () => {
  it('gövde {current_password, new_password}; CSRF var, anahtar yok; sonuç ve önbellek parolasız', async () => {
    server.use(http.post(PASSWORD_URL, () => HttpResponse.json({ revoked_sessions: 2 })))
    const { hook, queryClient } = setup()
    const out = await hook.submit({ current: CURRENT, next: NEXT })

    expect(out.kind).toBe('success')
    expect(out.kind === 'success' && out.data).toEqual({ revoked_sessions: 2 })
    await vi.waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({ current_password: CURRENT, new_password: NEXT })
    expect(headers[0]!.get('X-Requested-With')).toBeTruthy()
    expect(headers[0]!.get('Idempotency-Key')).toBeNull()
    expect(leaks(out)).toBe(false)
    await vi.waitFor(() => expect(queryClient.getMutationCache().getAll()).toHaveLength(0))
  })

  it('sonuç bilinmiyor: taslakta parola yok, aynı gövdeyle yeniden gönderim yok', async () => {
    server.use(http.post(PASSWORD_URL, () => HttpResponse.error()))
    const { hook, queryClient } = setup()
    const out = await hook.submit({ current: CURRENT, next: NEXT })

    expect(out.kind).toBe('unknown_outcome')
    expect(out.kind === 'unknown_outcome' && out.retry).toBeNull()
    expect(leaks(out)).toBe(false)
    await vi.waitFor(() => expect(queryClient.getMutationCache().getAll()).toHaveLength(0))
  })

  it('422 alan hatası olduğu gibi döner (form alana yazar)', async () => {
    server.use(
      http.post(PASSWORD_URL, () =>
        HttpResponse.json(
          {
            code: 'identity.input_invalid',
            message: 'x',
            request_id: 'r',
            fields: [{ field: 'new_password', code: 'identity.password_too_short', message: 'x' }],
          },
          { status: 422 },
        ),
      ),
    )
    const { hook } = setup()
    const out = await hook.submit({ current: CURRENT, next: 'kisa' })
    expect(out.kind).toBe('failed')
    expect(out.kind === 'failed' && out.error.fields.map((f) => f.code)).toEqual([
      'identity.password_too_short',
    ])
  })

  it('redactPasswords: taslaksız sonuç aynen döner', () => {
    const success = {
      kind: 'success' as const,
      data: { revoked_sessions: 0 },
      status: 200,
      replayed: false,
      idempotencyKey: 'k',
    }
    expect(redactPasswords(success)).toBe(success)
  })
})
