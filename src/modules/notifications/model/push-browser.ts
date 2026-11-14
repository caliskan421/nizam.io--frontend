/**
 * Web Push tarayıcı tipleri ve hatası (E-14-61…79). `api/push-client.ts` tip/sınıf bildirmez
 * (api/ katmanı yerel tip bildirimi yasağı): bunlar burada durur.
 */
export const SERVICE_WORKER_URL = '/sw.js'
export const SERVICE_WORKER_SCOPE = '/'
/** `user_agent` uzunluk sınırı belgede yok (dogrulama.md #13): istemci 200 karakterle kırpar. */
export const USER_AGENT_LIMIT = 200

export type PushSupport = 'supported' | 'unsupported' | 'ios_install'
export type PermissionState = NotificationPermission | 'unsupported'

/** Tarayıcıya özgü başarısızlık; UI genel metne çevirir, ayrıntı kullanıcıya gösterilmez. */
export class PushClientError extends Error {
  readonly reason: 'key_invalid' | 'subscribe_failed' | 'unsupported'
  constructor(reason: 'key_invalid' | 'subscribe_failed' | 'unsupported') {
    super(reason)
    this.name = 'PushClientError'
    this.reason = reason
  }
}

export interface BrowserSubscription {
  registration: ServiceWorkerRegistration
  subscription: PushSubscription
}
