/**
 * "Son yükleme" göreli gün (E-06-14, E-01-38): iki an kurulum saat diliminin takvim gününe
 * indirilir (`instanceProfile.timezone`, istemcinin dilimi değil; WORK-K37) ve gün farkı alınır.
 * Gelecekteki an (saat kayması) 0'a kenetlenir; çözümlenemeyen değer `null` (metin uydurulmaz).
 */
const FALLBACK_TIME_ZONE = 'Europe/Istanbul'

function dayNumber(at: Date, timeZone: string): number {
  const format = (zone: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(at)
  let text: string
  try {
    text = format(timeZone)
  } catch {
    text = format(FALLBACK_TIME_ZONE)
  }
  const [year = 0, month = 1, day = 1] = text.split('-').map(Number)
  return Date.UTC(year, month - 1, day) / 86_400_000
}

export function daysSince(
  iso: string | null,
  now: Date,
  timeZone: string | null | undefined,
): number | null {
  if (iso === null) return null
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return null
  const zone = timeZone ?? FALLBACK_TIME_ZONE
  return Math.max(0, dayNumber(now, zone) - dayNumber(at, zone))
}
