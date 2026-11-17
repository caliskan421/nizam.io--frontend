// Web Push kutusu: GERÇEK API istemcisi + MSW + gerçek Pinia/TanStack Query; tarayıcı API'leri
// `__tests__/browser-fakes.ts` sahtesiyle. Akış: kutu → izin penceresi → tarayıcı izni → abonelik
// → kayıt isteği gövdesi → yerel deneme bildirimi (E-14-59…79).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  errorEnvelope,
  http,
  json,
  ORIGIN,
  resetAll,
  sent,
  server,
  settleQueries,
  signIn,
} from '../../__tests__/harness'
import { preferences } from '@/shared/preferences'

import PushOptInCard from '../PushOptInCard.vue'
import { installBrowser, PUBLIC_KEY, type BrowserFake } from './__tests__/browser-fakes'
import { resetPushSnooze } from './use-push-opt-in'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())

let browser: BrowserFake
let client: QueryClient
let wrapper: VueWrapper | null = null
let bodies: unknown[] = []

beforeEach(() => {
  signIn()
  resetPushSnooze()
  bodies = []
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  browser?.restore()
  resetAll()
  document.body.innerHTML = ''
})

const keyHandler = (enabled = true, publicKey = PUBLIC_KEY) =>
  http.get(`${ORIGIN}/v1/notifications/vapid-public-key`, () =>
    json({ enabled, public_key: enabled ? publicKey : '' }),
  )
const registerOk = () =>
  http.post(`${ORIGIN}/v1/notifications/targets`, async ({ request }) => {
    bodies.push(await request.json())
    return json({ target_id: 't-1', status: 'active' })
  })
const registerFails = (code: string, status: number) =>
  http.post(`${ORIGIN}/v1/notifications/targets`, () => errorEnvelope(code, status))

async function mountCard(handlers = [keyHandler(), registerOk()]) {
  server.use(...handlers)
  setActivePinia(createPinia())
  client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const host = document.createElement('div')
  host.setAttribute('role', 'dialog')
  document.body.appendChild(host)
  wrapper = mount(PushOptInCard, {
    attachTo: host,
    global: { plugins: [[VueQueryPlugin, { queryClient: client }]] },
  })
  await settleQueries(client)
  await flushPromises()
  return wrapper
}

const card = () => document.querySelector<HTMLElement>('[data-testid="push-opt-in"]')
const view = () => card()?.dataset.view
const click = async (testid: string) => {
  document.querySelector<HTMLElement>(`[data-testid="${testid}"]`)!.click()
  await flushPromises()
}
const pendingNote = () => document.querySelector('[data-testid="push-pending-note"]')

describe('görünürlük (E-14-60)', () => {
  it('enabled=false → hiçbir şey çizilmez, hiçbir tarayıcı çağrısı yok', async () => {
    browser = installBrowser()
    await mountCard([keyHandler(false)])
    expect(card()).toBeNull()
    expect(browser.register).not.toHaveBeenCalled()
    expect(browser.requestPermission).not.toHaveBeenCalled()
  })

  it('açılışta izin istenmez, sw.js kaydedilmez; kutu önermeyi gösterir', async () => {
    browser = installBrowser()
    await mountCard()
    expect(view()).toBe('prompt')
    expect(card()!.textContent).toContain('Portal kapalıyken de haber verelim mi?')
    expect(card()!.textContent).toContain('Tarih talepleri ve onaylar bu tarayıcıya')
    expect(card()!.textContent).toContain('Sohbet mesajları da gelir')
    expect(browser.requestPermission).not.toHaveBeenCalled()
    expect(browser.register).not.toHaveBeenCalled()
    expect(sent('POST', '/v1/notifications/targets')).toHaveLength(0)
  })

  it('abonelik zaten varsa çizilmez (sessiz açık)', async () => {
    browser = installBrowser({ permission: 'granted', existing: true })
    await mountCard()
    expect(card()).toBeNull()
  })

  it('izin denied iken açılışta hatırlatma yok', async () => {
    browser = installBrowser({ permission: 'denied' })
    await mountCard()
    expect(card()).toBeNull()
  })

  it('tarayıcı Web Push desteklemiyor → tek satır', async () => {
    browser = installBrowser({ noApis: true })
    await mountCard()
    expect(view()).toBe('unsupported')
    expect(card()!.textContent).toContain('Bu tarayıcıda kullanılamıyor')
    expect(card()!.querySelector('button')).toBeNull()
  })

  it('iPhone ana ekran dışı → "Önce portalı ana ekrana ekle" + üç adım', async () => {
    browser = installBrowser({
      noApis: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
    })
    await mountCard()
    expect(view()).toBe('ios')
    expect(card()!.textContent).toContain('Önce portalı ana ekrana ekle')
    expect(card()!.querySelectorAll('[data-testid="push-steps"] li')).toHaveLength(3)
    expect(card()!.querySelector('button')).toBeNull()
  })
})

