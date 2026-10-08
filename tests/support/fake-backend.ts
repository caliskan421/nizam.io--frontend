// Birim testleri için sahte backend (MSW) ve sekmeler arası sahte koordinasyon.
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import type { RefreshCoordination } from '@/shared/session/coordination'
import type { SessionMessage } from '@/shared/session/auth-session'

export const BASE = 'http://localhost'

export interface RecordedRequest {
  method: string
  path: string
  headers: Headers
  body: string
  credentials: RequestCredentials
}

/**
 * Sunucu tarafı durumu. Her refresh yeni belirteç üretir (rotasyon); backend'deki gibi eski
 * erişim belirteçleri rotasyonla düşmez, yalnız `expired` kümesine girince 401 alır.
 * `validToken` son üretilen belirteçtir. `refreshMode` refresh ucunun cevabını belirler.
 */
export function createFakeBackend() {
  const state = {
    validToken: 'tok-1',
    generation: 1,
    expired: new Set<string>(),
    refreshCount: 0,
    refreshMode: 'ok' as 'ok' | 'unauthorized' | 'server_error',
    requests: [] as RecordedRequest[],
  }

  const record = async (request: Request) => {
    const url = new URL(request.url)
    state.requests.push({
      method: request.method,
      path: url.pathname,
      headers: new Headers(request.headers),
      body: await request.clone().text(),
      credentials: request.credentials,
    })
  }

  const authorized = (request: Request) => {
    const match = /^Bearer (tok-(\d+))$/.exec(request.headers.get('Authorization') ?? '')
    if (!match) return false
    return Number(match[2]) <= state.generation && !state.expired.has(match[1]!)
  }

  const envelope = (code: string, status: number, init: ResponseInit = {}) =>
    HttpResponse.json(
      { code, message: 'iç metin gösterilmez', request_id: `req-${code}` },
      { status, ...init },
    )

  const handlers = [
    http.post(`${BASE}/v1/auth/refresh`, async ({ request }) => {
      await record(request)
      state.refreshCount += 1
      if (state.refreshMode === 'unauthorized') return envelope('identity.session_invalid', 401)
      if (state.refreshMode === 'server_error') return envelope('platform.internal', 500)
      state.generation += 1
      state.validToken = `tok-${state.generation}`
      return HttpResponse.json({
        token: state.validToken,
        account_id: 'acc-1',
        expires_at: 2_000_000_000,
        refresh_expires_at: 2_000_086_400,
      })
    }),
    http.post(`${BASE}/v1/auth/login`, async ({ request }) => {
      await record(request)
      const body = (await request.json()) as { email: string; password: string }
      if (body.password !== 'dogru-parola') return envelope('identity.credentials_invalid', 401)
      return HttpResponse.json({
        token: state.validToken,
        account_id: 'acc-1',
        expires_at: 2_000_000_000,
        force_password_change: false,
      })
    }),
    http.post(`${BASE}/v1/auth/logout`, async ({ request }) => {
      await record(request)
      if (!authorized(request)) return envelope('identity.session_invalid', 401)
      return new HttpResponse(null, { status: 204 })
    }),
    http.get(`${BASE}/v1/me`, async ({ request }) => {
      await record(request)
      if (!authorized(request)) return envelope('platform.unauthenticated', 401)
      return HttpResponse.json({ account_id: 'acc-1', email: 'yonetici@example.test' })
    }),
    http.get(`${BASE}/v1/program`, async ({ request }) => {
      await record(request)
      if (!authorized(request)) return envelope('platform.unauthenticated', 401)
      return HttpResponse.json({ program_id: 'prg-1', name: 'Program' })
    }),
    http.get(`${BASE}/v1/programs`, async ({ request }) => {
      await record(request)
      if (!authorized(request)) return envelope('platform.unauthenticated', 401)
      return HttpResponse.json({ programs: [] })
    }),
    http.post(`${BASE}/v1/programs`, async ({ request }) => {
      await record(request)
      if (!authorized(request)) return envelope('platform.unauthenticated', 401)
      return HttpResponse.json(
        { program_id: 'prg-2', name: 'Yeni', created: true },
        { status: 201 },
      )
    }),
    http.get(`${BASE}/v1/instance/profile`, async ({ request }) => {
      await record(request)
      return HttpResponse.json({
        display_name: 'Deneme A.Ş.',
        brand_color: '#1F4E79',
        timezone: 'Europe/Istanbul',
        api_version: 'v1',
        minimum_mobile_version: '0.0.0',
      })
    }),
  ]

  const server = setupServer(...handlers)
  return {
    server,
    state,
    envelope,
    count: (path: string) => state.requests.filter((r) => r.path === path).length,
  }
}

/**
 * Paylaşılan sahte Web Locks + BroadcastChannel: aynı "tarayıcıdaki" sekmeler (bağımsız
 * AuthSession/istemci örnekleri) bunu paylaşır. Kilit FIFO'dur; ileti göndericiye dönmez.
 * `deliveryDelayMs` > 0 iken ileti kilit devrinden SONRA ulaşır (yarış senaryosu).
 */
export function createFakeBrowser(options: { deliveryDelayMs?: number } = {}) {
  const listeners: Array<{ tab: number; fn: (m: SessionMessage) => void }> = []
  let tail: Promise<unknown> = Promise.resolve()
  let nextTab = 0
  const published: SessionMessage[] = []

  function tab(): RefreshCoordination {
    const id = nextTab++
    return {
      crossTabLock: true,
      withLock<T>(_name: string, task: () => Promise<T>): Promise<T> {
        const run = tail.then(task)
        tail = run.catch(() => undefined)
        return run
      },
      publish(message) {
        published.push(message)
        for (const l of listeners) {
          if (l.tab === id) continue
          const copy = structuredClone(message)
          if (options.deliveryDelayMs) setTimeout(() => l.fn(copy), options.deliveryDelayMs)
          else queueMicrotask(() => l.fn(copy))
        }
      },
      subscribe(fn) {
        listeners.push({ tab: id, fn })
      },
    }
  }

  return { tab, published }
}

export function noopCoordination(): RefreshCoordination {
  return {
    crossTabLock: true,
    withLock: (_name, task) => task(),
    publish: () => undefined,
    subscribe: () => undefined,
  }
}
