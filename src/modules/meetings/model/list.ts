import type { components } from '@/shared/api/schema'

type Meeting = components['schemas']['Meeting']

/** Kurulum saat dilimindeki takvim günü; ISO sırası karşılaştırmaya uygundur. */
export function meetingDay(date: string | Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(date))
  const part = (name: string) => parts.find((p) => p.type === name)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

/**
 * Sahip önde; kod bağ anı kopyasıdır (BE-063 `department_code`), kodsuz/eski bağda adın baş
 * harfleri kullanılır. `deleted` okuma anı olgusudur (silinmiş koordinatörlük işareti).
 */
export function meetingDepartments(meeting: Meeting) {
  return [...meeting.departments]
    .sort(
      (a, b) =>
        Number(b.department_id === meeting.owner_department_id) -
        Number(a.department_id === meeting.owner_department_id),
    )
    .map((department) => ({
      ...department,
      code:
        department.department_code ||
        department.department_name
          .trim()
          .split(/\s+/)
          .map((word) => word[0]?.toLocaleUpperCase('tr-TR') ?? '')
          .join(''),
    }))
}

/** Tarih sırası çağırandan gelir; aynı kurulum günü tek grup oluşturur. */
export function groupMeetings(meetings: readonly Meeting[], timezone: string) {
  const groups = new Map<string, Meeting[]>()
  for (const meeting of meetings) {
    const day = meetingDay(meeting.meeting_date, timezone)
    const group = groups.get(day) ?? []
    group.push(meeting)
    groups.set(day, group)
  }
  return [...groups].map(([day, items]) => ({ day, items }))
}
