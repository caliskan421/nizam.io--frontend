import type { MeetingDetail } from '../../model/types'

export function departmentOrder(meeting: MeetingDetail | null): string[] {
  return meeting
    ? [
        meeting.owner_department_id,
        ...meeting.departments
          .map((d) => d.department_id)
          .filter((id) => id !== meeting.owner_department_id),
      ]
    : []
}

export function toggleDepartment(
  mode: 'person' | 'coordinatorship',
  selected: string[],
  id: string,
) {
  if (mode === 'person') return [id]
  return selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]
}
