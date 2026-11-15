// W160 · O3 senaryo 6: Web Push (P58 "dahil") — `enabled=false` kutu yok; `enabled=true` → izin
// akışı (sahte `Notification`/`PushManager`) → `registerPushTarget` gövdesi → hata 409/422 → yerel
// geri alma → çıkışta unregisterPushTarget + yerel unsubscribe. İzin ve `sw.js` kaydı YALNIZ kullanıcı
// eyleminde. Gerçek `subscribe` kanıtı (push servisi) bu turda yoktur: W162 gerçek tarayıcı.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { installPushBrowser, ENDPOINT, type PushBrowser } from './fake-push-browser'
import {
  $,
  boot,
  idle,
  MEMBER,
  notifications,
  openPanel,
  resetNotifications,
  sent,
  teardown,
  until,
  useNotificationsBackend,
  userClick,
  VAPID_KEY,
} from './notifications-support'

const backend = useNotificationsBackend({ coordinator: 'koordinator', member: 'uye' })
let browser: PushBrowser

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetNotifications()
  await boot({ ...MEMBER, path: '/gorevler' })
  teardown()
}, 60_000)
beforeEach(() => {
  resetNotifications()
  notifications.state.vapid = { enabled: true, public_key: VAPID_KEY }
})
afterEach(() => {
  teardown()
  browser?.restore()
})
afterAll(() => backend.server.close())

const box = () => $('[data-testid="push-opt-in"]')
const view = () => box()?.getAttribute('data-view') ?? null

async function openWith(options: Parameters<typeof installPushBrowser>[0] = {}) {
  browser = installPushBrowser(options)
  const app = await boot({ ...MEMBER, path: '/gorevler' })
  await idle(app.queryClient)
  await openPanel()
  return app
}

describe('kutu görünürlüğü', () => {
  it('enabled=false → kutu hiç çizilmez; izin istenmez, sw.js kaydedilmez', async () => {
    notifications.state.vapid = { enabled: false, public_key: '' }
    const app = await openWith()
    await idle(app.queryClient)
    expect(box()).toBeNull()
    expect(browser.requestPermission).not.toHaveBeenCalled()
    expect(browser.register).not.toHaveBeenCalled()
  })

  it('enabled=true → önerme kutusu; panel açılışında izin istenmez ve sw.js kaydedilmez', async () => {
    const app = await openWith()
    await until(() => view() === 'prompt', 'önerme')
    await idle(app.queryClient)
    expect(browser.requestPermission).not.toHaveBeenCalled()
    expect(browser.register).not.toHaveBeenCalled()
    expect(sent('GET', '/v1/notifications/vapid-public-key')).toHaveLength(1)
  })

  it('izin önceden reddedilmiş → açılışta hatırlatma yok (kutu çizilmez); izin istenmez', async () => {
    const app = await openWith({ permission: 'denied' })
    await until(
      () => sent('GET', '/v1/notifications/vapid-public-key').length === 1,
      'anahtar okundu',
    )
    await idle(app.queryClient)
    expect(box()).toBeNull()
    expect(browser.requestPermission).not.toHaveBeenCalled()
  })

  it('"Şimdi değil" kutuyu küçültür; "Aç" yeniden başlatır (kalıcı anahtar yok)', async () => {
    await openWith()
    await until(() => view() === 'prompt', 'önerme')
    await userClick('[data-testid="push-later"]')
    await until(() => view() === 'snoozed', 'küçük hâl')
    expect(browser.requestPermission).not.toHaveBeenCalled()
    expect(document.activeElement).toBe($('[data-testid="push-open"]'))
  })
})

