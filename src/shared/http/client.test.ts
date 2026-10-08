import { HttpResponse, http } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'
import { AuthSession } from '@/shared/session/auth-session'
import type { RefreshCoordination } from '@/shared/session/coordination'
import type { ScopeSnapshot } from '@/shared/scope/scope'

import {
  BASE,
  createFakeBackend,
  createFakeBrowser,
  createJar,
  jarFetch,
  noopCoordination,
  T,
  type CookieJar,
} from '../../../tests/support/fake-backend'
import { createApiClient } from './client'
import { unwrap } from './unwrap'

const backend = createFakeBackend()

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  backend.server.resetHandlers()
  backend.reset()
})
afterAll(() => backend.server.close())

/** Bir "sekme": bağımsız AuthSession + API istemcisi; çerez kavanozu tarayıcıyla paylaşılır. */
function createTab(
  coordination: RefreshCoordination = noopCoordination(),
  scope: ScopeSnapshot = { programId: null, departmentId: null },
  jar: CookieJar = createJar(),
) {
  const fetch = jarFetch(jar)
  const session = new AuthSession({
    baseUrl: BASE,
    fetch,
    coordination,
    peerWaitMs: 500,
    syncWaitMs: 300,
  })
  const scopeRef = { current: scope }
  const client = createApiClient({ baseUrl: BASE, session, scope: () => scopeRef.current, fetch })
  return { session, client, scopeRef, jar }
}

async function login(tab: ReturnType<typeof createTab>) {
  const res = await unwrap(
    tab.client.POST('/v1/auth/login', {
      body: { email: 'a@example.test', password: 'dogru-parola' },
    }),
  )
  tab.session.establish(res, res.force_password_change)
  return tab
}

