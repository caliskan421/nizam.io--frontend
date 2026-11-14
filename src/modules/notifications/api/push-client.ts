/**
 * Web Push tarayıcı istemcisi (14 `mekanizma.md` §3.3; E-14-61…79; P58). Yalnız tarayıcı API'leri
 * ve portal uçlarına GİDEN gövdenin kurulumu; UI durum makinesi `components/push/` altındadır.
 *
 *  - `sw.js` kaydı YALNIZ kullanıcı "Bildirimleri aç"a bastıktan sonra (`subscribeBrowser`).
 *    Sayfa açılışında hiçbir şey kaydedilmez, izin istenmez.
 *  - `applicationServerKey` = `pushPublicKey.public_key` (base64url) → `Uint8Array`.
 *  - Kayıt gövdesi `PushSubscription.toJSON()`'dan (`keys` base64url, olduğu gibi) kurulur;
 *    `user_agent` 200 karakterle kırpılır (uzunluk sınırı belgede yok; dogrulama.md #13).
 *  - `target_id` yerelde SAKLANMAZ (depolama listesi dışı, K2): çıkışta `unregisterPushTarget`
 *    kullanılmaz; yalnız yerel `unsubscribe()` (en iyi çaba), sunucu hedefi sonraki teslimde
 *    404/410 ile düşürür (K12). Paylaşılan tarayıcıda önceki hesabın bildirimi gelmesin, yeni
 *    hesabın kaydı 409 almasın diye (E-14-79).
 */
import { authSession } from '@/shared/http'
import type { AuthSession } from '@/shared/session/auth-session'

import type { RegisterTargetRequest } from '../model/types'

/** Service worker dosyası ve kapsamı (kök). */
export const SERVICE_WORKER_URL = '/sw.js'
export const SERVICE_WORKER_SCOPE = '/'
export const USER_AGENT_LIMIT = 200

export type PushSupport = 'supported' | 'unsupported' | 'ios_install'
export type PermissionState = NotificationPermission | 'unsupported'

/** Tarayıcıya özgü başarısızlık (UI genel metne çevirir; ayrıntı kullanıcıya gösterilmez). */
export class PushClientError extends Error {
  readonly reason: 'key_invalid' | 'subscribe_failed' | 'unsupported'
  constructor(reason: PushClientError['reason']) {
    super(reason)
    this.name = 'PushClientError'
    this.reason = reason
  }
}

function hasApis(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    'Notification' in window
  )
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true
  // iPadOS 13+ masaüstü kimliği bildirir; dokunmatik Mac yoktur.
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

function isStandalone(): boolean {
  const legacy = (navigator as { standalone?: boolean }).standalone === true
  const media =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches
  return legacy || media
}

/**
 * Destek (E-14-70/71): iOS/iPadOS'ta ana ekrandan açılmamışsa Push API yoktur → ana ekran yönergesi.
 * Tespit `display-mode: standalone` ve `PushManager` varlığıyla; UA tek başına yetmez (Varsayım).
 */
export function pushSupport(): PushSupport {
  if (hasApis()) return 'supported'
  if (typeof navigator !== 'undefined' && isIos() && !isStandalone()) return 'ios_install'
  return 'unsupported'
}

export function notificationPermission(): PermissionState {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}

/** İzin penceresi; YALNIZ kullanıcı eyleminden çağrılır (E-14-61). Eski callback imzası desteklenmez. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  return Notification.requestPermission()
}

/** base64url (dolgulu ya da dolgusuz) → bayt dizisi; geçersizse `null`. */
export function decodeApplicationServerKey(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(value)) return null
  const base64 = value.replace(/=+$/, '').replaceAll('-', '+').replaceAll('_', '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  try {
    const binary = atob(padded)
    const bytes = new Uint8Array(new ArrayBuffer(binary.length))
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return bytes.length > 0 ? bytes : null
  } catch {
    return null
  }
}

