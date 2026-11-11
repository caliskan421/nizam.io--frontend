import type { components } from '@/shared/api/schema'

type Meeting = components['schemas']['Meeting']
type Department = components['schemas']['ProgramDepartment']

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

/** Bugünün geçmiş saatleri de yaklaşan kümesindedir; sonuç yalnız yüklenen kayıtları kapsar. */
export function splitMeetings(meetings: readonly Meeting[], now: Date, timezone: string) {
  const today = meetingDay(now, timezone)
  const upcoming: Meeting[] = []
  const past: Meeting[] = []
  for (const meeting of meetings) {
    ;(meetingDay(meeting.meeting_date, timezone) >= today ? upcoming : past).push(meeting)
  }
  upcoming.sort((a, b) => Date.parse(a.meeting_date) - Date.parse(b.meeting_date))
  past.sort((a, b) => Date.parse(b.meeting_date) - Date.parse(a.meeting_date))
  return { upcoming, past }
}

/** Sahip önde; kod yoksa bağdaki adın baş harfleri kullanılır. */
export function meetingDepartments(meeting: Meeting, departments: readonly Department[]) {
  const codes = new Map(departments.map((d) => [d.department_id, d.code]))
  return [...meeting.departments]
    .sort(
      (a, b) =>
        Number(b.department_id === meeting.owner_department_id) -
        Number(a.department_id === meeting.owner_department_id),
    )
    .map((department) => ({
      ...department,
      code:
        codes.get(department.department_id) ||
        department.department_name
          .trim()
          .split(/\s+/)
          .map((word) => word[0]?.toLocaleUpperCase('tr-TR') ?? '')
          .join(''),
    }))
}
