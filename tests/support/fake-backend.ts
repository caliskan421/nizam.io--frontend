// Birim testleri için sahte backend (MSW) ve sekmeler arası sahte koordinasyon.
//
// Oturum modeli backend v0.1.0-api davranışını taklit eder (identity/usecase/refresh.go):
//  - Giriş: erişim belirteci + yenileme belirteci (çerez). Çerez burada `X-Test-Cookie` /
//    `X-Test-Set-Cookie` başlıklarıyla taşınır; tarayıcı çerez kavanozunu `CookieJar` temsil
//    eder (aynı tarayıcıdaki sekmeler AYNI kavanozu paylaşır).
//  - Refresh: canlı yenileme belirteci CAS ile iptal edilir, yeni çift üretilir (rotasyon).
//    Eski erişim belirteçleri rotasyonla düşmez.
//  - İptal edilmiş belirteç 10 sn içinde ve soyun canlı halkası varken tekrar gelirse 401
//    (pay; toplu iptal YOK). Pay dışında tekrar kullanım → hesabın BÜTÜN oturumları düşer.
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import type { RefreshCoordination } from '@/shared/session/coordination'

export const BASE = 'http://localhost'
export const ROTATION_GRACE_MS = 10_000

/** Sahte erişim belirteci adı (n. üretilen); kanal doğrulamasının biçim/uzunluk kuralına uyar. */
export const T = (n: number) => `tok-${String(n).padStart(16, '0')}`

export interface RecordedRequest {
  method: string
  path: string
  headers: Headers
  body: string
  credentials: RequestCredentials
}

/** Tarayıcı çerez kavanozu (yalnız yenileme çerezi). */
export interface CookieJar {
  cookie: string | null
}

export function createJar(): CookieJar {
  return { cookie: null }
}

/** Sekmenin ham fetch'i: kavanozdaki çerezi gönderir, yanıttaki çerezi kavanoza yazar. */
export function jarFetch(jar: CookieJar): (input: Request) => Promise<Response> {
  return async (input) => {
    const request = new Request(input)
    request.headers.set('X-Test-Jar', '1')
    if (jar.cookie) request.headers.set('X-Test-Cookie', jar.cookie)
    const response = await globalThis.fetch(request)
    const set = response.headers.get('X-Test-Set-Cookie')
    if (set !== null) jar.cookie = set === '' ? null : set
    return response
  }
}

type RefreshEntry = { pair: string; revokedAt: number | null }
export type RefreshEvent = 'rotated' | 'grace_denied' | 'reuse_revoked_all' | 'unknown'

