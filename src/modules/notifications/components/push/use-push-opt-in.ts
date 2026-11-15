/**
 * Web Push önerme kutusunun durumu (P58; E-14-59…79): tarayıcı olguları (`use-push-facts`),
 * "Bildirimleri aç" akışı (`use-push-enable`) ve görünüm kararı (`push-view`) burada birleşir.
 * Yazma `useProtectedMutation` ile (`useRegisterPushTarget`); `Idempotency-Key` uçta yok.
 */
import { computed, onScopeDispose, ref } from 'vue'

import { preferences } from '@/shared/preferences'

import { usePushPublicKey } from '../../api/queries'
import { notificationText } from '../../messages'
import { notificationCapabilities } from '../../model/capabilities'
import { ensurePushSignOutHook } from '../../model/push-signout'
import { pushView } from './push-view'
import { usePushEnable } from './use-push-enable'
import { usePushFacts } from './use-push-facts'

ensurePushSignOutHook()

/**
 * "Şimdi değil" 14 gün kalıcıdır (E-14-72; koordinatör kararı 2026-11-15): `push.snoozeUntil` (UTC ISO,
 * gizli değil — tema tercihi gibi K2 izinli anahtarı). Süre dolunca kutu yeniden önerilir. Tercih
 * tarayıcıya bağlıdır (hesaba değil); çıkışta silinmez. Bellekteki kopya (`snoozeUntil`) aynı
 * sayfadaki bileşenleri anında günceller; depolama erişilemezse oturum belleği olarak sürer.
 */
export const SNOOZE_DAYS = 14
const DAY_MS = 86_400_000

function readSnoozeUntil(): number | null {
  const raw = preferences.read('push.snoozeUntil')
  return raw === null ? null : Date.parse(raw)
}

const snoozeUntil = ref<number | null>(readSnoozeUntil())

export function resetPushSnooze(): void {
  preferences.remove('push.snoozeUntil')
  snoozeUntil.value = null
}

export function usePushOptIn(emit: { enabled: () => void; dismissed: () => void }) {
  const key = usePushPublicKey()
  // Başka sekme/örnek yazmış olabilir: kutu kurulurken depodan tazelenir.
  snoozeUntil.value = readSnoozeUntil()
  let disposed = false
  onScopeDispose(() => {
    disposed = true
  })
  const facts = usePushFacts(() => disposed)
  const flow = usePushEnable({
    key: () => key.data.value,
    permission: facts.permission,
    subscribed: facts.subscribed,
    isDisposed: () => disposed,
    onEnabled: emit.enabled,
  })

  const view = computed(() =>
    pushView({
      keyEnabled: key.data.value ? key.data.value.enabled : null,
      support: facts.support,
      permission: facts.permission.value,
      subscribed: facts.subscribed.value,
      snoozed: snoozeUntil.value !== null && Date.now() < snoozeUntil.value,
      justEnabled: flow.justEnabled.value,
      deniedByUser: flow.deniedByUser.value,
      allowed: notificationCapabilities().pushOptIn,
    }),
  )
  const errorText = computed(() =>
    flow.error.value === null
      ? null
      : notificationText(`notifications.push.errors.${flow.error.value}`),
  )

  /** "Şimdi değil" (E-14-62, E-14-72): 14 gün gizli. */
  function later(): void {
    const until = Date.now() + SNOOZE_DAYS * DAY_MS
    preferences.write('push.snoozeUntil', new Date(until).toISOString())
    snoozeUntil.value = until
    emit.dismissed()
  }
  /** Adım 3 kartı "Tamam": kart kapanır. */
  function acknowledge(): void {
    flow.justEnabled.value = false
  }
  /** İzin penceresi kapatma yalnız karartmayı kaldırır; tarayıcı kararı sürer. */
  function closePending(): void {
    flow.requesting.value = false
  }

  return {
    view,
    errorText,
    busy: flow.busy,
    requesting: flow.requesting,
    enable: flow.enable,
    later,
    acknowledge,
    closePending,
  }
}
