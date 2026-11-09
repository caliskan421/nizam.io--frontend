// @vitest-environment node
// Çok parçalı gövde (File) Node'un fetch/FormData/File üçlüsüyle okunur; jsdom'un File'ı
// undici gövde akışında okunamaz (test ortamı sınırı, üretim davranışı değil).
/**
 * Taşıyıcı tekrarı sözleşmesi (CX-F1-E-05 devamı, koordinatör kararı W67): 401 → refresh →
 * tekrar YENİ bir yazma kararı değildir; sunucunun kimlik nedeniyle İŞLEMEDİĞİ AYNI isteğin
 * tamamlanmasıdır. Engellemek, kullanıcının verdiği kaydet/sil komutunu belirteç tam o anda
 * dolduysa sessizce düşürürdü. Güvenli olması için (`client.ts` tekrar bloğu):
 *  (1) aynı istek — yalnız `Authorization` değişir, kapsam başlıkları YENİDEN ÜRETİLMEZ;
 *  (2) en fazla bir kez — ikinci 401 olduğu gibi döner; eşzamanlı isteklerde tek refresh;
 *  (3) aynı kimlik — çıkış / hesap değişimi / oturum nesli değişiminde tekrar 0;
 *  (4) giriş/refresh/çıkış tekrarlanmaz (`client.test.ts`).
 * Gerçek API istemcisi + gerçek AuthSession + MSW sahte backend (rotasyonlu refresh).
 */
import { HttpResponse, http } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { AuthSession } from '@/shared/session/auth-session'
import type { ScopeSnapshot } from '@/shared/scope/scope'