describe('"Bildirimleri aç" akışı (E-14-61, 65, 67, 68)', () => {
  it('izin penceresi (karartma + not) → izin → abonelik → kayıt gövdesi → deneme bildirimi → adım 3 kartı', async () => {
    browser = installBrowser({ userAgent: 'TestUA/1.0' })
    const release = browser.hold()
    const w = await mountCard()
    await click('push-enable')

    // Tarayıcı penceresi açıkken portal notu gösterilir; sayfa açılışında değil, bu eylemde.
    expect(browser.requestPermission).toHaveBeenCalledTimes(1)
    expect(pendingNote()?.textContent?.trim()).toBe(
      'Tarayıcının izin penceresinde “İzin ver”e bas.',
    )
    expect(document.querySelector('[role="dialog"][aria-modal="true"]')).not.toBeNull()
    expect(browser.register).not.toHaveBeenCalled()

    release('granted')
    await settleQueries(client)
    await flushPromises()

    expect(pendingNote()).toBeNull()
    expect(browser.register).toHaveBeenCalledWith('/sw.js', { scope: '/' })
    expect(bodies).toEqual([
      {
        endpoint: 'https://push.example.test/send/abc123',
        keys: { p256dh: 'p256dh-b64url', auth: 'auth-b64url' },
        user_agent: 'TestUA/1.0',
      },
    ])
    const request = sent('POST', '/v1/notifications/targets')[0]!
    expect(request.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(request.headers.get('Idempotency-Key')).toBeNull()
    expect(browser.registration.showNotification).toHaveBeenCalledWith('RoketPortal', {
      body: 'Bildirimler bu tarayıcıda açık.',
    })
    expect(view()).toBe('enabled')
    expect(card()!.textContent).toContain('Bildirimler bu tarayıcıda açık')
    expect(w.emitted('enabled')).toHaveLength(1)
  })

  it('"Tamam" kartı kapatır; odak gövdeye düşmez, sahip pencereye döner', async () => {
    browser = installBrowser()
    await mountCard()
    await click('push-enable')
    await settleQueries(client)
    await flushPromises()
    expect(view()).toBe('enabled')
    await click('push-ok')
    expect(card()).toBeNull()
    expect(document.activeElement).toBe(document.querySelector('[role="dialog"]'))
    expect(document.activeElement).not.toBe(document.body)
  })

  it('izin granted ama abonelik yok → izin sorulmaz, doğrudan abonelik', async () => {
    browser = installBrowser({ permission: 'granted' })
    await mountCard()
    expect(view()).toBe('prompt')
    await click('push-enable')
    await settleQueries(client)
    await flushPromises()
    expect(browser.requestPermission).not.toHaveBeenCalled()
    expect(pendingNote()).toBeNull()
    expect(bodies).toHaveLength(1)
    expect(view()).toBe('enabled')
  })

  it('karar verilmeden kapatma (default) → kutu geri açılır, kayıt yok (E-14-66)', async () => {
    browser = installBrowser({ answer: 'default' })
    await mountCard()
    await click('push-enable')
    await flushPromises()
    expect(view()).toBe('prompt')
    expect(browser.register).not.toHaveBeenCalled()
    expect(sent('POST', '/v1/notifications/targets')).toHaveLength(0)
  })

  it('izin reddi → Engellendi kartı üç adımla; kayıt yok, olay yok (E-14-69)', async () => {
    browser = installBrowser({ answer: 'denied' })
    const w = await mountCard()
    await click('push-enable')
    await flushPromises()
    expect(view()).toBe('blocked')
    expect(card()!.textContent).toContain('Bu tarayıcıda bildirimler engelli')
    expect(card()!.textContent).toContain(
      'Portal tekrar soramaz; açmak için tarayıcı ayarı gerekir.',
    )
    expect(card()!.querySelectorAll('[data-testid="push-steps"] li')).toHaveLength(3)
    expect(browser.register).not.toHaveBeenCalled()
    expect(w.emitted('enabled')).toBeUndefined()
  })

  it('izin penceresi Esc ile kapanır, odak "Bildirimleri aç"a döner; tarayıcı kararı sürer', async () => {
    browser = installBrowser()
    const release = browser.hold()
    await mountCard()
    const trigger = document.querySelector<HTMLElement>('[data-testid="push-enable"]')!
    trigger.focus()
    trigger.click()
    await flushPromises()
    await vi.waitFor(() => expect(pendingNote()).not.toBeNull())
    const modal = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]')!
    modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(pendingNote()).toBeNull()
    expect(document.activeElement).toBe(trigger)
    release('granted')
    await settleQueries(client)
    await flushPromises()
    expect(view()).toBe('enabled')
  })

  it('✕ düğmesi izin penceresini kapatır', async () => {
    browser = installBrowser()
    browser.hold()
    await mountCard()
    await click('push-enable')
    await vi.waitFor(() => expect(pendingNote()).not.toBeNull())
    document.querySelector<HTMLElement>('.t-modal__head button')!.click()
    await flushPromises()
    expect(pendingNote()).toBeNull()
    expect(view()).toBe('prompt')
  })

  it('çift tık tek istek: uçuşta ikinci "aç" yok sayılır', async () => {
    browser = installBrowser({ permission: 'granted' })
    await mountCard()
    const button = document.querySelector<HTMLElement>('[data-testid="push-enable"]')!
    button.click()
    button.click()
    await settleQueries(client)
    await flushPromises()
    expect(sent('POST', '/v1/notifications/targets')).toHaveLength(1)
    expect(browser.registration.pushManager.subscribe).toHaveBeenCalledTimes(1)
  })
})

