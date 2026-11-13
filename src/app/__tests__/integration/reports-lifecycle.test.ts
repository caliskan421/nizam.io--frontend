// W142 · O3 senaryo 7: geç sonuç ve oturum — rapor hazırlanırken ekran sökülür (bilet tüketilmez, bildirim
// yok), kapsam (program) değişir, hesap değişir (kardeş sekme çıkışı), 401 yenileme sırasında rapor isteği
// (ortak yenileme kuralı: tek uçuş refresh + bir kez tekrar). KESİN 26a.
import { http } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { envelope, json, ORIGIN } from './fake-org'
import { siblingSays } from './harness'
import {
  $,
  ADMIN,
  boot,
  byText,
  captureSaves,
  hold,
  idle,
  issued,
  reports,
  resetReports,
  switchScope,
  teardown,
  toasts,
  until,
  useReportsBackend,
  userClick,
} from './reports-support'

const backend = useReportsBackend({ coordinator: 'koordinator', member: 'uye' })
const saved: string[] = []
const PDF = () => byText('button', 'Dönem sonu raporu (PDF)')
const redeemed = () => reports.state.redeemed

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetReports()
  await boot({ ...ADMIN, path: '/arsiv' })
  await until(PDF, 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  resetReports()
  saved.length = 0
  captureSaves(saved)
})
afterEach(() => {
  vi.useRealTimers()
  teardown()
})
afterAll(() => backend.server.close())

describe('ekran sökülür', () => {
  it('bilet beklerken söküm: bilet tüketilmez, dosya kaydedilmez, bildirim yok', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await until(PDF, 'düğme')
    const gate = hold('POST', '/v1/download-tickets')
    await userClick(PDF)
    await gate.arrived
    await app.router.push('/')
    await until(() => $('[data-testid="home-page"]'), 'ana sayfa')
    gate.release()
    await idle(app.queryClient)
    expect(redeemed()).toHaveLength(0)
    expect(saved).toHaveLength(0)
    expect(toasts()).toBe('')
  })

  it('tüketim sürerken söküm: dosya kaydedilmez, bildirim yok; kilit bırakılır (yeni rapor başlar)', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await until(PDF, 'düğme')
    const gate = hold('GET', '/v1/downloads/rt-1')
    await userClick(PDF)
    await gate.arrived
    await app.router.push('/')
    await until(() => $('[data-testid="home-page"]'), 'ana sayfa')
    gate.release()
    await idle(app.queryClient)
    expect(saved).toHaveLength(0)
    expect(toasts()).toBe('')
    // Kilit bırakıldı: Arşiv'e dönünce düğme yeniden etkin ve ikinci eylem çalışır.
    await app.router.push('/arsiv')
    await until(PDF, 'düğme')
    expect((PDF() as HTMLButtonElement).disabled).toBe(false)
    await userClick(PDF)
    await until(() => saved.length === 1, 'ikinci indirme')
  })

  it('bütün uygulama sökülür: geç sonuç hiçbir istek başlatmaz', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await until(PDF, 'düğme')
    const gate = hold('POST', '/v1/download-tickets')
    await userClick(PDF)
    await gate.arrived
    app.wrapper.unmount()
    const count = backend.requests.length
    gate.release()
    await until(() => issued().length === 1, 'istek tamamlandı')
    await app.queryClient.cancelQueries()
    expect(backend.requests.length).toBe(count)
    expect(document.body.querySelector('.rp-toast')).toBeNull()
  })
})

describe('kapsam ve hesap değişimi', () => {
  it('program değişince uçuştaki rapor iptal: bilet tüketilmez, bildirim yok', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await until(PDF, 'düğme')
    const gate = hold('POST', '/v1/download-tickets')
    await userClick(PDF)
    await gate.arrived
    await switchScope('Program', 'Teknofest 2027')
    await until(() => app.scope.programId === 'p2', 'kapsam p2')
    gate.release()
    await idle(app.queryClient)
    expect(redeemed()).toHaveLength(0)
    expect(saved).toHaveLength(0)
    expect(toasts()).toBe('')
  })

  it('kardeş sekme çıkışı (hesap değişir): uçuştaki rapor iptal, giriş ekranında bildirim yok', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv', siblingChannel: true })
    await until(PDF, 'düğme')
    const gate = hold('GET', '/v1/downloads/rt-1')
    await userClick(PDF)
    await gate.arrived
    const { SESSION_MESSAGE_VERSION } = await import('@/shared/session/messages')
    siblingSays({ v: SESSION_MESSAGE_VERSION, type: 'logout', accountId: app.session.accountId })
    await until(() => $('[data-testid="login-form"]'), 'giriş ekranı')
    const count = backend.requests.length
    gate.release()
    await until(() => redeemed().length === 1, 'istek tamamlandı')
    expect(backend.requests.length).toBe(count)
    expect(saved).toHaveLength(0)
    expect(toasts()).toBe('')
  })
})

describe('401 yenileme sırasında rapor isteği (ortak yenileme kuralı)', () => {
  function expiringToken(refresh: 'ok' | 'invalid'): { refreshes: () => number } {
    let refreshes = 0
    backend.server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, ({ request }) =>
        request.headers.get('Authorization') === 'Bearer tok-refreshed'
          ? undefined
          : envelope('platform.unauthenticated', 401),
      ),
      http.post(`${ORIGIN}/v1/auth/refresh`, () => {
        refreshes += 1
        if (refresh === 'invalid') return envelope('identity.session_invalid', 401)
        backend.db.tokens.set('tok-refreshed', 'acc-admin')
        return json({
          token: 'tok-refreshed',
          account_id: 'acc-admin',
          expires_at: Math.floor(Date.now() / 1000) + 900,
          refresh_expires_at: 0,
        })
      }),
    )
    return { refreshes: () => refreshes }
  }

  it('401 → tek refresh → bilet isteği BİR kez tekrarlanır → indirilir', async () => {
    const probe = expiringToken('ok')
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await until(PDF, 'düğme')
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await userClick(PDF)
    await until(() => backend.sent('POST', '/v1/download-tickets').length === 1, 'bilet 401')
    await vi.advanceTimersByTimeAsync(150)
    await until(() => saved.length === 1, 'kaydedildi')
    await idle(app.queryClient)
    expect(probe.refreshes()).toBe(1)
    expect(backend.sent('POST', '/v1/download-tickets')).toHaveLength(2)
    expect(redeemed()).toEqual(['rt-1'])
    expect(toasts()).toContain('indirildi')
  })

  it('refresh reddedilirse oturum biter: tekrar yok, bilet tüketilmez, dosya yok', async () => {
    const probe = expiringToken('invalid')
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await until(PDF, 'düğme')
    // Kardeş sekme bekleme süreleri (150 ms eşitleme + 1 sn akran) sahte saatle ilerletilir.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await userClick(PDF)
    await until(() => backend.sent('POST', '/v1/download-tickets').length === 1, 'bilet 401')
    await vi.advanceTimersByTimeAsync(150)
    await until(() => backend.sent('POST', '/v1/auth/refresh').length === 1, 'refresh')
    await vi.advanceTimersByTimeAsync(1000)
    await until(() => $('[data-testid="login-form"]'), 'giriş ekranı')
    await idle(app.queryClient)
    expect(probe.refreshes()).toBe(1)
    expect(backend.sent('POST', '/v1/download-tickets')).toHaveLength(1)
    expect(redeemed()).toHaveLength(0)
    expect(saved).toHaveLength(0)
  })
})