import {
  BASE,
  createFakeBackend,
  createJar,
  jarFetch,
  noopCoordination,
  T,
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

/** Tek sekme: AuthSession + API istemcisi; kapsam istek anında `scopeRef`'ten okunur. */
async function loggedInTab(scope: ScopeSnapshot) {
  const fetch = jarFetch(createJar())
  const session = new AuthSession({
    baseUrl: BASE,
    fetch,
    coordination: noopCoordination(),
    syncWaitMs: 0,
  })
  const scopeRef = { current: scope }
  const client = createApiClient({ baseUrl: BASE, session, scope: () => scopeRef.current, fetch })
  const tab = { session, client, scopeRef }
  await login(tab)
  return tab
}

type Tab = Awaited<ReturnType<typeof loggedInTab>>

async function login(tab: Pick<Tab, 'session' | 'client'>) {
  const generation = tab.session.generation
  const res = await unwrap(
    tab.client.POST('/v1/auth/login', {
      body: { email: 'a@example.test', password: 'dogru-parola' },
    }),
  )
  tab.session.establish(res, res.force_password_change, generation)
}

describe('taşıyıcı tekrarı = aynı isteğin tamamlanması (CX-F1-E-05 devamı)', () => {
  const SCOPE_A: ScopeSnapshot = { programId: 'p-a', departmentId: 'd-a' }
  const SCOPE_B: ScopeSnapshot = { programId: 'p-b', departmentId: 'd-b' }
  const createBody = { title: 'Rapor', start_on: '2026-11-01', end_on: '2026-11-10' }
  const COPIED = [
    'Idempotency-Key',
    'X-Requested-With',
    'X-Nizamio-Program',
    'X-Nizamio-Department',
    'Content-Type',
  ]

  interface Seen {
    method: string
    url: string
    headers: Headers
    body: string
  }

  /**
   * Yazma ucu: ilk istek `release` edilene dek sunucuda bekletilir ve 401 döner (kimlik
   * nedeniyle İŞLENMEDİ); sonraki her istek `next` ile yanıtlanır. Her istek kaydedilir.
   */
  function heldWrite(
    method: 'post' | 'patch',
    path: string,
    next: () => Response = () => HttpResponse.json({ ok: true }, { status: 201 }),
  ) {
    const seen: Seen[] = []
    let release!: () => void
    const held = new Promise<void>((resolve) => (release = resolve))
    let arrived!: () => void
    const reached = new Promise<void>((resolve) => (arrived = resolve))
    backend.server.use(
      http[method](`${BASE}${path}`, async ({ request }) => {
        const entry: Seen = {
          method: request.method,
          url: request.url,
          headers: new Headers(request.headers),
          body: await request.text(),
        }
        seen.push(entry)
        if (seen.length > 1) return next()
        arrived()
        await held
        return backend.envelope('platform.unauthenticated', 401)
      }),
    )
    return { seen, reached, release }
  }

  /** Refresh isteği sunucuya ulaştığında `onRefresh` çalışır; yanıt sahte backend'den gelir. */
  function duringRefresh(onRefresh: () => void | Promise<void>) {
    backend.server.use(
      http.post(`${BASE}/v1/auth/refresh`, async () => {
        await onRefresh()
        return undefined // sahte backend işleyicisine düşer (rotasyon)
      }),
    )
  }

  function expectSameRequest(first: Seen, retry: Seen) {
    expect(retry.method).toBe(first.method)
    expect(retry.url).toBe(first.url)
    expect(retry.body).toBe(first.body)
    for (const name of COPIED) expect(retry.headers.get(name), name).toBe(first.headers.get(name))
  }

  it('JSON yazma: tekrar özgün isteğin aynısı (yöntem, URL, gövde, IK, CSRF, kapsam); yalnız Authorization yenilenir; refresh sırasında kapsam A→B olsa da tekrar A ile gider', async () => {
    const tab = await loggedInTab(SCOPE_A)
    const write = heldWrite('post', '/v1/work-items')
    duringRefresh(() => {
      tab.scopeRef.current = SCOPE_B
    })

    const pending = tab.client.POST('/v1/work-items', {
      params: { header: { 'Idempotency-Key': 'ik-json-1' } },
      body: createBody,
    })
    await write.reached
    write.release()
    const result = await pending

    expect(result.response.status).toBe(201)
    expect(tab.scopeRef.current).toEqual(SCOPE_B)
    expect(write.seen).toHaveLength(2)
    const [first, retry] = write.seen as [Seen, Seen]
    expectSameRequest(first, retry)
    expect(JSON.parse(retry.body)).toEqual(createBody)
    expect(retry.headers.get('Idempotency-Key')).toBe('ik-json-1')
    expect(retry.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(retry.headers.get('X-Nizamio-Program')).toBe('p-a')
    expect(retry.headers.get('X-Nizamio-Department')).toBe('d-a')
    expect(write.seen.map((s) => s.headers.get('Authorization'))).toEqual([
      `Bearer ${T(1)}`,
      `Bearer ${T(2)}`,
    ])
    expect(backend.state.refreshCount).toBe(1)
  })

  it('multipart yükleme (File): tekrar gövdesi bayt bayt aynı, sınır (Content-Type) ve IK aynı', async () => {
    const tab = await loggedInTab(SCOPE_A)
    const write = heldWrite('post', '/v1/work-items/w1/files')
    const form = new FormData()
    form.append('file', new File(['%PDF-içerik'], 'rapor.pdf', { type: 'application/pdf' }))

    const pending = tab.client.POST('/v1/work-items/{id}/files', {
      params: {
        path: { id: 'w1' },
        query: { tag: 'sonuc' },
        header: {
          'Idempotency-Key': 'ik-file-1',
          'X-Nizamio-Program': 'p-a',
          'X-Nizamio-Department': 'd-a',
        },
      },
      body: form as never,
    })
    await write.reached
    tab.scopeRef.current = SCOPE_B
    write.release()
    const result = await pending

    expect(result.response.status).toBe(201)
    expect(write.seen).toHaveLength(2)
    const [first, retry] = write.seen as [Seen, Seen]
    expectSameRequest(first, retry)
    expect(retry.headers.get('Content-Type')).toMatch(/^multipart\/form-data; boundary=/)
    expect(retry.body).toContain('%PDF-içerik')
    expect(retry.headers.get('X-Nizamio-Program')).toBe('p-a')
    expect(retry.headers.get('Authorization')).toBe(`Bearer ${T(2)}`)
  })

  it('en fazla bir kez: tekrar da 401 alırsa olduğu gibi döner (toplam 2 istek, 1 refresh, döngü yok)', async () => {
    const tab = await loggedInTab(SCOPE_A)
    const write = heldWrite('post', '/v1/work-items', () =>
      backend.envelope('platform.unauthenticated', 401),
    )
    const pending = tab.client.POST('/v1/work-items', {
      params: { header: { 'Idempotency-Key': 'ik-2' } },
      body: createBody,
    })
    await write.reached
    write.release()

    expect((await pending).response.status).toBe(401)
    expect(write.seen).toHaveLength(2)
    expect(backend.state.refreshCount).toBe(1)
  })

  it('eşzamanlı iki yazma: tek refresh, her biri tam bir kez tekrarlanır (IK korunur)', async () => {
    const tab = await loggedInTab(SCOPE_A)
    const seen: Array<{ key: string | null; auth: string | null }> = []
    backend.server.use(
      http.post(`${BASE}/v1/work-items`, ({ request }) => {
        const auth = request.headers.get('Authorization')
        seen.push({ key: request.headers.get('Idempotency-Key'), auth })
        return auth === `Bearer ${T(1)}`
          ? backend.envelope('platform.unauthenticated', 401)
          : HttpResponse.json({ ok: true }, { status: 201 })
      }),
    )

    const results = await Promise.all(
      ['ik-a', 'ik-b'].map((key) =>
        tab.client.POST('/v1/work-items', {
          params: { header: { 'Idempotency-Key': key } },
          body: createBody,
        }),
      ),
    )

    expect(results.map((r) => r.response.status)).toEqual([201, 201])
    expect(backend.state.refreshCount).toBe(1)
    for (const key of ['ik-a', 'ik-b']) {
      expect(seen.filter((s) => s.key === key).map((s) => s.auth)).toEqual([
        `Bearer ${T(1)}`,
        `Bearer ${T(2)}`,
      ])
    }
  })

  describe('aynı kimlik: oturum değiştiyse tekrar 0 (başka kimlikle özgün yazma asla gitmez)', () => {
    async function signOutTab(tab: Tab) {
      await tab.client.POST('/v1/auth/logout', {})
      tab.session.clear()
    }

    it('çıkış: 401 beklerken oturum kapanır → refresh reddedilir, tekrar 0, özgün 401 döner', async () => {
      const tab = await loggedInTab(SCOPE_A)
      const write = heldWrite('post', '/v1/work-items')
      const pending = tab.client.POST('/v1/work-items', {
        params: { header: { 'Idempotency-Key': 'ik-3' } },
        body: createBody,
      })
      await write.reached
      await signOutTab(tab)
      write.release()

      expect((await pending).response.status).toBe(401)
      expect(write.seen).toHaveLength(1)
    })

    it('çıkış: refresh uçuştayken oturum kapanır → gecikmiş refresh uygulanmaz, tekrar 0', async () => {
      const tab = await loggedInTab(SCOPE_A)
      const write = heldWrite('post', '/v1/work-items')
      duringRefresh(() => tab.session.clear())
      const pending = tab.client.POST('/v1/work-items', {
        params: { header: { 'Idempotency-Key': 'ik-4' } },
        body: createBody,
      })
      await write.reached
      write.release()

      expect((await pending).response.status).toBe(401)
      expect(write.seen).toHaveLength(1)
      expect(tab.session.token).toBeNull()
    })

    it('hesap değişimi: 401 beklerken çıkış → başka hesapla giriş → tekrar 0 (B belirteciyle A yazması gitmez)', async () => {
      const tab = await loggedInTab(SCOPE_A)
      const write = heldWrite('post', '/v1/work-items')
      const pending = tab.client.POST('/v1/work-items', {
        params: { header: { 'Idempotency-Key': 'ik-5' } },
        body: createBody,
      })
      await write.reached
      await signOutTab(tab)
      const otherToken = 'tok-baska-hesap-0001'
      tab.session.establish({
        token: otherToken,
        account_id: 'acc-2',
        expires_at: Math.floor(Date.now() / 1000) + 900,
        force_password_change: false,
      })
      write.release()

      expect((await pending).response.status).toBe(401)
      expect(write.seen).toHaveLength(1)
      expect(tab.session.snapshot.accountId).toBe('acc-2')
      expect(
        write.seen.some((s) => s.headers.get('Authorization') === `Bearer ${otherToken}`),
      ).toBe(false)
    })

    it('oturum nesli değişimi (aynı hesap): 401 beklerken çıkış → yeniden giriş → tekrar 0', async () => {
      const tab = await loggedInTab(SCOPE_A)
      const write = heldWrite('post', '/v1/work-items')
      const pending = tab.client.POST('/v1/work-items', {
        params: { header: { 'Idempotency-Key': 'ik-6' } },
        body: createBody,
      })
      await write.reached
      await signOutTab(tab)
      await login(tab)
      expect(tab.session.snapshot.accountId).toBe('acc-1')
      write.release()

      expect((await pending).response.status).toBe(401)
      expect(write.seen).toHaveLength(1)
      expect(backend.state.refreshCount).toBe(0)
    })

    it('kimliksiz gönderilmiş istek, aynı nesilde sonradan kurulan oturumun belirteciyle tekrarlanmaz (hesap denetimi)', async () => {
      const tab = await loggedInTab(SCOPE_A)
      await signOutTab(tab) // nesil artık sabit; aşağıdaki giriş nesli DEĞİŞTİRMEZ
      const write = heldWrite('post', '/v1/work-items')
      const pending = tab.client.POST('/v1/work-items', {
        params: { header: { 'Idempotency-Key': 'ik-7' } },
        body: createBody,
      })
      await write.reached
      const generation = tab.session.generation
      await login(tab)
      expect(tab.session.generation).toBe(generation)
      write.release()

      expect((await pending).response.status).toBe(401)
      expect(write.seen).toHaveLength(1)
      expect(write.seen[0]!.headers.get('Authorization')).toBeNull()
    })
  })
})
