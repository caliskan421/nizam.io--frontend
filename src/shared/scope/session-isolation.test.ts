// CX-F1-Ö-08 (F2 W82 borç 16): çıkış → başka hesapla giriş sırasında eski oturumun sorgusu yeni
// oturumun önbelleğine karışmaz. Gerçek oturum + API istemcisi + kabuğun kapsam yaşam döngüsü
// (`useScopeLifecycle` → `bindSessionQueries`, standing okuyucuları `sessionBound`) + MSW; önbellek
// içeriği denetlenir. Dört senaryo: (yerel | kardeş sekme çıkışı) × (geciktirilmiş GET | geçici
// hata tekrarı). Kardeş sekme, oturumun gerçek `BroadcastChannel` aboneliğine sahte kanal
// üzerinden `logout` iletisiyle konuşur.
import { focusManager, QueryClient, type Query } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { settleQueries, until } from '@/shared/http/__tests__/settle'

import { createFakeBackend } from '../../../tests/support/fake-backend'
import { createTarget, withSetup } from './__tests__/harness'

const backend = createFakeBackend()
beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  backend.server.resetHandlers()
  backend.reset()
  focusManager.setFocused(undefined)
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})
afterAll(() => backend.server.close())

const ORIGIN = 'http://localhost'
const ACC2_TOKEN = 'tok-hesap-iki-0000'

/** Sahte `BroadcastChannel`: kardeş sekmenin iletisi oturumun gerçek abonesine ulaşır. */
class FakeChannel {
  static live: FakeChannel[] = []
  readonly listeners: Array<(event: { data: unknown }) => void> = []
  constructor(readonly name: string) {
    FakeChannel.live.push(this)
  }
  postMessage(): void {}
  addEventListener(_type: string, fn: (event: { data: unknown }) => void): void {
    this.listeners.push(fn)
  }
}

function siblingSays(data: unknown): void {
  for (const channel of FakeChannel.live) for (const fn of channel.listeners) fn({ data })
}

const accountOf = (request: Request) =>
  request.headers.get('Authorization') === `Bearer ${ACC2_TOKEN}` ? 'acc-2' : 'acc-1'

const me = (account: string) =>
  HttpResponse.json({
    account_id: account,
    email: `${account}@example.test`,
    full_name: `Kişi ${account}`,
    company_admin: false,
  })

type MeMode = 'hold' | 'fail-once'

/** Standing uçları; `/v1/me` acc-1 için bekletilir ya da bir kez 503 döner. */
function standing(mode: MeMode) {
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  let arrived!: () => void
  const reached = new Promise<void>((resolve) => (arrived = resolve))
  const meCalls: string[] = []
  let failed = false
  backend.server.use(
    http.get(`${ORIGIN}/v1/me`, async ({ request }) => {
      const account = accountOf(request)
      meCalls.push(account)
      if (account === 'acc-1' && mode === 'hold') {
        arrived()
        await held
      }
      if (account === 'acc-1' && mode === 'fail-once' && !failed) {
        failed = true
        arrived()
        return backend.envelope('platform.internal', 503)
      }
      return me(account)
    }),
    http.get(`${ORIGIN}/v1/me/departments`, () => HttpResponse.json({ departments: [] })),
    http.get(`${ORIGIN}/v1/programs`, () => HttpResponse.json({ programs: [] })),
  )
  return { reached, release, meCalls }
}

/** Taze modül grafiği (sahte kanal), acc-1 girişi, kabuğun kapsam yaşam döngüsü bağlı. */
async function boot() {
  FakeChannel.live = []
  vi.stubGlobal('BroadcastChannel', FakeChannel)
  vi.resetModules()
  const pinia = createPinia()
  setActivePinia(pinia)
  const session = (await import('@/shared/session/store')).useSessionStore()
  const lifecycle = await import('@/shared/scope/lifecycle')
  const { SESSION_MESSAGE_VERSION } = await import('@/shared/session/messages')
  ;(await import('@/shared/preferences')).preferences.clearAll()
  await session.login({ email: 'kisi@example.test', password: 'dogru-parola' })
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retryDelay: 0 } },
  })
  withSetup(() => lifecycle.useScopeLifecycle(createTarget()), pinia, client)
  return { session, client, version: SESSION_MESSAGE_VERSION }
}

