/**
 * Görev aralığı şeridi hesapları (E-03C-14…18; saf). Gün dizeleri `YYYY-MM-DD` (saat dilimsiz);
 * bozuk değer `null` döner ve çağıran o öğeyi çizmez (sahte konum yok, ortak-kurallar §4).
 */
import { dayDiff, dayNumber } from '../../model/dates'

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const DAY_MS = 86_400_000

export interface DayRange {
  start: string
  end: string
}

/** `GG Aaa` ("16 Haz"); bozuk gün olduğu gibi döner. */
export function shortDay(day: string): string {
  const n = dayNumber(day)
  if (n === null) return day
  const date = new Date(n * DAY_MS)
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
}

/** `16 Haz – 30 Eyl`. */
export function rangeText(range: DayRange): string {
  return `${shortDay(range.start)} – ${shortDay(range.end)}`
}

/** `YYYY-MM-DD` + gün. */
export function addDays(day: string, days: number): string | null {
  const n = dayNumber(day)
  if (n === null) return null
  return new Date((n + days) * DAY_MS).toISOString().slice(0, 10)
}

/** Aralığın gün sayısı (uçlar dahil); bozuk ya da ters aralık `null`. */
export function spanDays(range: DayRange): number | null {
  const diff = dayDiff(range.start, range.end)
  return diff === null || diff < 0 ? null : diff + 1
}

/** Günün aralık içindeki konumu (0–1, günün başı); aralık dışı ya da bozuk `null`. */
export function dayFraction(range: DayRange, day: string): number | null {
  const span = spanDays(range)
  const offset = dayDiff(range.start, day)
  if (span === null || offset === null || offset < 0 || offset >= span) return null
  return offset / span
}

/** Görünen aralığın şerit üzerindeki penceresi (yüzde); aralıkla kesişmiyorsa `null`. */
export function viewWindow(
  range: DayRange,
  view: DayRange,
): { left: number; width: number } | null {
  const span = spanDays(range)
  const from = dayDiff(range.start, view.start)
  const to = dayDiff(range.start, view.end)
  if (span === null || from === null || to === null || to < from) return null
  const left = Math.max(0, from)
  const right = Math.min(span, to + 1)
  if (right <= left) return null
  return { left: (left / span) * 100, width: ((right - left) / span) * 100 }
}

/** Şeritte `fraction` (0–1) konumundaki gün. */
export function dayAt(range: DayRange, fraction: number): string | null {
  const span = spanDays(range)
  if (span === null) return null
  const clamped = Math.min(Math.max(fraction, 0), 1)
  return addDays(range.start, Math.min(Math.floor(clamped * span), span - 1))
}

/** Histogram çubuğunun kapladığı gün sayısı (son çubuk kısmi olabilir). */
export function bucketDays(range: DayRange, index: number): number {
  const span = spanDays(range) ?? 0
  return Math.max(0, Math.min(7, span - index * 7))
}

/** Çubuk yükseklikleri (yüzde): boş hafta düşük iz, en yoğun hafta tam yükseklik. */
export function barHeights(counts: readonly number[]): number[] {
  const max = Math.max(0, ...counts)
  return counts.map((n) => (n === 0 || max === 0 ? 6 : 24 + (76 * n) / max))
}
