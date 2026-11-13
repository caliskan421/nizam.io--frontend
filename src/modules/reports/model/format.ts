/**
 * Önizleme biçimleri (13 `ozellikler.md` §4): tarih `gg.aa.yyyy`, saat `SS:DD`; anlar kurulum
 * saat diliminde (`instance.profile.timezone`; yoksa Europe/Istanbul), takvim günleri
 * (`YYYY-AA-GG`) çevrilmeden. Geçersiz değer `null` döner — çağıran çizmez (uydurma yok, §4).
 */
export const FALLBACK_TIME_ZONE = 'Europe/Istanbul'

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/
const MONTH = /^(\d{4})-(\d{2})/

/** `YYYY-AA-GG` → `GG.AA.YYYY`. */
export function formatDay(day: string | null | undefined): string | null {
  const m = day ? DAY.exec(day) : null
  return m ? `${m[3]}.${m[2]}.${m[1]}` : null
}

/** `YYYY-AA-GG` → `GG.AA` (tablo hücresi). */
export function formatShortDay(day: string | null | undefined): string | null {
  const m = day ? DAY.exec(day) : null
  return m ? `${m[3]}.${m[2]}` : null
}

function parts(iso: string, timeZone: string, options: Intl.DateTimeFormatOptions) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  try {
    const map: Record<string, string> = {}
    for (const part of new Intl.DateTimeFormat('tr-TR', { timeZone, ...options }).formatToParts(
      date,
    )) {
      map[part.type] = part.value
    }
    return map
  } catch {
    return null
  }
}

/** Bir an → `GG.AA.YYYY` (kurulum saat diliminde). */
export function instantDate(iso: string, timeZone: string): string | null {
  const p = parts(iso, timeZone, { day: '2-digit', month: '2-digit', year: 'numeric' })
  return p ? `${p.day}.${p.month}.${p.year}` : null
}

/** Bir an → `SS:DD` (kurulum saat diliminde, 24 saat). */
export function instantTime(iso: string, timeZone: string): string | null {
  const p = parts(iso, timeZone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  return p ? `${p.hour}:${p.minute}` : null
}

/** Bir an → `GG.AA.YYYY SS:DD`. */
export function instantDateTime(iso: string, timeZone: string): string | null {
  const date = instantDate(iso, timeZone)
  const time = instantTime(iso, timeZone)
  return date && time ? `${date} ${time}` : null
}

/** `YYYY-AA` → kısa ay adı ("Eki"); yıl `year` ile birlikte ("Eki 2026") için `withYear`. */
export function monthLabel(month: string, withYear = false): string {
  const m = MONTH.exec(month)
  if (!m) return month
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1))
  const name = new Intl.DateTimeFormat('tr-TR', {
    month: withYear ? 'long' : 'short',
    timeZone: 'UTC',
  })
    .format(date)
    .replace('.', '')
  return withYear ? `${name} ${m[1]}` : name
}

/** `%49` (yuvarlanmış); payda 0 → `%0`. */
export function percent(part: number, whole: number): string {
  return `%${whole > 0 ? Math.round((part / whole) * 100) : 0}`
}

/** Yüzde sayısı (çubuk genişliği için 0–100 aralığına sıkıştırılmış). */
export function share(part: number, whole: number): number {
  return whole > 0 ? Math.min(100, Math.max(0, (part / whole) * 100)) : 0
}

/** Büyük harf (Türkçe İ/ı korunur). */
export function upper(text: string): string {
  return text.toLocaleUpperCase('tr-TR')
}

/** Yedek kısa ad: ilk iki sözcüğün baş harfleri (program kısa adı yoksa). */
export function initials(name: string): string {
  return upper(
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => [...word][0] ?? '')
      .join(''),
  )
}