describe('hatalar (E-14-78): sunucu iletisi gösterilmez; yerel abonelik geri alınır', () => {
  const cases: [string, number, string][] = [
    ['notifications.target_invalid', 422, 'Bu tarayıcı bildirim servisi desteklenmiyor'],
    [
      'notifications.subscription_owner_conflict',
      409,
      'Bu tarayıcı başka bir hesaba bağlı; o hesaptan çıkış yapılmış olmalı',
    ],
    ['notifications.input_invalid', 422, 'Bildirim kaydı yapılamadı.'],
    ['platform.body_invalid', 422, 'Bildirim kaydı yapılamadı.'],
    ['platform.internal', 500, 'Bildirimler açılamadı.'],
  ]
  it.each(cases)('%s (%i)', async (code, status, text) => {
    browser = installBrowser({ permission: 'granted' })
    const w = await mountCard([keyHandler(), registerFails(code, status)])
    await click('push-enable')
    await settleQueries(client)
    await flushPromises()
    const error = document.querySelector('[data-testid="push-error"]')!
    expect(error.textContent?.trim()).toBe(text)
    expect(card()!.textContent).not.toContain('sunucu iletisi')
    expect(browser.subscription.unsubscribe).toHaveBeenCalledTimes(1)
    expect(view()).toBe('prompt')
    expect(card()!.textContent).toContain('Yeniden dene')
    expect(w.emitted('enabled')).toBeUndefined()
    expect(browser.registration.showNotification).not.toHaveBeenCalled()
    // Kör yeniden deneme yok: istek tek.
    expect(sent('POST', '/v1/notifications/targets')).toHaveLength(1)
  })

  it('409 sonrası "Yeniden dene" kullanıcı eylemidir ve yeni abonelikle başarılı olabilir', async () => {
    browser = installBrowser({ permission: 'granted' })
    await mountCard([keyHandler(), registerFails('notifications.subscription_owner_conflict', 409)])
    await click('push-enable')
    await settleQueries(client)
    await flushPromises()
    server.use(registerOk())
    await click('push-enable')
    await settleQueries(client)
    await flushPromises()
    expect(view()).toBe('enabled')
    expect(document.querySelector('[data-testid="push-error"]')).toBeNull()
  })

  it('tarayıcı abonelik reddi (push servisi) → genel hata, kayıt isteği yok', async () => {
    browser = installBrowser({ permission: 'granted', subscribeFails: true })
    await mountCard()
    await click('push-enable')
    await flushPromises()
    expect(document.querySelector('[data-testid="push-error"]')!.textContent).toContain(
      'Bildirimler açılamadı.',
    )
    expect(sent('POST', '/v1/notifications/targets')).toHaveLength(0)
  })

  it('geçersiz VAPID anahtarı → genel hata, sw.js kaydı yok', async () => {
    browser = installBrowser({ permission: 'granted' })
    await mountCard([keyHandler(true, '***'), registerOk()])
    await click('push-enable')
    await flushPromises()
    expect(document.querySelector('[data-testid="push-error"]')).not.toBeNull()
    expect(browser.register).not.toHaveBeenCalled()
  })
})

