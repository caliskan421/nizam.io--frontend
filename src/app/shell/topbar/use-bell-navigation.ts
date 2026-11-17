/**
 * Bildirim satırı gezinmesi: hedefin programı seçili programdan farklıysa ÖNCE program mevcut kapsam
 * altyapısıyla (`lifecycle.selectProgram` → kapsamlı sorgular iptal + düşer, K2) değiştirilir, SONRA
 * rotaya gidilir (aksi hâlde açık sayfanın kapsam dinleyicisi `?gorev=` gibi sorgu anahtarlarını
 * siler). Program kimliği yalnız `Notification.program_id`'den gelir (tahmin yok); kullanıcının
 * programları arasında değilse gezinme yapılmaz, panel açık kalır ve neden söylenir. Sökülmüş
 * kabuğun geç gezinmesi yoktur.
 */
import { getCurrentScope, nextTick, onScopeDispose } from 'vue'
import { useRouter } from 'vue-router'

import { notificationText, type NotificationTarget } from '@/modules/notifications/public'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'

import { injectScopeLifecycle } from '../side/scope-key'
import { bellTargetLocation } from './bell-target'

export function useBellNavigation(close: () => void) {
  const router = useRouter()
  const store = useScopeStore()
  const lifecycle = injectScopeLifecycle()
  const toast = useToast()
  let disposed = false
  if (getCurrentScope()) onScopeDispose(() => (disposed = true))

  return async function navigate(target: NotificationTarget): Promise<void> {
    const programId = target.programId
    const switching = programId !== null && programId !== store.programId
    if (switching && !lifecycle.programs.value.some((p) => p.programId === programId)) {
      toast.push({
        message: notificationText('notifications.target.programUnavailable'),
        tone: 'danger',
      })
      return
    }
    close()
    if (switching) {
      lifecycle.selectProgram(programId)
      await nextTick()
    }
    if (!disposed) await router.push(bellTargetLocation(target))
  }
}
