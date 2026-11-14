/**
 * Panel saati (E-14-29, E-14-53…55): açıkken dakikalık tazelenir (gün dönümünde gruplar
 * güncellensin), kapalıyken durur. Saat dilimi kurulum profilinden (yoksa tarayıcı dilimi).
 */
import { computed, onScopeDispose, shallowRef, watch } from 'vue'

import { useInstanceStore } from '@/shared/instance/store'

export const PANEL_CLOCK_MS = 60_000

export function usePanelClock(open: () => boolean) {
  const instance = useInstanceStore()
  const now = shallowRef(new Date())
  let timer: ReturnType<typeof setInterval> | null = null
  const stop = () => {
    if (timer !== null) clearInterval(timer)
    timer = null
  }
  watch(
    open,
    (isOpen) => {
      stop()
      if (!isOpen) return
      now.value = new Date()
      timer = setInterval(() => (now.value = new Date()), PANEL_CLOCK_MS)
    },
    { immediate: true },
  )
  onScopeDispose(stop)
  return { now, timeZone: computed(() => instance.profile?.timezone) }
}
