/**
 * "Bildirimleri aç" akışı (E-14-61…68, 78). İzin YALNIZ bu kullanıcı eyleminde istenir:
 *  (a) izin `default` → izin penceresi (karartma + not) → `requestPermission`; `default` dönerse
 *      kutu geri açılır ("sonra sor", E-14-66); `denied` → Engellendi kartı;
 *  (b) `sw.js` kaydı → `ready` → `subscribe` (`granted` ama abonelik yok → doğrudan buradan);
 *  (c) `registerPushTarget` → başarıda yerel deneme bildirimi + adım 3 kartı. Hata: yerel abonelik
 *      geri alınır, kutuda i18n iletisi (sunucu `message` gösterilmez), 409'da kör yeniden deneme yok.
 * Geç sonuç (KESİN 26a): sökülmüş kutu ek UI/bildirim üretmez; sunucuya bildirilmemiş yerel
 * abonelik geri alınır (sunucusuz abonelik "sessiz açık" sayılmasın).
 */
import { ref, type Ref } from 'vue'

import {
  requestNotificationPermission,
  registrationBody,
  showLocalTest,
  subscribeBrowser,
  unsubscribeLocal,
} from '../../api/push-client'
import { useRegisterPushTarget } from '../../api/writes'
import { notificationText } from '../../messages'
import type { BrowserSubscription, PermissionState } from '../../model/push-browser'
import type { PushPublicKeyInfo } from '../../model/types'
import { registrationResult, type PushErrorKey } from './push-errors'

export interface PushEnableContext {
  key: () => PushPublicKeyInfo | undefined
  permission: Ref<PermissionState>
  subscribed: Ref<boolean | null>
  isDisposed: () => boolean
  onEnabled: () => void
}

/** (a) → `granted` ise `true`; reddedildiyse/karar yoksa `false` (durum işlenmiş olur). */
async function resolvePermission(
  ctx: PushEnableContext,
  flags: { requesting: Ref<boolean>; deniedByUser: Ref<boolean> },
): Promise<boolean> {
  const known = ctx.permission.value
  let state: NotificationPermission = known === 'unsupported' ? 'denied' : known
  if (state === 'default') {
    flags.requesting.value = true
    try {
      state = await requestNotificationPermission()
    } finally {
      if (!ctx.isDisposed()) flags.requesting.value = false
    }
  }
  if (ctx.isDisposed()) return false
  ctx.permission.value = state
  if (state === 'denied') flags.deniedByUser.value = true
  return state === 'granted'
}

export function usePushEnable(ctx: PushEnableContext) {
  const register = useRegisterPushTarget()
  const justEnabled = ref(false)
  const deniedByUser = ref(false)
  const requesting = ref(false)
  const busy = ref(false)
  const error = ref<PushErrorKey | null>(null)
  const flags = { requesting, deniedByUser }

  /** Başarısızlıkta yerel abonelik geri alınır; sökülmüşse UI'ya dokunulmaz. */
  async function fail(key: PushErrorKey | null): Promise<void> {
    await unsubscribeLocal()
    if (ctx.isDisposed()) return
    ctx.subscribed.value = false
    if (key !== null) error.value = key
  }

  async function finishRegistration(browser: BrowserSubscription): Promise<void> {
    const body = registrationBody(browser.subscription)
    if (!body) return fail('generic')
    const result = registrationResult(await register.submit(body))
    if (result !== 'success') return fail(result === 'owner_disposed' ? null : result)
    if (ctx.isDisposed()) return
    void showLocalTest(
      browser.registration,
      'RoketPortal',
      notificationText('notifications.push.enabledTest'),
    )
    ctx.subscribed.value = true
    justEnabled.value = true
    ctx.onEnabled()
  }

  async function subscribeAndRegister(publicKey: string): Promise<void> {
    let browser: BrowserSubscription
    try {
      browser = await subscribeBrowser(publicKey)
    } catch {
      // Tarayıcı ayrıntısı kullanıcıya gösterilmez; genel hata + "Yeniden dene".
      if (!ctx.isDisposed()) error.value = 'generic'
      return
    }
    if (ctx.isDisposed()) return fail(null)
    await finishRegistration(browser)
  }

  /** "Bildirimleri aç" (E-14-61). */
  async function enable(): Promise<void> {
    const info = ctx.key()
    if (busy.value || !info?.enabled) return
    busy.value = true
    error.value = null
    deniedByUser.value = false
    try {
      if (await resolvePermission(ctx, flags)) await subscribeAndRegister(info.public_key)
    } finally {
      busy.value = false
    }
  }

  return { justEnabled, deniedByUser, requesting, busy, error, enable }
}
