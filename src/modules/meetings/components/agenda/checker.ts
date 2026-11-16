import type { AgendaItem, MeetingDetail } from '../../model/types'

export function checker(
  item: AgendaItem,
  participants: MeetingDetail['participants'],
  timezone: string,
  unknown: string,
) {
  // İşaretleyen adı sunucudan (BE-063 `checked_by_full_name`); eski satırda katılımcıdan yedek.
  const name =
    item.checked_by_full_name ||
    participants.find((p) => p.account_id === item.checked_by_account_id)?.full_name
  const displayName = name ?? unknown
  const parts = displayName.trim().split(/\s+/)
  const short =
    name && parts.length > 1 ? `${parts.slice(0, -1).join(' ')} ${parts.at(-1)?.[0]}.` : displayName
  const time = item.checked_at
    ? new Intl.DateTimeFormat('tr-TR', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(item.checked_at))
    : ''
  return [short, time].filter(Boolean).join(' · ')
}
