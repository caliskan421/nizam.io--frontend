import { i18n } from '@/shared/i18n'
import { meetingDay } from '../../model/list'

/** Takvim günlerini UTC üzerinde karşılaştırır; yaz saati geçişi hafta sınırını değiştirmez. */
export function dayLabel(day: string, now: Date, timezone: string): string {
  const today = meetingDay(now, timezone)
  if (day === today) return i18n.global.t('meetings.list.today')
  const date = new Date(`${day}T00:00:00Z`)
  const current = new Date(`${today}T00:00:00Z`)
  const monday = new Date(current)
  monday.setUTCDate(current.getUTCDate() - ((current.getUTCDay() + 6) % 7))
  const distance = Math.floor((date.getTime() - monday.getTime()) / 86400000)
  if (distance >= 0 && distance < 7) return i18n.global.t('meetings.list.thisWeek')
  if (distance >= 7 && distance < 14) return i18n.global.t('meetings.list.nextWeek')
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(date)
}
