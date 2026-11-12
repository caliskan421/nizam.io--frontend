/**
 * Tarih-saat biçimleri (E-12-30/45): `deleted_at` (RFC 3339, UTC) kurulum saat diliminde
 * "gg.aa.yyyy" + "SS:DD"; "bugün" = kurulum saat diliminde aynı takvim günü. Boş ya da geçersiz
 * değer `null` (çağıran "—" yazar).
 */
const LOCALE = 'tr-TR'

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

const cache = new Map<string, Intl.DateTimeFormat>()
function formatter(timezone: string, key: string, options: Intl.DateTimeFormatOptions) {
  const id = `${timezone}|${key}`
  let found = cache.get(id)
  if (!found) {
    found = new Intl.DateTimeFormat(LOCALE, { timeZone: timezone, ...options })
    cache.set(id, found)
  }
  return found
}

/** Takvim günü anahtarı `YYYY-MM-DD` (sözlük sırası = zaman sırası). */
export function dayKey(iso: string | Date | null | undefined, timezone: string): string | null {
  const date = iso instanceof Date ? iso : toDate(iso)
  if (!date) return null
  const parts = formatter(timezone, 'day', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const at = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${at('year')}-${at('month')}-${at('day')}`
}

/** Takvim günü anahtarından `days` gün önce (UTC aritmetiği; saat dilimi sapması yok). */
export function shiftDay(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const shifted = new Date(Date.UTC(y!, (m ?? 1) - 1, (d ?? 1) - days))
  return shifted.toISOString().slice(0, 10)
}

export function formatDate(iso: string | null | undefined, timezone: string): string | null {
  const date = toDate(iso)
  if (!date) return null
  return formatter(timezone, 'date', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatClock(iso: string | null | undefined, timezone: string): string | null {
  const date = toDate(iso)
  if (!date) return null
  return formatter(timezone, 'clock', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}

/** "21 Ekim 2026, 13:42" (title / ipucu). */
export function formatLong(iso: string | null | undefined, timezone: string): string | null {
  const date = toDate(iso)
  if (!date) return null
  return formatter(timezone, 'long', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}

/** "24 Ekim 10:00" (toplantı alt satırı, E-12-28). */
export function formatMeetingWhen(iso: string | null | undefined, timezone: string): string {
  const date = toDate(iso)
  if (!date) return ''
  return formatter(timezone, 'when', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}

export function isToday(iso: string | null | undefined, now: Date, timezone: string): boolean {
  const day = dayKey(iso, timezone)
  return day !== null && day === dayKey(now, timezone)
}
