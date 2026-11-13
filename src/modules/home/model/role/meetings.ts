/**
 * Yaklaşan toplantı satırı (E-K1-34/35, E-Ü1-28/29): `Meeting` alanlarından türetilir; tarih ve
 * saat KURULUM saat diliminde. Kod rozetleri yok (BE-005): departman adı kısaltması (tam ad
 * ipucunda). "Canlı" göstergesi ve anlık toplantı çizilmez (P21).
 */
import type { Meeting } from '@/modules/meetings/public'

import { collator } from './common'

export interface MeetingView {
  meetingId: string
  /** Gün numarası ("21"). */
  day: string
  /** Üç harfli ay ("EKİ"). */
  month: string
  /** `HH:MM`. */
  time: string
  /** Kurulum gününde bugün mü. */
  today: boolean
  title: string
  /** Sahip önde; kısaltma + tam ad. */
  units: { id: string; short: string; name: string; owner: boolean }[]
  /** `summary.participant_count`; özet yoksa `null`. */
  participants: number | null
  membersIncluded: boolean
  /** Sıralama anahtarı (ms). */
  at: number
}

/** "Sistem koordinatörlüğü" → "SK"; tek sözcük → ilk üç harf (tr büyük harf). */
export function shortName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length <= 1) return (words[0] ?? '').slice(0, 3).toLocaleUpperCase('tr-TR')
  return words
    .slice(0, 3)
    .map((w) => w.charAt(0))
    .join('')
    .toLocaleUpperCase('tr-TR')
}

function formatIn(timeZone: string, at: Date, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat('tr-TR', { timeZone, ...options }).format(at)
  } catch {
    return new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', ...options }).format(at)
  }
}

export function meetingView(meeting: Meeting, timeZone: string, today: string): MeetingView {
  const at = new Date(meeting.meeting_date)
  const dayKey = formatIn(timeZone, at, { year: 'numeric', month: '2-digit', day: '2-digit' })
  const [dd, mm, yyyy] = dayKey.split('.')
  const units = meeting.departments
    .map((d) => ({
      id: d.department_id,
      short: shortName(d.department_name),
      name: d.department_name,
      owner: d.department_id === meeting.owner_department_id,
    }))
    .sort((a, b) => Number(b.owner) - Number(a.owner) || collator.compare(a.name, b.name))
  return {
    meetingId: meeting.meeting_id,
    day: String(Number(dd)),
    month: formatIn(timeZone, at, { month: 'short' }).replace('.', '').toLocaleUpperCase('tr-TR'),
    time: formatIn(timeZone, at, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
    today: `${yyyy}-${mm}-${dd}` === today,
    title: meeting.title,
    units,
    participants: meeting.summary?.participant_count ?? null,
    membersIncluded: meeting.members_included,
    at: at.getTime(),
  }
}

/** Yaklaşanlar: bugünden itibaren, en yakın önde, en çok `limit` (E-K1-34: ilk sayfa). */
export function upcomingViews(
  meetings: readonly Meeting[],
  timeZone: string,
  today: string,
  limit = 5,
): MeetingView[] {
  return meetings
    .map((m) => meetingView(m, timeZone, today))
    .sort((a, b) => a.at - b.at)
    .slice(0, limit)
}
