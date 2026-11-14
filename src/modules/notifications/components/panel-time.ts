/**
 * Panel zaman kuralları (14 `mekanizma.md` §5; E-14-29, E-14-53…55). Gün sınırı kurulum saat
 * diliminde (`instanceProfile.timezone`) hesaplanır; dilim bilinmiyor ya da geçersizse tarayıcı
 * dilimi kullanılır (uydurma dilim yok). Saf işlevler: saat dışarıdan verilir.
 */
import { notificationText } from '../messages'

export type PanelGroup = 'today' | 'yesterday' | 'older'

const MINUTE_MS = 60_000
const HOUR_MS = 3_600_000

/** Geçersiz dilim (RangeError) → `undefined` (tarayıcı dilimi). */
function safeZone(timeZone: string | undefined): string | undefined {
  if (!timeZone) return undefined
  try {
    new Intl.DateTimeFormat('tr-TR', { timeZone })
    return timeZone
  } catch {
    return undefined
  }
}

interface Parts {
  year: string
  month: string
  day: string
  hour: string
  minute: string
}

function partsOf(date: Date, timeZone: string | undefined): Parts {
  const found = new Intl.DateTimeFormat('tr-TR', {
    timeZone: safeZone(timeZone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: string) => found.find((p) => p.type === type)?.value ?? ''
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  }
}

const dayKey = (p: Parts) => `${p.year}-${p.month}-${p.day}`

/** Kurulum gününe göre grup: bugün / dün / daha eski (gelecek zaman bugüne sayılır). */
export function groupOf(createdAt: string, now: Date, timeZone: string | undefined): PanelGroup {
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) return 'older'
  const today = dayKey(partsOf(now, timeZone))
  const day = dayKey(partsOf(created, timeZone))
  if (day >= today) return 'today'
  // Dün: takvim günü aritmetiği (UTC öğlen: saat kayması günü değiştirmez).
  const [y, m, d] = today.split('-').map(Number)
  const yesterday = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, (d ?? 1) - 1, 12))
  const yKey = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`
  return day === yKey ? 'yesterday' : 'older'
}

/** Satır zamanı: bugün göreli ("şimdi", "N dk", "N sa"); dün "SS:dd"; eski "GG.AA SS:dd". */
export function rowTime(
  createdAt: string,
  now: Date,
  timeZone: string | undefined,
  group: PanelGroup,
): string {
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) return ''
  if (group === 'today') {
    const diff = now.getTime() - created.getTime()
    if (diff < MINUTE_MS) return notificationText('notifications.rows.time.now')
    if (diff < HOUR_MS) {
      return notificationText('notifications.rows.time.minutes', {
        n: Math.floor(diff / MINUTE_MS),
      })
    }
    return notificationText('notifications.rows.time.hours', { n: Math.floor(diff / HOUR_MS) })
  }
  const p = partsOf(created, timeZone)
  const clock = `${p.hour}:${p.minute}`
  return group === 'yesterday' ? clock : `${p.day}.${p.month} ${clock}`
}

/** Ham `title`: tam tarih-saat "GG.AA.YYYY SS:dd". */
export function fullTime(createdAt: string, timeZone: string | undefined): string {
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) return ''
  const p = partsOf(created, timeZone)
  return `${p.day}.${p.month}.${p.year} ${p.hour}:${p.minute}`
}
