/**
 * Takvim günü aritmetiği (`YYYY-MM-DD`; saat dilimsiz). Gantt tarihleri biçimsiz `string`
 * gelir (backend.md §6 "Tarih biçimi" varsayımı: `YYYY-MM-DD`, boş dizge = yok); burada yalnız
 * bu biçim işlenir, bozuk değer `null` olur ve çağıran en dar davranışa (işlem yok) düşer.
 */
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/

/** Günü UTC gün sayısına çevirir; geçersiz takvim günü (ör. 2026-02-30) `null`. */
export function dayNumber(iso: string): number | null {
  const match = ISO_DAY.exec(iso)
  if (!match) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const ms = Date.UTC(year, month - 1, day)
  const back = new Date(ms)
  const same =
    back.getUTCFullYear() === year && back.getUTCMonth() === month - 1 && back.getUTCDate() === day
  return same ? ms / 86_400_000 : null
}

/** `to - from` gün; biri geçersizse `null`. */
export function dayDiff(from: string, to: string): number | null {
  const a = dayNumber(from)
  const b = dayNumber(to)
  return a === null || b === null ? null : b - a
}

/** Çubuğun planlanan bitişi: `planned_end_on` boşsa `end_on` (boş dizge = yok). */
export function plannedEnd(task: { planned_end_on: string; end_on: string }): string {
  return task.planned_end_on === '' ? task.end_on : task.planned_end_on
}
