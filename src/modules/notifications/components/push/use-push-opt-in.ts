/**
 * Web Push önerme kutusunun durumu (P58; E-14-59…79): tarayıcı olguları (`use-push-facts`),
 * "Bildirimleri aç" akışı (`use-push-enable`) ve görünüm kararı (`push-view`) burada birleşir.
 * Yazma `useProtectedMutation` ile (`useRegisterPushTarget`); `Idempotency-Key` uçta yok.
 */
import { computed, onScopeDispose, ref } from 'vue'

import { authSession } from '@/shared/http'

import { usePushPublicKey } from '../../api/queries'
import { notificationText } from '../../messages'
import { notificationCapabilities } from '../../model/capabilities'
import { ensurePushSignOutHook } from '../../model/push-signout'
import { pushView } from './push-view'
import { usePushEnable } from './use-push-enable'
import { usePushFacts } from './use-push-facts'

ensurePushSignOutHook()

/**
 * "Şimdi değil" yalnız oturum belleğindedir (E-14-72; kalıcı anahtar yok, K2 listesi genişlemez).
 * Panel kapanıp açılınca (bileşen yeniden kurulur) korunur, sayfa yenilenince kaybolur; hesap
 * kimliğine bağlıdır (başka hesapta geçersiz).
 */
const snoozedAccount = ref<string | null>(null)

export function resetPushSnooze(): void {
  snoozedAccount.value = null
}

export function usePushOptIn(emit: { enabled: () => void; dismissed: () => void }) {
  const key = usePushPublicKey()
  const accountId = authSession.snapshot.accountId
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
      snoozed: accountId !== null && snoozedAccount.value === accountId,
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

  /** "Şimdi değil" (E-14-62): oturum belleği; kalıcı 14 gün F8 adayı. */
  function later(): void {
    snoozedAccount.value = accountId
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