export function createFakeBackend() {
  const state = {
    clockOffsetMs: 0,
    accessIssued: 0,
    access: new Map<string, { expired: boolean }>(),
    refresh: new Map<string, RefreshEntry>(),
    refreshIssued: 0,
    pairs: 0,
    /** İstekleri X-Test-Jar taşımayan istemciler (tekil uygulama nesnesi) için sunucu tarafı kavanoz. */
    ambientJar: createJar(),
    refreshCount: 0,
    refreshEvents: [] as RefreshEvent[],
    refreshMode: 'ok' as 'ok' | 'unauthorized' | 'server_error',
    requests: [] as RecordedRequest[],
  }

  const now = () => Date.now() + state.clockOffsetMs
  const nowSec = () => Math.floor(now() / 1000)

  function issueAccess(): string {
    state.accessIssued += 1
    const token = T(state.accessIssued)
    state.access.set(token, { expired: false })
    return token
  }

  function issueRefresh(pair: string): string {
    state.refreshIssued += 1
    const rt = `rt-${state.refreshIssued}`
    state.refresh.set(rt, { pair, revokedAt: null })
    return rt
  }

  function pairHasLive(pair: string): boolean {
    for (const e of state.refresh.values()) if (e.pair === pair && e.revokedAt === null) return true
    return false
  }

  function revokeAll(): void {
    for (const a of state.access.values()) a.expired = true
    for (const e of state.refresh.values()) e.revokedAt ??= now()
  }

  function reset(): void {
    state.clockOffsetMs = 0
    state.accessIssued = 0
    state.access.clear()
    state.refresh.clear()
    state.refreshIssued = 0
    state.pairs = 0
    state.ambientJar = createJar()
    state.refreshCount = 0
    state.refreshEvents.length = 0
    state.refreshMode = 'ok'
    state.requests.length = 0
  }

  /** Erişim belirteçlerinin hepsinin süresini doldurur (refresh çerezi geçerli kalır). */
  function expireAccess(): void {
    for (const a of state.access.values()) a.expired = true
  }

  /** Tekil uygulama nesnesi için (X-Test-Jar yok) sunucu tarafı kavanoza canlı oturum koyar. */
  function seedAmbientSession(): void {
    state.pairs += 1
    state.ambientJar.cookie = issueRefresh(`pair-${state.pairs}`)
  }

  const cookieOf = (request: Request) =>
    request.headers.get('X-Test-Jar')
      ? request.headers.get('X-Test-Cookie')
      : state.ambientJar.cookie

  const withCookie = (request: Request, response: Response, value: string): Response => {
    if (request.headers.get('X-Test-Jar')) response.headers.set('X-Test-Set-Cookie', value)
    else state.ambientJar.cookie = value === '' ? null : value
    return response
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
    const match = /^Bearer (.+)$/.exec(request.headers.get('Authorization') ?? '')
    const entry = match ? state.access.get(match[1]!) : undefined
    return entry !== undefined && !entry.expired
  }

  const envelope = (code: string, status: number, init: ResponseInit = {}) =>
    HttpResponse.json(
      { code, message: 'iç metin gösterilmez', request_id: `req-${code}` },
      { status, ...init },
    )

  const handlers = [
    http.post(`${BASE}/v1/auth/refresh`, async ({ request }) => {
      await record(request)
      // Buradan sonrası eşzamanlı isteklerde atomiktir (await yok): CAS modeli.
      state.refreshCount += 1
      if (state.refreshMode === 'unauthorized') return envelope('identity.session_invalid', 401)
      if (state.refreshMode === 'server_error') return envelope('platform.internal', 500)
      const rt = cookieOf(request)
      const entry = rt ? state.refresh.get(rt) : undefined
      if (!entry) {
        state.refreshEvents.push('unknown')
        return envelope('identity.session_invalid', 401)
      }
      if (entry.revokedAt !== null) {
        if (now() - entry.revokedAt <= ROTATION_GRACE_MS && pairHasLive(entry.pair)) {
          state.refreshEvents.push('grace_denied')
          return envelope('identity.session_invalid', 401)
        }
        state.refreshEvents.push('reuse_revoked_all')
        revokeAll()
        return envelope('identity.session_invalid', 401)
      }
      entry.revokedAt = now()
      const next = issueRefresh(entry.pair)
      state.refreshEvents.push('rotated')
      const token = issueAccess()
      return withCookie(
        request,
        HttpResponse.json({
          token,
          account_id: 'acc-1',
          expires_at: nowSec() + 900,
          refresh_expires_at: nowSec() + 86_400,
        }),
        next,
      )
    }),
    http.post(`${BASE}/v1/auth/login`, async ({ request }) => {
      await record(request)
      const body = (await request.json()) as { email: string; password: string }
      if (body.password !== 'dogru-parola') return envelope('identity.credentials_invalid', 401)
      state.pairs += 1
      const rt = issueRefresh(`pair-${state.pairs}`)
      return withCookie(
        request,
        HttpResponse.json({
          token: issueAccess(),
          account_id: 'acc-1',
          expires_at: nowSec() + 900,
          force_password_change: false,
        }),
        rt,
      )
    }),
    http.post(`${BASE}/v1/auth/logout`, async ({ request }) => {
      await record(request)
      if (!authorized(request)) return envelope('identity.session_invalid', 401)
      const rt = cookieOf(request)
      const entry = rt ? state.refresh.get(rt) : undefined
      if (entry) entry.revokedAt ??= now()
      return withCookie(request, new HttpResponse(null, { status: 204 }), '')
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
    reset,
    expireAccess,
    seedAmbientSession,
    count: (path: string) => state.requests.filter((r) => r.path === path).length,
  }
}

/**
 * Paylaşılan sahte Web Locks + BroadcastChannel: aynı "tarayıcıdaki" sekmeler (bağımsız
 * AuthSession/istemci örnekleri) bunu paylaşır. Kilit FIFO'dur; ileti göndericiye dönmez ve
 * yapılandırılmış kopya (structuredClone) olarak teslim edilir.
 *  - `deliveryDelayMs` > 0: ileti kilit devrinden SONRA ulaşır (yarış senaryosu).
 *  - `locks: false`: Web Locks yok (güvensiz bağlam) — yalnız sekme içi tekilleştirme.
 */
export function createFakeBrowser(options: { deliveryDelayMs?: number; locks?: boolean } = {}) {
  const listeners: Array<{ tab: number; fn: (m: unknown) => void }> = []
  let tail: Promise<unknown> = Promise.resolve()
  let nextTab = 0
  const published: unknown[] = []
  const withLocks = options.locks ?? true

  /** Kanala doğrudan (ör. kötü niyetli aynı-origin bağlamdan) ham ileti enjekte eder. */
  function inject(raw: unknown): void {
    for (const l of listeners) queueMicrotask(() => l.fn(raw))
  }

  function tab(): RefreshCoordination {
    const id = nextTab++
    return {
      crossTabLock: withLocks,
      withLock<T>(_name: string, task: () => Promise<T>): Promise<T> {
        if (!withLocks) return task()
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

  return { tab, published, inject }
}

export function noopCoordination(): RefreshCoordination {
  return {
    crossTabLock: true,
    withLock: (_name, task) => task(),
    publish: () => undefined,
    subscribe: () => undefined,
  }
}
