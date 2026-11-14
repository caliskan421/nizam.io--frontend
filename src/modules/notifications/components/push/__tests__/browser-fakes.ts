// Web Push tarayıcı sahteleri: `Notification`, `PushManager`, `navigator.serviceWorker`.
// Gerçek tarayıcı davranışı `e2e` dumanında ölçülür; burada akışın tarayıcıyla sözleşmesi sınanır.
import { vi } from 'vitest'

/** 65 baytlık sıkıştırılmamış P-256 noktası biçiminde (0x04 + 64 bayt) base64url VAPID anahtarı. */
export const PUBLIC_KEY_BYTES = Uint8Array.from({ length: 65 }, (_, i) =>
  i === 0 ? 4 : 255 - i * 3,
)
export const PUBLIC_KEY = btoa(String.fromCharCode(...PUBLIC_KEY_BYTES))
  .replaceAll('+', '-')
  .replaceAll('/', '_')
  .replace(/=+$/, '')
export const ENDPOINT = 'https://push.example.test/send/abc123'

export class FakeSubscription {
  endpoint = ENDPOINT
  unsubscribe = vi.fn(() => Promise.resolve(true))
  toJSON() {
    return { endpoint: this.endpoint, keys: { p256dh: 'p256dh-b64url', auth: 'auth-b64url' } }
  }
  getKey(): ArrayBuffer | null {
    return null
  }
}

export interface BrowserOptions {
  permission?: NotificationPermission
  /** `Notification.requestPermission()` sonucu. */
  answer?: NotificationPermission
  /** Önceden var olan abonelik. */
  existing?: boolean
  /** `pushManager.subscribe` reddeder. */
  subscribeFails?: boolean
  /** `pushManager.subscribe` bu söz çözülene kadar bekler. */
  subscribeGate?: Promise<void>
  /** Hiç Push API yok (eski tarayıcı). */
  noApis?: boolean
  userAgent?: string
  platform?: string
  maxTouchPoints?: number
  standalone?: boolean
}

export interface BrowserFake {
  subscription: FakeSubscription
  registration: {
    pushManager: { getSubscription: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> }
    showNotification: ReturnType<typeof vi.fn>
  }
  register: ReturnType<typeof vi.fn>
  getRegistration: ReturnType<typeof vi.fn>
  requestPermission: ReturnType<typeof vi.fn>
  setPermission(value: NotificationPermission): void
  /** Çözülene kadar `requestPermission` bekler (izin penceresi açıkken). */
  hold(): (value: NotificationPermission) => void
  restore(): void
}

const own = (target: object, key: string) => Object.getOwnPropertyDescriptor(target, key)
const defineNav = (key: string, value: unknown) =>
  Object.defineProperty(navigator, key, { configurable: true, get: () => value })

/** `navigator` / `window` alanlarını sahteler; eski tanımlayıcıları `restore` için döndürür. */
function fakeEnvironment(options: BrowserOptions) {
  const saved = {
    serviceWorker: own(navigator, 'serviceWorker'),
    userAgent: own(navigator, 'userAgent'),
    platform: own(navigator, 'platform'),
    maxTouchPoints: own(navigator, 'maxTouchPoints'),
    standalone: own(navigator, 'standalone'),
    matchMedia: own(window, 'matchMedia'),
  }
  if (options.userAgent) defineNav('userAgent', options.userAgent)
  if (options.platform) defineNav('platform', options.platform)
  if (options.maxTouchPoints !== undefined) defineNav('maxTouchPoints', options.maxTouchPoints)
  if (options.standalone) {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({ matches: query.includes('standalone'), media: query }),
    })
  }
  return () => {
    vi.unstubAllGlobals()
    for (const [key, descriptor] of Object.entries(saved)) {
      const target = key === 'matchMedia' ? window : navigator
      if (descriptor) Object.defineProperty(target, key, descriptor)
      else delete (target as unknown as Record<string, unknown>)[key]
    }
  }
}

function fakeRegistration(
  options: BrowserOptions,
  subscription: FakeSubscription,
  read: () => FakeSubscription | null,
  write: (value: FakeSubscription) => void,
) {
  return {
    pushManager: {
      getSubscription: vi.fn(() => Promise.resolve(read())),
      subscribe: vi.fn(async () => {
        await options.subscribeGate
        if (options.subscribeFails) throw new DOMException('push service', 'AbortError')
        write(subscription)
        return subscription
      }),
    },
    showNotification: vi.fn(() => Promise.resolve()),
  }
}

export function installBrowser(options: BrowserOptions = {}): BrowserFake {
  const subscription = new FakeSubscription()
  let current: FakeSubscription | null = options.existing ? subscription : null
  let registered = options.existing === true
  let permission: NotificationPermission = options.permission ?? 'default'
  let release: ((value: NotificationPermission) => void) | null = null
  let held = false

  const registration = fakeRegistration(
    options,
    subscription,
    () => current,
    (v) => (current = v),
  )
  const register = vi.fn(() => {
    registered = true
    return Promise.resolve(registration)
  })
  const getRegistration = vi.fn(() => Promise.resolve(registered ? registration : undefined))
  const requestPermission = vi.fn(
    () =>
      new Promise<NotificationPermission>((resolve) => {
        const done = (value: NotificationPermission) => {
          permission = value
          resolve(value)
        }
        if (held) release = done
        else done(options.answer ?? 'granted')
      }),
  )

  const restore = fakeEnvironment(options)
  if (options.noApis) {
    delete (globalThis as { Notification?: unknown }).Notification
    delete (globalThis as { PushManager?: unknown }).PushManager
  } else {
    defineNav('serviceWorker', { register, ready: Promise.resolve(registration), getRegistration })
    vi.stubGlobal('PushManager', class PushManager {})
    vi.stubGlobal('Notification', {
      get permission() {
        return permission
      },
      requestPermission,
    })
  }

  return {
    subscription,
    registration,
    register,
    getRegistration,
    requestPermission,
    setPermission: (value) => {
      permission = value
    },
    hold: () => {
      held = true
      return (value) => release?.(value)
    },
    restore,
  }
}
