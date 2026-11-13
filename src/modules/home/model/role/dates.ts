/**
 * K1/Ü1 tarih yardımcıları (saf). Görev günleri `YYYY-MM-DD` (kurulum günü, WORK-K37); "bugün"
 * çağıranın verdiği kurulum saat dilimi gününden gelir (istemci saat dilimi değil).
 */
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/

function parts(day: string): [number, number, number] | null {
  const match = ISO_DAY.exec(day)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

/** Takvim günü numarası (UTC gün sayısı); biçimsizde `null`. */
function dayNumber(day: string): number | null {
  const p = parts(day)
  return p ? Date.UTC(p[0], p[1] - 1, p[2]) / 86_400_000 : null
}

/** `GG.AA` ("20.10"); biçimsiz değer olduğu gibi döner. */
export function formatDayShort(day: string): string {
  const p = parts(day)
  return p ? `${String(p[2]).padStart(2, '0')}.${String(p[1]).padStart(2, '0')}` : day
}

/** `to − from` takvim günü farkı; biçimsizde `null`. */
export function daysBetween(from: string, to: string): number | null {
  const a = dayNumber(from)
  const b = dayNumber(to)
  return a === null || b === null ? null : b - a
}

/** Kurulum saat dilimindeki takvim günü (`YYYY-MM-DD`); geçersiz dilimde Europe/Istanbul. */
export function dayIn(timeZone: string, now: Date): string {
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
    return format('Europe/Istanbul')
  }
}

/** `YYYY-MM` biçiminde ay anahtarı ve ay kaydırma. */
export function monthOf(day: string): string {
  return day.slice(0, 7)
}

export function shiftMonth(month: string, delta: number): string {
  const [year, mon] = month.split('-').map(Number) as [number, number]
  const index = year * 12 + (mon - 1) + delta
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}
