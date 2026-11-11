import { meetingDay } from '../../model/list'

/** Göreli gün, kurulum saat diliminin takvim günü üzerinden bulunur. */
export function dateLabel(
  value: string,
  timezone: string,
  now: Date,
  todayText: string,
  tomorrowText: string,
) {
  const date = new Date(value)
  const today = meetingDay(now, timezone)
  const tomorrow = new Date(`${today}T00:00:00Z`)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const tomorrowDay = tomorrow.toISOString().slice(0, 10)
  const day = meetingDay(date, timezone)
  const relative =
    day === today ? `${todayText} · ` : day === tomorrowDay ? `${tomorrowText} · ` : ''
  const dayText = new Intl.DateTimeFormat('tr-TR', {
    timeZone: timezone,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  }).format(date)
  const time = new Intl.DateTimeFormat('tr-TR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
  return `${relative}${dayText} · ${time}`
}