describe('izin + kayıt akışı', () => {
  it('Bildirimleri aç: izin → register → subscribe → POST targets (CSRF, anahtarlar, user_agent) → "açıldı"', async () => {
    const app = await openWith()
    await until(() => view() === 'prompt', 'önerme')
    await userClick('[data-testid="push-enable"]')
    await until(() => view() === 'enabled', 'açıldı')
    await idle(app.queryClient)
    expect(browser.requestPermission).toHaveBeenCalledTimes(1)
    expect(browser.register).toHaveBeenCalledWith('/sw.js', { scope: '/' })
    expect(browser.subscribe).toHaveBeenCalledTimes(1)
    const posts = sent('POST', '/v1/notifications/targets')
    expect(posts).toHaveLength(1)
    expect(posts[0]!.headers.get('X-Requested-With')).toBeTruthy()
    expect(posts[0]!.body).toMatchObject({
      endpoint: ENDPOINT,
      keys: { p256dh: 'p256dh-b64url', auth: 'auth-b64url' },
    })
    expect(browser.showNotification).toHaveBeenCalledTimes(1)
    expect(notifications.state.registered).toEqual([ENDPOINT])
  })

  it('izin penceresinde "izin ver" denmezse (default döner) kutu geri açılır; kayıt yok', async () => {
    await openWith({ answer: 'default' })
    await until(() => view() === 'prompt', 'önerme')
    await userClick('[data-testid="push-enable"]')
    await until(() => !!browser.requestPermission.mock.calls.length, 'izin istendi')
    await until(
      () => view() === 'prompt' && !$('[data-testid="push-pending-note"]'),
      'kutu geri açıldı',
    )
    expect(sent('POST', '/v1/notifications/targets')).toHaveLength(0)
  })

  it('izin reddedilirse "Engellendi"; kayıt yok', async () => {
    await openWith({ answer: 'denied' })
    await until(() => view() === 'prompt', 'önerme')
    await userClick('[data-testid="push-enable"]')
    await until(() => view() === 'blocked', 'engellendi')
    expect(sent('POST', '/v1/notifications/targets')).toHaveLength(0)
  })

  it.each([
    [409, 'notifications.subscription_owner_conflict'],
    [422, 'notifications.target_invalid'],
  ] as const)(
    '%s %s → yerel abonelik geri alınır; kutuda i18n hatası; kör yeniden deneme yok',
    async (status, code) => {
      notifications.state.registerFault = { status, code }
      const app = await openWith()
      await until(() => view() === 'prompt', 'önerme')
      await userClick('[data-testid="push-enable"]')
      await until(() => $('[data-testid="push-error"]'), 'hata')
      await idle(app.queryClient)
      expect(browser.unsubscribe).toHaveBeenCalledTimes(1)
      expect(browser.subscribed).toBe(false)
      expect(sent('POST', '/v1/notifications/targets')).toHaveLength(1)
      expect($('[data-testid="push-error"]')!.textContent).not.toMatch(/sunucu|x$/)
      expect(view()).toBe('prompt')
      // "Yeniden dene" kullanıcı eylemidir: yeni kayıt (hata temizlendi) ve başarı.
      await userClick('[data-testid="push-enable"]')
      await until(() => view() === 'enabled', 'açıldı')
      expect(sent('POST', '/v1/notifications/targets')).toHaveLength(2)
    },
  )

  it('subscribe reddedilirse genel hata; kayıt isteği yok', async () => {
    await openWith()
    browser.subscribeFails = true
    await until(() => view() === 'prompt', 'önerme')
    await userClick('[data-testid="push-enable"]')
    await until(() => $('[data-testid="push-error"]'), 'hata')
    expect(sent('POST', '/v1/notifications/targets')).toHaveLength(0)
  })
})

describe('çıkış', () => {
  async function enabledApp() {
    const app = await openWith()
    await until(() => view() === 'prompt', 'önerme')
    await userClick('[data-testid="push-enable"]')
    await until(() => view() === 'enabled', 'açıldı')
    expect(browser.unsubscribe).not.toHaveBeenCalled()
    return app
  }

  it('çıkışta bellekteki target_id DELETE edilir (gövdesiz) + yerel unsubscribe (E-14-79)', async () => {
    const app = await enabledApp()
    await app.session.logout()
    await until(() => browser.unsubscribe.mock.calls.length === 1, 'yerel unsubscribe')
    expect(browser.subscribed).toBe(false)
    const [del] = sent('DELETE', '/v1/notifications/targets/t1')
    expect(del).toBeDefined()
    expect(del!.body).toBeUndefined()
    expect(del!.headers.get('X-Requested-With')).toBeTruthy()
    expect(sent('DELETE', '/v1/notifications/targets/t1')).toHaveLength(1)
    expect(notifications.state.unregistered).toEqual(['t1'])
  })

  it('sunucuda hedef zaten yoksa (404) çıkış yine tamamlanır, hata gösterilmez', async () => {
    const app = await enabledApp()
    notifications.state.targets.clear()
    await app.session.logout()
    await until(() => browser.unsubscribe.mock.calls.length === 1, 'yerel unsubscribe')
    expect(sent('DELETE', '/v1/notifications/targets/t1')).toHaveLength(1)
    expect(notifications.state.unregistered).toEqual([])
    expect(app.session.status).toBe('anonymous')
  })
})
