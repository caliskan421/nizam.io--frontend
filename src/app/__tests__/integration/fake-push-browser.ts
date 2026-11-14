// W160 · O3: Web Push tarayıcı sahtesi (`Notification`, `PushManager`, `navigator.serviceWorker`).
// Gerçek tarayıcı davranışı (izin penceresi, push servisi) e2e/üretim dumanında ölçülür; burada
// akışın tarayıcıyla sözleşmesi (izin yalnız kullanıcı eyleminde, `register` → `ready` → `subscribe`,
// kayıt gövdesi, çıkışta yerel `unsubscribe`) gerçek uygulama kökünde sınanır.
import { vi } from 'vitest'

export const ENDPOINT = 'https://push.example.test/send/abc123'

export interface PushBrowser {
  permission: NotificationPermission
  requestPermission: ReturnType<typeof vi.fn>
  register: ReturnType<typeof vi.fn>
  subscribe: ReturnType<typeof vi.fn>
  unsubscribe: ReturnType<typeof vi.fn>
  showNotification: ReturnType<typeof vi.fn>
  /** Sonraki `subscribe` çağrısı bu hatayla reddedilir. */
  subscribeFails: boolean
  /** Kayıtlı abonelik var mı (`getSubscription`). */
  subscribed: boolean
  restore: () => void
}

export interface PushOptions {
  permission?: NotificationPermission
  /** `requestPermission()` sonucu. */
  answer?: NotificationPermission
  subscribed?: boolean
}

function installGlobals(browser: PushBrowser, registration: object, registered: () => boolean) {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      register: browser.register,
      ready: Promise.resolve(registration),
      getRegistration: vi.fn(() => Promise.resolve(registered() ? registration : undefined)),
    },
  })
  vi.stubGlobal('PushManager', class PushManager {})
  vi.stubGlobal('Notification', {
    get permission() {
      return browser.permission
    },
    requestPermission: browser.requestPermission,
  })
}

export function installPushBrowser(options: PushOptions = {}): PushBrowser {
  const saved = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker')
  const browser = {
    permission: options.permission ?? 'default',
    subscribeFails: false,
    subscribed: options.subscribed ?? false,
  } as PushBrowser
  browser.unsubscribe = vi.fn(() => {
    browser.subscribed = false
    return Promise.resolve(true)
  })
  const subscription = {
    endpoint: ENDPOINT,
    toJSON: () => ({ endpoint: ENDPOINT, keys: { p256dh: 'p256dh-b64url', auth: 'auth-b64url' } }),
    getKey: () => null,
    unsubscribe: browser.unsubscribe,
  }
  browser.subscribe = vi.fn(() => {
    if (browser.subscribeFails)
      return Promise.reject(new DOMException('push service', 'AbortError'))
    browser.subscribed = true
    return Promise.resolve(subscription)
  })
  browser.showNotification = vi.fn(() => Promise.resolve())
  const registration = {
    pushManager: {
      getSubscription: vi.fn(() => Promise.resolve(browser.subscribed ? subscription : null)),
      subscribe: browser.subscribe,
    },
    showNotification: browser.showNotification,
  }
  let registered = browser.subscribed
  browser.register = vi.fn(() => {
    registered = true
    return Promise.resolve(registration)
  })
  browser.requestPermission = vi.fn(() => {
    browser.permission = options.answer ?? 'granted'
    return Promise.resolve(browser.permission)
  })
  installGlobals(browser, registration, () => registered)
  browser.restore = () => {
    vi.unstubAllGlobals()
    if (saved) Object.defineProperty(navigator, 'serviceWorker', saved)
    else delete (navigator as unknown as Record<string, unknown>).serviceWorker
  }
  return browser
}
