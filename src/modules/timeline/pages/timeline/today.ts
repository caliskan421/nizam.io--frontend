/**
 * "Bugün" (E-03C-17, rapor-F1 §3 madde 4): kurulum profilinin saat dilimindeki takvim günü
 * (`YYYY-MM-DD`). Profil henüz yoksa Europe/Istanbul (work listesiyle aynı varsayılan). Gün
 * dönümünde dakikalık tazelenir; testte sahte saat (`vi.setSystemTime`) kullanılır.
 */
import { computed, onScopeDispose, shallowRef } from 'vue'

import { useInstanceStore } from '@/shared/instance/store'

export const FALLBACK_TIME_ZONE = 'Europe/Istanbul'
export const TODAY_REFRESH_MS = 60_000

/** `timeZone` takvim günü; geçersiz dilim adı varsayılana düşer. */
export function dayIn(now: Date, timeZone: string): string {
  const format = (zone: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now)
  try {
    return format(timeZone)
  } catch {
    return format(FALLBACK_TIME_ZONE)
  }
}

export function useTodayIso() {
  const instance = useInstanceStore()
  const now = shallowRef(new Date())
  const timer = setInterval(() => {
    now.value = new Date()
  }, TODAY_REFRESH_MS)
  onScopeDispose(() => clearInterval(timer))
  return computed(() => dayIn(now.value, instance.profile?.timezone ?? FALLBACK_TIME_ZONE))
}