describe('"Şimdi değil" (E-14-62, 72, 73): 14 gün kalıcı', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })
  it('kutu küçük hâle geçer, odak "Aç"a gider, olay yayılır; yeniden kurulumda da sürer', async () => {
    browser = installBrowser()
    const w = await mountCard()
    await click('push-later')
    expect(w.emitted('dismissed')).toHaveLength(1)
    expect(view()).toBe('snoozed')
    expect(card()!.textContent).toContain('Tarayıcı bildirimleri kapalı')
    expect(card()!.textContent).toContain('Yalnız portal açıkken haber alırsın.')
    expect(document.activeElement).toBe(document.querySelector('[data-testid="push-open"]'))
    expect(browser.requestPermission).not.toHaveBeenCalled()

    w.unmount()
    wrapper = null
    await mountCard()
    expect(view()).toBe('snoozed')
  })

  it('push.snoozeUntil = şimdi + 14 gün (UTC ISO) yazılır; başka anahtar yazılmaz', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-15T09:00:00.000Z') })
    browser = installBrowser()
    await mountCard()
    const writes = vi.spyOn(Storage.prototype, 'setItem')
    await click('push-later')
    expect(preferences.read('push.snoozeUntil')).toBe('2026-11-29T09:00:00.000Z')
    expect(writes.mock.calls).toEqual([
      ['nizamio.pref.push.snoozeUntil', '2026-11-29T09:00:00.000Z'],
    ])
  })

  it('14 gün dolmadan kutu gizli (küçük hâl), süre dolunca yeniden önerilir', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-15T09:00:00.000Z') })
    browser = installBrowser()
    const w = await mountCard()
    await click('push-later')
    expect(view()).toBe('snoozed')

    vi.setSystemTime(new Date('2026-11-29T08:59:59.000Z'))
    w.unmount()
    wrapper = null
    const second = await mountCard()
    expect(view()).toBe('snoozed')

    vi.setSystemTime(new Date('2026-11-29T09:00:00.000Z'))
    second.unmount()
    wrapper = null
    await mountCard()
    expect(view()).toBe('prompt')
    expect(browser.requestPermission).not.toHaveBeenCalled()
  })

  it('bozuk saklı değer yok sayılır (kutu önerir)', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('yarın')
    browser = installBrowser()
    await mountCard()
    expect(view()).toBe('prompt')
  })

  it('"Aç" = "Bildirimleri aç": akışı başlatır', async () => {
    browser = installBrowser({ permission: 'granted' })
    await mountCard()
    await click('push-later')
    await click('push-open')
    await settleQueries(client)
    await flushPromises()
    expect(view()).toBe('enabled')
  })
})

describe('sökülme (KESİN 26a)', () => {
  it('izin penceresi açıkken kutu sökülürse abonelik/kayıt başlamaz', async () => {
    browser = installBrowser()
    const release = browser.hold()
    const w = await mountCard()
    await click('push-enable')
    w.unmount()
    wrapper = null
    release('granted')
    await flushPromises()
    expect(browser.register).not.toHaveBeenCalled()
    expect(sent('POST', '/v1/notifications/targets')).toHaveLength(0)
  })

  it('abonelik oluştuktan sonra söküldüyse sunucusuz yerel abonelik geri alınır, istek gitmez', async () => {
    let finish!: () => void
    const gate = new Promise<void>((resolve) => {
      finish = resolve
    })
    browser = installBrowser({ permission: 'granted', subscribeGate: gate })
    const w = await mountCard()
    await click('push-enable')
    w.unmount()
    wrapper = null
    finish()
    await flushPromises()
    await vi.waitFor(() => expect(browser.subscription.unsubscribe).toHaveBeenCalledTimes(1))
    expect(sent('POST', '/v1/notifications/targets')).toHaveLength(0)
  })
})
