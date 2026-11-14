/**
 * Web Push kutusunun görünüm kararı (14 `mekanizma.md` §3.3 durum makinesi; E-14-60, 69…73).
 * Saf işlev: girdiler tarayıcı/oturum gerçekleridir, çıktı yalnız hangi yüzün çizileceği.
 */
import type { PermissionState, PushSupport } from '../../model/push-browser'

export type PushView =
  'hidden' | 'prompt' | 'snoozed' | 'blocked' | 'ios' | 'unsupported' | 'enabled'

export interface PushViewInput {
  /** `pushPublicKey.enabled`; bilinmiyor/yükleniyor/hata → `null` (kutu çizilmez). */
  keyEnabled: boolean | null
  support: PushSupport
  permission: PermissionState
  /** `PushManager.getSubscription()`; henüz okunmadıysa `null`. */
  subscribed: boolean | null
  /** "Şimdi değil" (oturum belleği). */
  snoozed: boolean
  /** Az önce abone olundu (adım 3 kartı). */
  justEnabled: boolean
  /** Kullanıcı kendisi "Bildirimleri aç"a basıp `denied` aldı (açılışta hatırlatma yok). */
  deniedByUser: boolean
  /** Rol/mercek karar vermez; yine de yetenek kapısından geçer (`notificationCapabilities`). */
  allowed: boolean
}

export function pushView(input: PushViewInput): PushView {
  if (!input.allowed) return 'hidden'
  if (input.justEnabled) return 'enabled'
  // E-14-60: `enabled=false` hata değildir; kutu hiç çizilmez (destek yokluğu satırı da dahil).
  if (input.keyEnabled !== true) return 'hidden'
  if (input.support === 'ios_install') return 'ios'
  if (input.support === 'unsupported') return 'unsupported'
  if (input.permission === 'denied') return input.deniedByUser ? 'blocked' : 'hidden'
  if (input.subscribed === null || input.subscribed) return 'hidden'
  return input.snoozed ? 'snoozed' : 'prompt'
}