type Ctx = Awaited<ReturnType<typeof boot>>

/** Çıkış: yerel (`logout`) ya da kardeş sekme (`logout` iletisi). */
async function signOut(ctx: Ctx, where: 'yerel' | 'kardeş'): Promise<void> {
  if (where === 'yerel') await ctx.session.logout(ctx.client)
  else siblingSays({ v: ctx.version, type: 'logout', accountId: 'acc-1' })
  expect(ctx.session.status).toBe('anonymous')
}

/** Başka hesapla (acc-2) açık giriş. */
async function signInOther(ctx: Ctx): Promise<void> {
  backend.server.use(
    http.post(`${ORIGIN}/v1/auth/login`, () =>
      HttpResponse.json({
        token: ACC2_TOKEN,
        account_id: 'acc-2',
        expires_at: Math.floor(Date.now() / 1000) + 900,
        force_password_change: false,
      }),
    ),
  )
  await ctx.session.login({ email: 'iki@example.test', password: 'dogru-parola' })
  expect(ctx.session.accountId).toBe('acc-2')
}

const meQuery = (client: QueryClient) => client.getQueryCache().find({ queryKey: ['me'] })

/** Önbellekte acc-1'e ait hiçbir veri yok; `['me']` (varsa) yeni hesabın. */
function expectNoOldAccount(client: QueryClient): void {
  const cached = client
    .getQueryCache()
    .getAll()
    .map((q: Query) => JSON.stringify(q.state.data ?? null))
  expect(cached.filter((text) => text.includes('acc-1'))).toEqual([])
  const current = client.getQueryData<{ account_id: string }>(['me'])
  if (current) expect(current.account_id).toBe('acc-2')
}

describe.each(['yerel', 'kardeş'] as const)('%s çıkış → başka hesapla giriş (Ö-08)', (where) => {
  it('geciktirilmiş GET: eski oturumun geç yanıtı yeni oturumun önbelleğine yazılmaz', async () => {
    const endpoints = standing('hold')
    const ctx = await boot()
    await endpoints.reached
    await signOut(ctx, where)
    await signInOther(ctx)
    endpoints.release()
    await settleQueries(ctx.client)
    expectNoOldAccount(ctx.client)
  })

  it('geçici hata tekrarı: eski sorgu yeni hesabın kimliğiyle sürdürülmez', async () => {
    // Tekrar, odak dönene dek bekler (TanStack `pause`): çıkış + giriş tam bu aralıkta olur.
    focusManager.setFocused(false)
    const endpoints = standing('fail-once')
    const ctx = await boot()
    await endpoints.reached
    await until(
      () => meQuery(ctx.client)?.state.fetchStatus === 'paused',
      (notify) => ctx.client.getQueryCache().subscribe(notify),
    )
    const old = meQuery(ctx.client)!
    expect(old.state.fetchFailureCount).toBe(1)
    await signOut(ctx, where)
    await signInOther(ctx)
    focusManager.setFocused(true)
    await settleQueries(ctx.client)
    // Eski sorgu nesnesi yeni hesabın verisini taşımaz (tekrarı acc-2 ile koşmadı).
    expect(old.state.data).toBeUndefined()
    expectNoOldAccount(ctx.client)
    // acc-1 tek istek (başarısız ilk deneme); acc-2 yalnız yeni oturumun kendi okuması.
    expect(endpoints.meCalls.filter((a) => a === 'acc-1')).toEqual(['acc-1'])
  })
})
