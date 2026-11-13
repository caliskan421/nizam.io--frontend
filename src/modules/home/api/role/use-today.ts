/**
 * Kurulum saat dilimindeki bugün (K1/Ü1 göreli tarihler ve `listMeetings.from`; E-K1-34).
 * Gün, bileşen yaşarken sabittir (gün dönümünde sayfa yenilenince değişir); istemcinin saat
 * dilimi değil `instanceProfile.timezone` kullanılır (WORK-K37).
 */
import { computed, shallowRef } from 'vue'

import { useInstanceStore } from '@/shared/instance/store'

import { dayIn } from '../../model/role/dates'

export function useToday(clock: () => Date = () => new Date()) {
  const instance = useInstanceStore()
  const now = shallowRef(clock())
  const timeZone = computed(() => instance.profile?.timezone ?? 'Europe/Istanbul')
  const today = computed(() => dayIn(timeZone.value, now.value))
  return { today, timeZone }
}