function loggedInTab(coordination?: RefreshCoordination, scope?: ScopeSnapshot, jar?: CookieJar) {
  return login(createTab(coordination, scope, jar))
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('401 → refresh → tekrar', () => {
  it('erişim belirteci düşünce tek refresh yapılır ve istek yeni belirteçle bir kez tekrarlanır', async () => {
    const tab = await loggedInTab()
    backend.expireAccess()

    const me = await unwrap(tab.client.GET('/v1/me'))

    expect(me.account_id).toBe('acc-1')
    expect(backend.state.refreshCount).toBe(1)
    expect(backend.state.refreshEvents).toEqual(['rotated'])
    const meCalls = backend.state.requests.filter((r) => r.path === '/v1/me')
    expect(meCalls.map((r) => r.headers.get('Authorization'))).toEqual([
      `Bearer ${T(1)}`,
      `Bearer ${T(2)}`,
    ])
    expect(tab.session.token).toBe(T(2))
  })

  it('refresh isteği: POST, gövde {}, X-Requested-With, credentials same-origin, Bearer yok', async () => {
    const tab = await loggedInTab()
    backend.expireAccess()
    await unwrap(tab.client.GET('/v1/me'))

    const refresh = backend.state.requests.find((r) => r.path === '/v1/auth/refresh')!
    expect(refresh.method).toBe('POST')
    expect(refresh.body).toBe('{}')
    expect(refresh.headers.get('X-Requested-With')).toBeTruthy()
    expect(refresh.headers.get('Authorization')).toBeNull()
    expect(refresh.credentials).toBe('same-origin')
  })

  it('aynı sekmede eşzamanlı iki 401 → tek refresh', async () => {
    const tab = await loggedInTab()
    backend.expireAccess()

    const [a, b] = await Promise.all([
      unwrap(tab.client.GET('/v1/me')),
      unwrap(tab.client.GET('/v1/programs')),
    ])

    expect(a.account_id).toBe('acc-1')
    expect(b.programs).toEqual([])
    expect(backend.state.refreshCount).toBe(1)
  })

  it.each([
    ['15 dk', 900],
    ['30 gün', 30 * 24 * 3600],
    ['365 gün', 365 * 24 * 3600],
  ])(
    'İKİ SEKME eşzamanlı 401 → tek refresh (paylaşılan kilit + kanal + çerez kavanozu; oturum ömrü %s)',
    async (_name, ttl) => {
      backend.state.accessTtlSec = ttl
      const browser = createFakeBrowser()
      const jar = createJar()
      const tabB = createTab(browser.tab(), undefined, jar)
      const tabA = await loggedInTab(browser.tab(), undefined, jar)
      await sleep(0) // giriş yayını B'ye ulaşsın
      expect(tabB.session.token).toBe(T(1))
      backend.expireAccess()

      const [a, b] = await Promise.all([
        unwrap(tabA.client.GET('/v1/me')),
        unwrap(tabB.client.GET('/v1/me')),
      ])

      expect(a.account_id).toBe('acc-1')
      expect(b.account_id).toBe('acc-1')
      expect(backend.state.refreshCount).toBe(1)
      expect(backend.state.refreshEvents).toEqual(['rotated'])
      expect(tabA.session.token).toBe(T(2))
      expect(tabB.session.token).toBe(T(2))
    },
  )

  it('iki sekme, yayın kilit devrinden SONRA ulaşsa da sync-request ile tek refresh', async () => {
    const browser = createFakeBrowser({ deliveryDelayMs: 20 })
    const jar = createJar()
    const tabB = createTab(browser.tab(), undefined, jar)
    const tabA = await loggedInTab(browser.tab(), undefined, jar)
    await sleep(30)
    expect(tabB.session.token).toBe(T(1))
    backend.expireAccess()

    const [a, b] = await Promise.all([
      unwrap(tabA.client.GET('/v1/me')),
      unwrap(tabB.client.GET('/v1/me')),
    ])

    expect(a.account_id).toBe('acc-1')
    expect(b.account_id).toBe('acc-1')
    expect(backend.state.refreshCount).toBe(1)
    expect(tabA.session.snapshot.status).toBe('authenticated')
    expect(tabB.session.snapshot.status).toBe('authenticated')
  })

  it('Web Locks YOK: iki sekme aynı eski çerezle refresh atar; kaybeden 10 sn payında 401 alır, toplu iptal olmaz, yayınla devam eder', async () => {
    const browser = createFakeBrowser({ locks: false, deliveryDelayMs: 5 })
    const jar = createJar()
    const tabB = createTab(browser.tab(), undefined, jar)
    const tabA = await loggedInTab(browser.tab(), undefined, jar)
    await sleep(20)
    backend.expireAccess()
    backend.state.refreshBarrier = 2

    // İki sekme refresh'i aynı anda, aynı (henüz döndürülmemiş) çerezle gönderir.
    const [a, b] = await Promise.all([
      unwrap(tabA.client.GET('/v1/me')),
      unwrap(tabB.client.GET('/v1/me')),
    ])

    expect(a.account_id).toBe('acc-1')
    expect(b.account_id).toBe('acc-1')
    expect(backend.state.refreshEvents.filter((e) => e === 'rotated')).toHaveLength(1)
    expect(backend.state.refreshEvents).toContain('grace_denied')
    expect(backend.state.refreshEvents).not.toContain('reuse_revoked_all')
    expect(tabA.session.snapshot.status).toBe('authenticated')
    expect(tabB.session.snapshot.status).toBe('authenticated')
    expect(tabA.session.token).toBe(tabB.session.token)
  })

  it('Web Locks YOK, model: pay DIŞINDA (10 sn sonra) eski çerez tekrar kullanılırsa bütün oturumlar düşer', async () => {
    const browser = createFakeBrowser({ locks: false })
    const jar = createJar()
    const tabA = await loggedInTab(browser.tab(), undefined, jar)
    const staleCookie = jar.cookie
    backend.expireAccess()
    await unwrap(tabA.client.GET('/v1/me')) // rotasyon: kavanozda yeni çerez
    expect(backend.state.refreshEvents).toEqual(['rotated'])

    // Eski çerezi taşıyan ikinci bir istemci (ör. çalınmış belirteç) 10 sn sonra gelir.
    backend.state.clockOffsetMs = 11_000
    const thief = createTab(noopCoordination(), undefined, { cookie: staleCookie })
    expect(await thief.session.refresh(null)).not.toBe('ok')
    expect(backend.state.refreshEvents).toContain('reuse_revoked_all')

    // Meşru sekmenin oturumu da düştü: erişim 401, refresh 401 → "oturum sonlandı".
    await expect(unwrap(tabA.client.GET('/v1/me'))).rejects.toMatchObject({ status: 401 })
    expect(tabA.session.snapshot.status).toBe('ended')
  })

  it('Web Locks YOK, model: aynı eski çerez 10 sn İÇİNDE tekrar gelirse 401 ama toplu iptal yok', async () => {
    const jar = createJar()
    const tabA = await loggedInTab(noopCoordination(), undefined, jar)
    const staleCookie = jar.cookie
    backend.expireAccess()
    await unwrap(tabA.client.GET('/v1/me'))

    backend.state.clockOffsetMs = 5_000
    const late = createTab(noopCoordination(), undefined, { cookie: staleCookie })
    expect(await late.session.refresh(null)).not.toBe('ok')
    expect(backend.state.refreshEvents).toEqual(['rotated', 'grace_denied'])
    // Meşru sekme etkilenmez.
    expect((await unwrap(tabA.client.GET('/v1/me'))).account_id).toBe('acc-1')
  })

  it('refresh reddedilirse oturum temizlenir ("oturum sonlandı") ve orijinal 401 döner', async () => {
    const tab = await loggedInTab()
    backend.expireAccess()
    backend.state.refreshMode = 'unauthorized'

    const error = await unwrap(tab.client.GET('/v1/me')).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).code).toBe('platform.unauthenticated')
    expect(tab.session.token).toBeNull()
    expect(tab.session.snapshot.status).toBe('ended')
    expect(backend.state.refreshCount).toBe(1)
    expect(backend.count('/v1/me')).toBe(1)
  })

  it('refresh 5xx: oturum hakkında hüküm yok, belirteç kalır, istek tekrarlanmaz', async () => {
    const tab = await loggedInTab()
    backend.expireAccess()
    backend.state.refreshMode = 'server_error'

    await expect(unwrap(tab.client.GET('/v1/me'))).rejects.toMatchObject({ status: 401 })
    expect(tab.session.snapshot.status).toBe('authenticated')
    expect(backend.count('/v1/me')).toBe(1)
  })

  it('tekrarlanan istek yine 401 alırsa ikinci refresh yapılmaz (sonsuz döngü yok)', async () => {
    const tab = await loggedInTab()
    backend.server.use(
      http.get(`${BASE}/v1/me`, () =>
        HttpResponse.json(
          { code: 'platform.unauthenticated', message: 'x', request_id: 'r' },
          { status: 401 },
        ),
      ),
    )

    await expect(unwrap(tab.client.GET('/v1/me'))).rejects.toMatchObject({
      code: 'platform.unauthenticated',
    })
    expect(backend.state.refreshCount).toBe(1)
  })

  it.each([
    [
      'login',
      () =>
        createTab().client.POST('/v1/auth/login', {
          body: { email: 'a@example.test', password: 'yanlis' },
        }),
    ],
    ['logout', () => createTab().client.POST('/v1/auth/logout', {})],
  ])('%s ucunda 401 refresh tetiklemez', async (_name, call) => {
    await expect(unwrap(call())).rejects.toBeInstanceOf(ApiError)
    expect(backend.state.refreshCount).toBe(0)
  })
})

