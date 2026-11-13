/**
 * Yaklaşan toplantılar (E-K1-34, E-Ü1-28): `listMeetings` `from` = bugün (kurulum saat dilimi;
 * P29); K1'de `department_id` = seçili birim, Ü1'de program geneli (görünür olanlar). Tek sayfa
 * yeter (en yakın beş gösterilir); sayı sunucuda sayfadan fazlaysa "+" ipucu. Anahtar `meetings`
 * önekindedir (toplantı yazmaları geçersizler).
 */
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { useMeetings } from '@/modules/meetings/public'

import { upcomingViews } from '../../model/role/meetings'
import { useToday } from './use-today'

export const MEETING_PAGE = 50

export function useUpcomingMeetings(
  department: MaybeRefOrGetter<string | null>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const { today, timeZone } = useToday()
  const meetings = useMeetings(() => {
    const id = toValue(department)
    return { from: today.value, limit: MEETING_PAGE, ...(id === null ? {} : { department_id: id }) }
  }, enabled)
  const views = computed(() => upcomingViews(meetings.items.value, timeZone.value, today.value))
  /** Yüklenen sayfadaki toplam; sunucuda daha fazlası olabilir. */
  const total = computed(() => meetings.items.value.length)
  return { query: meetings.query, views, total, more: computed(() => !meetings.complete.value) }
}
