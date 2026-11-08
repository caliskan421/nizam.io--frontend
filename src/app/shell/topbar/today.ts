/**
 * Bugünün tarihi (E-00-36; yalnız ana sayfa üst çubuğu). 00-ortak README kabulü:
 * `Intl.DateTimeFormat('tr-TR', { timeZone: instanceProfile.timezone })` — kurulum günü
 * gösterilir (görev `start_on`/`end_on` günleriyle tutarlı), istemcinin saat dilimi değil.
 * Biçim "G Ay YYYY, Gün" (ör. "21 Ekim 2026, Çarşamba").
 */
import { computed, onScopeDispose, shallowRef } from 'vue'

import { useInstanceStore } from '@/shared/instance/store'

const PARTS = ['day', 'month', 'year', 'weekday'] as const

/** Kurulum saat dilimindeki gün; dilim geçersizse `null` (tarih gösterilmez, uydurma yok). */
export function formatToday(now: Date, timeZone: string): string | null {
  let parts: Intl.DateTimeFormatPart[]
  try {
    parts = new Intl.DateTimeFormat('tr-TR', {
      timeZone,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    }).formatToParts(now)
  } catch {
    return null
  }
  const value = (type: (typeof PARTS)[number]) => parts.find((p) => p.type === type)?.value
  const [day, month, year, weekday] = PARTS.map(value)
  if (!day || !month || !year || !weekday) return null
  return `${day} ${month} ${year}, ${weekday}`
}

export const TODAY_REFRESH_MS = 60_000

/** Kurulum profilindeki saat dilimiyle bugünün metni; gün dönümünde dakikalık tazelenir. */
export function useToday(clock: () => Date = () => new Date()) {
  const instance = useInstanceStore()
  const now = shallowRef(clock())
  const timer = setInterval(() => {
    now.value = clock()
  }, TODAY_REFRESH_MS)
  onScopeDispose(() => clearInterval(timer))
  return computed(() => {
    const timeZone = instance.profile?.timezone
    return timeZone ? formatToday(now.value, timeZone) : null
  })
}
