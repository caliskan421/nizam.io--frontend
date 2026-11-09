import { describe, expect, it } from 'vitest'

import { findCoordinatorship, joinCoordinatorships } from './coordinatorships'
import type { CoordinatorshipStat } from './types'

function stat(departmentId: string, overrides: Partial<CoordinatorshipStat> = {}) {
  return {
    department_id: departmentId,
    name: departmentId,
    kind: 'koordinatorluk',
    completed_tasks: 0,
    completion_rate: 0,
    coordinators: [],
    in_progress_tasks: 0,
    last_activity_at: null,
    meeting_count: 0,
    member_count: 0,
    not_started_tasks: 0,
    overdue_tasks: 0,
    total_tasks: 0,
    ...overrides,
  } satisfies CoordinatorshipStat
}

describe('08 kart birleşimi (listProgramDepartments ⋈ coordinatorship_stats)', () => {
  it('department_id ile birleşir; ad programdaki ad; kodsuzda null; Türkçe sıra', () => {
    const views = joinCoordinatorships(
      [
        { department_id: 'd-2', display_name: 'Şasi', code: 'SAS' },
        { department_id: 'd-1', display_name: 'İletişim' },
        { department_id: 'd-3', display_name: 'Çevre' },
      ],
      [stat('d-1', { total_tasks: 4, name: 'katalog adı' }), stat('d-2')],
    )
    expect(views.map((v) => v.displayName)).toEqual(['Çevre', 'İletişim', 'Şasi'])
    expect(views[1]).toMatchObject({ departmentId: 'd-1', code: null })
    expect(views[1]?.stat?.total_tasks).toBe(4)
    // Raporda olmayan birim (yarış) → sayılar "—" (stat null).
    expect(views[0]?.stat).toBeNull()
  })

  it('rapor yoksa (null) bütün kartlar statsız', () => {
    const views = joinCoordinatorships([{ department_id: 'd-1', display_name: 'A' }], null)
    expect(views[0]?.stat).toBeNull()
  })

  it('tek birim: listede yoksa null (E-08-52)', () => {
    const views = joinCoordinatorships([{ department_id: 'd-1', display_name: 'A' }], [])
    expect(findCoordinatorship(views, 'd-1')?.displayName).toBe('A')
    expect(findCoordinatorship(views, 'yok')).toBeNull()
  })
})
