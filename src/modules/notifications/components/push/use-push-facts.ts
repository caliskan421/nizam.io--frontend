/**
 * Tarayıcı olguları (E-14-60): destek, `Notification.permission`, var olan abonelik. Okuma yan
 * etkisizdir: `sw.js` kaydedilmez, izin istenmez (sayfa açılışında ASLA). Pencere odağına
 * dönünce izin yeniden okunur (kullanıcı adres çubuğundan açmış olabilir; E-14-69 üçüncü adım).
 */
import { onMounted, onScopeDispose, ref } from 'vue'

import { existingSubscription, notificationPermission, pushSupport } from '../../api/push-client'

export function usePushFacts(isDisposed: () => boolean) {
  const support = pushSupport()
  const permission = ref(notificationPermission())
  const subscribed = ref<boolean | null>(support === 'supported' ? null : false)

  async function readSubscription(): Promise<void> {
    if (support !== 'supported') return
    const existing = await existingSubscription()
    if (!isDisposed()) subscribed.value = existing !== null
  }
  function refreshPermission(): void {
    permission.value = notificationPermission()
  }
  onMounted(() => {
    void readSubscription()
    window.addEventListener('focus', refreshPermission)
  })
  onScopeDispose(() => window.removeEventListener('focus', refreshPermission))

  return { support, permission, subscribed }
}
