/**
 * Görev listesi tarih biçimleri. Sözleşme günleri `YYYY-MM-DD` (takvim günü); "bugün"
 * Europe/Istanbul takvim günüdür (03 `backend.md` §4). Saat dilimi dönüşümü yalnız "bugün"
 * için yapılır; gün dizeleri olduğu gibi okunur (tarayıcı saat dilimi kaymaz).
 */
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/
const DAY_MS = 86_400_000

const MONTHS_SHORT = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
] as const

const istanbulDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Istanbul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Europe/Istanbul takvim günü (`YYYY-MM-DD`). */
export function istanbulToday(now: Date = new Date()): string {
  return istanbulDay.format(now)
}

function parts(day: string): [number, number, number] | null {
  const match = ISO_DAY.exec(day)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

/** `GG.AA.YYYY` (E-03-24); biçimsiz değer olduğu gibi döner. */
export function formatDay(day: string): string {
  const p = parts(day)
  if (!p) return day
  return `${String(p[2]).padStart(2, '0')}.${String(p[1]).padStart(2, '0')}.${p[0]}`
}

/** `GG Aaa` (E-03-26 talep etiketi, ör. "15 Kas"). */
export function formatShortDay(day: string): string {
  const p = parts(day)
  if (!p) return day
  return `${String(p[2]).padStart(2, '0')} ${MONTHS_SHORT[p[1] - 1] ?? ''}`.trim()
}

/** `to − from` takvim günü farkı; biçimsiz girdide `null`. */
export function daysBetween(from: string, to: string): number | null {
  const a = parts(from)
  const b = parts(to)
  if (!a || !b) return null
  return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / DAY_MS)
}
