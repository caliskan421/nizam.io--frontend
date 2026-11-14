import { afterEach, describe, expect, it } from 'vitest'

import {
  ENDPOINT,
  FakeSubscription,
  installBrowser,
  PUBLIC_KEY,
  PUBLIC_KEY_BYTES,
  type BrowserFake,
} from '../components/push/__tests__/browser-fakes'
import {
  decodeApplicationServerKey,
  existingSubscription,
  notificationPermission,
  pushSupport,
  registrationBody,
  subscribeBrowser,
  unsubscribeLocal,
} from '../api/push-client'
import { USER_AGENT_LIMIT } from '../model/push-browser'

let fake: BrowserFake | null = null
afterEach(() => {
  fake?.restore()
  fake = null
})

describe('applicationServerKey dönüşümü (base64url → Uint8Array)', () => {
  it('base64url alfabesi ve dolgusuz giriş çözülür', () => {
    // 0xfb 0xff 0xbe → "-_--" (url) / "+/++" yerine; dolgulu ve dolgusuz aynı baytlar.
    expect([...decodeApplicationServerKey('-_--')!]).toEqual([0xfb, 0xff, 0xbe])
    expect([...decodeApplicationServerKey('AQID')!]).toEqual([1, 2, 3])
    expect([...decodeApplicationServerKey('AQI')!]).toEqual([1, 2])
    expect([...decodeApplicationServerKey('AQI=')!]).toEqual([1, 2])
  })

  it('gerçek boyutlu anahtar (65 bayt VAPID) bayt dizisi verir', () => {
    const bytes = decodeApplicationServerKey(PUBLIC_KEY)!
    expect(bytes.length).toBe(65)
    expect([...bytes]).toEqual([...PUBLIC_KEY_BYTES])
  })

  it('geçersiz / boş giriş null', () => {
    for (const bad of ['', 'a b', 'AQ+/', '***', 'A']) {
      expect(decodeApplicationServerKey(bad), bad).toBeNull()
    }
  })
})

describe('destek ve izin okuma (açılışta yan etkisiz)', () => {
  it('API var → supported; izin okunur', () => {
    fake = installBrowser({ permission: 'granted' })
    expect(pushSupport()).toBe('supported')
    expect(notificationPermission()).toBe('granted')
    expect(fake.register).not.toHaveBeenCalled()
    expect(fake.requestPermission).not.toHaveBeenCalled()
  })

  it('API yok → unsupported; izin "unsupported"', () => {
    fake = installBrowser({ noApis: true })
    expect(pushSupport()).toBe('unsupported')
    expect(notificationPermission()).toBe('unsupported')
  })

  it('iPhone ana ekran dışı, Push API yok → ios_install', () => {
    fake = installBrowser({
      noApis: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) Safari/605.1',
    })
    expect(pushSupport()).toBe('ios_install')
  })

  it('iPadOS (MacIntel + dokunmatik) ana ekran dışı → ios_install', () => {
    fake = installBrowser({ noApis: true, platform: 'MacIntel', maxTouchPoints: 5 })
    expect(pushSupport()).toBe('ios_install')
  })

  it('iOS ana ekrandan (standalone) ama Push API yoksa → unsupported', () => {
    fake = installBrowser({
      noApis: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
      standalone: true,
    })
    expect(pushSupport()).toBe('unsupported')
  })

  it('iOS ana ekranda Push API varsa → supported', () => {
    fake = installBrowser({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
      standalone: true,
    })
    expect(pushSupport()).toBe('supported')
  })
})

describe('kayıt gövdesi (registerPushTarget)', () => {
  it('endpoint + toJSON().keys olduğu gibi; user_agent 200 karakterle kırpılır', () => {
    fake = installBrowser({ userAgent: 'U'.repeat(500) })
    const body = registrationBody(new FakeSubscription() as unknown as PushSubscription)!
    expect(body).toEqual({
      endpoint: ENDPOINT,
      keys: { p256dh: 'p256dh-b64url', auth: 'auth-b64url' },
      user_agent: 'U'.repeat(USER_AGENT_LIMIT),
    })
  })

  it('toJSON anahtarsızsa getKey base64url kodlanır; hiçbiri yoksa null', () => {
    fake = installBrowser()
    const bytes = new Uint8Array([0xfb, 0xff, 0xbe]).buffer
    const viaKeys = {
      endpoint: ENDPOINT,
      toJSON: () => ({ endpoint: ENDPOINT }),
      getKey: () => bytes,
    } as unknown as PushSubscription
    expect(registrationBody(viaKeys)?.keys).toEqual({ p256dh: '-_--', auth: '-_--' })
    const none = {
      endpoint: ENDPOINT,
      toJSON: () => ({ endpoint: ENDPOINT }),
      getKey: () => null,
    } as unknown as PushSubscription
    expect(registrationBody(none)).toBeNull()
  })
})

describe('abonelik', () => {
  it('existingSubscription kayıt yaratmaz: kayıt yoksa null', async () => {
    fake = installBrowser()
    expect(await existingSubscription()).toBeNull()
    expect(fake.register).not.toHaveBeenCalled()
  })

  it('subscribeBrowser: sw.js kök kapsamda kaydedilir, subscribe userVisibleOnly + bayt anahtarla', async () => {
    fake = installBrowser()
    const { subscription } = await subscribeBrowser(PUBLIC_KEY)
    expect(fake.register).toHaveBeenCalledWith('/sw.js', { scope: '/' })
    const arg = fake.registration.pushManager.subscribe.mock.calls[0]![0] as {
      userVisibleOnly: boolean
      applicationServerKey: Uint8Array
    }
    expect(arg.userVisibleOnly).toBe(true)
    expect([...arg.applicationServerKey]).toEqual([...PUBLIC_KEY_BYTES])
    expect(subscription).toBe(fake.subscription)
  })

  it('geçersiz anahtar: kayıt bile yapılmaz; subscribe reddi PushClientError', async () => {
    fake = installBrowser()
    await expect(subscribeBrowser('***')).rejects.toMatchObject({ reason: 'key_invalid' })
    expect(fake.register).not.toHaveBeenCalled()
    fake.restore()
    fake = installBrowser({ subscribeFails: true })
    await expect(subscribeBrowser(PUBLIC_KEY)).rejects.toMatchObject({ reason: 'subscribe_failed' })
  })

  it('unsubscribeLocal: varsa iptal eder; hata yutulur', async () => {
    fake = installBrowser({ existing: true })
    await unsubscribeLocal()
    expect(fake.subscription.unsubscribe).toHaveBeenCalledTimes(1)
    fake.subscription.unsubscribe.mockRejectedValueOnce(new Error('x'))
    await expect(unsubscribeLocal()).resolves.toBeUndefined()
  })

  it('unsubscribeLocal: API yokken sessizce biter', async () => {
    fake = installBrowser({ noApis: true })
    await expect(unsubscribeLocal()).resolves.toBeUndefined()
  })
})