describe('429 ve hata zarfı', () => {
  it('429: Retry-After normalize hatada taşınır, yazma otomatik tekrarlanmaz', async () => {
    const tab = await loggedInTab()
    backend.server.use(
      http.post(`${BASE}/v1/programs`, ({ request }) => {
        backend.state.requests.push({
          method: 'POST',
          path: '/v1/programs',
          headers: request.headers,
          body: '',
          credentials: request.credentials,
        })
        return HttpResponse.json(
          { code: 'platform.rate_limited', message: 'x', request_id: 'req-429' },
          { status: 429, headers: { 'Retry-After': '30' } },
        )
      }),
    )

    const error = (await unwrap(tab.client.POST('/v1/programs', { body: { name: 'P' } })).catch(
      (e: unknown) => e,
    )) as ApiError

    expect(error.code).toBe('platform.rate_limited')
    expect(error.status).toBe(429)
    expect(error.retryAfter).toBe(30)
    expect(backend.count('/v1/programs')).toBe(1)
  })

  it('zarf → {code, messageKey, requestId, fields[]}; message taşınmaz', async () => {
    const tab = await loggedInTab()
    backend.server.use(
      http.post(`${BASE}/v1/programs`, () =>
        HttpResponse.json(
          {
            code: 'program.input_invalid',
            message: 'sunucu metni',
            request_id: 'req-422',
            fields: [{ field: 'name', code: 'program.input_invalid', message: 'x' }],
          },
          { status: 422 },
        ),
      ),
    )

    const error = (await unwrap(tab.client.POST('/v1/programs', { body: { name: '' } })).catch(
      (e: unknown) => e,
    )) as ApiError

    expect(error).toMatchObject({
      code: 'program.input_invalid',
      messageKey: 'errors.program.input_invalid',
      requestId: 'req-422',
      status: 422,
      fields: [
        {
          field: 'name',
          code: 'program.input_invalid',
          messageKey: 'errors.program.input_invalid',
        },
      ],
    })
    expect(error.message).not.toContain('sunucu metni')
    expect(JSON.stringify(error)).not.toContain('sunucu metni')
  })

  it('gövdede request_id yoksa X-Request-Id kullanılır', async () => {
    const tab = await loggedInTab()
    backend.server.use(
      http.get(`${BASE}/v1/programs`, () =>
        HttpResponse.json(
          { code: 'platform.internal', message: 'x' },
          { status: 500, headers: { 'X-Request-Id': 'hdr-1' } },
        ),
      ),
    )
    await expect(unwrap(tab.client.GET('/v1/programs'))).rejects.toMatchObject({
      code: 'platform.internal',
      requestId: 'hdr-1',
    })
  })

  it('JSON olmayan yanıt → client.invalid_response; ağ hatası → client.network_error', async () => {
    const tab = await loggedInTab()
    backend.server.use(
      http.get(
        `${BASE}/v1/programs`,
        () =>
          new HttpResponse('<html>bad gateway</html>', {
            status: 502,
            headers: { 'X-Request-Id': 'hdr-2' },
          }),
      ),
    )
    await expect(unwrap(tab.client.GET('/v1/programs'))).rejects.toMatchObject({
      code: 'client.invalid_response',
      status: 502,
      requestId: 'hdr-2',
    })

    backend.server.use(http.get(`${BASE}/v1/programs`, () => HttpResponse.error()))
    await expect(unwrap(tab.client.GET('/v1/programs'))).rejects.toMatchObject({
      code: 'client.network_error',
      messageKey: 'errors.client.network_error',
    })
  })
})

