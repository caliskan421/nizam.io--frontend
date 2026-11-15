import { describe, expect, it } from 'vitest'
import { makeMeetingDepartment, withMeetingDefaults } from '@/shared/api/__tests__/defaults'
import type { components } from '@/shared/api/schema'
import { groupMeetings, meetingDay, meetingDepartments } from './list'

type Meeting = components['schemas']['Meeting']
const meeting = (id: string, date: string): Meeting =>
  withMeetingDefaults({
    meeting_id: id,
    meeting_date: date,
    title: id,
    created_at: date,
    updated_at: date,
    created_by_account_id: 'a',
    created_by_role: 'admin',
    departments: [],
    invite_mode: 'coordinatorship',
    members_included: false,
    owner_department_id: 'd',
    place: null,
    program_id: 'p',
  })

describe('meeting list model', () => {
  it('uses the installation calendar day', () => {
    expect(meetingDay(new Date('2026-11-10T22:30:00Z'), 'Europe/Istanbul')).toBe('2026-11-11')
    expect(meetingDay('2026-11-10T20:59:00Z', 'Europe/Istanbul')).toBe('2026-11-10')
  })
  it('places the owner first and falls back to initials for missing codes', () => {
    const m = {
      ...meeting('x', '2026-11-11T00:00:00Z'),
      departments: [
        makeMeetingDepartment({ department_id: 'other', department_name: 'İnsan Kaynakları' }),
        makeMeetingDepartment({ department_id: 'd', department_name: 'Ana Ekip' }),
      ],
    }
    expect(
      meetingDepartments(m, [{ department_id: 'd', display_name: 'Ana', code: 'ANA' }]).map(
        (d) => d.code,
      ),
    ).toEqual(['ANA', 'İK'])
  })
  it('groups records by the installation calendar day', () => {
    const groups = groupMeetings(
      [
        meeting('a', '2026-11-10T21:01:00Z'),
        meeting('b', '2026-11-11T12:00:00Z'),
        meeting('c', '2026-11-10T20:59:00Z'),
      ],
      'Europe/Istanbul',
    )
    expect(groups.map((g) => [g.day, g.items.map((m) => m.meeting_id)])).toEqual([
      ['2026-11-11', ['a', 'b']],
      ['2026-11-10', ['c']],
    ])
  })
})