function encodeBase64Url(buffer: ArrayBuffer | null): string | null {
  if (!buffer) return null
  let binary = ''
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

/** `registerPushTarget` gövdesi; anahtarlar yoksa `null` (kayıt gönderilmez). */
export function registrationBody(subscription: PushSubscription): RegisterTargetRequest | null {
  const json = subscription.toJSON()
  const endpoint = json.endpoint ?? subscription.endpoint
  const p256dh = json.keys?.p256dh ?? encodeBase64Url(subscription.getKey('p256dh'))
  const auth = json.keys?.auth ?? encodeBase64Url(subscription.getKey('auth'))
  if (!endpoint || !p256dh || !auth) return null
  const body: RegisterTargetRequest = { endpoint, keys: { p256dh, auth } }
  const userAgent =
    typeof navigator === 'undefined' ? '' : navigator.userAgent.slice(0, USER_AGENT_LIMIT)
  if (userAgent !== '') body.user_agent = userAgent
  return body
}

async function currentRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (!hasApis()) return undefined
  return navigator.serviceWorker.getRegistration(SERVICE_WORKER_SCOPE)
}

/** Var olan abonelik (kayıt yoksa `null`); `register` ÇAĞIRMAZ — açılışta yan etki yok. */
export async function existingSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await currentRegistration()
    return (await registration?.pushManager.getSubscription()) ?? null
  } catch {
    return null
  }
}

export interface BrowserSubscription {
  registration: ServiceWorkerRegistration
  subscription: PushSubscription
}

/** (b) `sw.js` kaydı → `ready` → `pushManager.subscribe`; izin zaten `granted` olmalıdır. */
export async function subscribeBrowser(publicKey: string): Promise<BrowserSubscription> {
  if (!hasApis()) throw new PushClientError('unsupported')
  const key = decodeApplicationServerKey(publicKey)
  if (!key) throw new PushClientError('key_invalid')
  try {
    await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: SERVICE_WORKER_SCOPE })
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    })
    return { registration, subscription }
  } catch {
    throw new PushClientError('subscribe_failed')
  }
}

/** Yerel deneme bildirimi (E-14-67): sunucudan gönderilmez; başarısızlık sessizdir. */
export async function showLocalTest(
  registration: ServiceWorkerRegistration,
  title: string,
  body: string,
): Promise<void> {
  try {
    await registration.showNotification(title, { body })
  } catch {
    // İşletim sistemi bildirimleri kapalı olabilir; kayıt başarısı etkilenmez.
  }
}

/** Yerel aboneliği en iyi çabayla iptal eder; hata yutulur (çıkışı engellemez, ortak-kurallar §8). */
export async function unsubscribeLocal(): Promise<void> {
  try {
    const subscription = await existingSubscription()
    await subscription?.unsubscribe()
  } catch {
    // Sunucu hedefi sonraki teslimde 404/410 ile düşer (K12).
  }
}

/**
 * Çıkış kancası (E-14-79): oturum nesli değişince (yerel çıkış, kardeş sekme çıkışı, doğrulanamayan
 * çıkış) ya da oturum başka hesaba geçince yerel abonelik iptal edilir. `shared/session` çıkış
 * akışına dokunmadan `authSession.subscribe` ile bağlanır (`bindSessionQueries` kalıbı).
 */
export function installPushSignOutHook(
  session: Pick<AuthSession, 'generation' | 'snapshot' | 'subscribe'> = authSession,
  unsubscribe: () => Promise<void> = unsubscribeLocal,
): () => void {
  let generation = session.generation
  let lastAccount = session.snapshot.accountId
  return session.subscribe((snapshot) => {
    const ended = session.generation !== generation
    const switched =
      snapshot.accountId !== null && lastAccount !== null && snapshot.accountId !== lastAccount
    generation = session.generation
    if (snapshot.accountId !== null) lastAccount = snapshot.accountId
    if (ended || switched) void unsubscribe()
  })
}

let hookInstalled = false
/** Uygulama başına bir kez (modül içe aktarılınca); testler `installPushSignOutHook`'u doğrudan çağırır. */
export function ensurePushSignOutHook(): void {
  if (hookInstalled) return
  hookInstalled = true
  installPushSignOutHook()
}