describe('CSRF, kapsam ve kimlik başlıkları', () => {
  it('yazmalarda X-Requested-With var, okumalarda yok', async () => {
    const tab = await loggedInTab()
    await unwrap(tab.client.POST('/v1/programs', { body: { name: 'P' } }))
    await unwrap(tab.client.GET('/v1/programs'))

    const post = backend.state.requests.find(
      (r) => r.method === 'POST' && r.path === '/v1/programs',
    )!
    const get = backend.state.requests.find((r) => r.method === 'GET' && r.path === '/v1/programs')!
    expect(post.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(get.headers.get('X-Requested-With')).toBeNull()
    const login = backend.state.requests.find((r) => r.path === '/v1/auth/login')!
    expect(login.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
  })

  it('S2 uç: X-Nizamio-Program kapsam deposundan eklenir', async () => {
    const tab = await loggedInTab(undefined, { programId: 'prg-1', departmentId: 'dep-1' })
    await unwrap(tab.client.GET('/v1/program'))
    const req = backend.state.requests.find((r) => r.path === '/v1/program')!
    expect(req.headers.get('X-Nizamio-Program')).toBe('prg-1')
    // Spec'te S3 olmayan uca departman başlığı eklenmez.
    expect(req.headers.get('X-Nizamio-Department')).toBeNull()
  })

  it('S2 uçta kapsam yoksa istemci tarafı açık hata, istek gönderilmez', async () => {
    const tab = await loggedInTab()
    await expect(unwrap(tab.client.GET('/v1/program'))).rejects.toMatchObject({
      code: 'client.scope_missing',
    })
    expect(backend.count('/v1/program')).toBe(0)
  })

  it('S1 uçta kapsam seçili olsa da kapsam başlığı gönderilmez', async () => {
    const tab = await loggedInTab(undefined, { programId: 'prg-1', departmentId: 'dep-1' })
    await unwrap(tab.client.GET('/v1/programs'))
    const req = backend.state.requests.find((r) => r.path === '/v1/programs')!
    expect(req.headers.get('X-Nizamio-Program')).toBeNull()
    expect(req.headers.get('Authorization')).toBe(`Bearer ${T(1)}`)
  })

  it('S0 uçta Bearer gönderilmez', async () => {
    const tab = await loggedInTab()
    await unwrap(tab.client.GET('/v1/instance/profile'))
    const req = backend.state.requests.find((r) => r.path === '/v1/instance/profile')!
    expect(req.headers.get('Authorization')).toBeNull()
  })

  it('spec dışı uç istemci tarafında reddedilir', async () => {
    const tab = createTab()
    const call = (tab.client.GET as unknown as (p: string) => Promise<{ response: Response }>)(
      '/v1/yok',
    )
    await expect(unwrap(call)).rejects.toMatchObject({ code: 'client.unknown_operation' })
    expect(backend.state.requests).toHaveLength(0)
  })

  it('403 identity.force_password_change_required → oturum bayrağı', async () => {
    const tab = await loggedInTab()
    backend.server.use(
      http.get(`${BASE}/v1/me`, () =>
        HttpResponse.json(
          { code: 'identity.force_password_change_required', message: 'x', request_id: 'r' },
          { status: 403 },
        ),
      ),
    )
    await expect(unwrap(tab.client.GET('/v1/me'))).rejects.toMatchObject({
      code: 'identity.force_password_change_required',
    })
    expect(tab.session.snapshot.forcePasswordChange).toBe(true)
  })
})

describe('belirteç yalnız bellekte', () => {
  it('giriş, refresh ve çıkış boyunca localStorage/sessionStorage yazılmaz', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const tab = await loggedInTab()
    backend.expireAccess()
    await unwrap(tab.client.GET('/v1/me'))
    await unwrap(tab.client.POST('/v1/auth/logout', {}))
    tab.session.clear()

    expect(setItem).not.toHaveBeenCalled()
    // Denetim amaçlı okuma; uygulama kodunda depolama yasağı lint kuralıyla korunur.
    // eslint-disable-next-line no-restricted-globals -- testin kendisi depoların boş kaldığını doğrular
    expect(localStorage.length).toBe(0)
    // eslint-disable-next-line no-restricted-globals -- testin kendisi depoların boş kaldığını doğrular
    expect(sessionStorage.length).toBe(0)
    expect(document.cookie).toBe('')
  })

  it('belirteç oturum anlık görüntüsünde ve JSON serileştirmesinde yer almaz', async () => {
    const tab = await loggedInTab()
    expect(JSON.stringify(tab.session.snapshot)).not.toContain(T(1))
    expect(JSON.stringify(tab.session)).not.toContain(T(1))
  })
})
