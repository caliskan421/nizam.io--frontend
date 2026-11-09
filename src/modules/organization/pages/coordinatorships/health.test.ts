import { describe, expect, it } from 'vitest'

import { daysAgo, NOW, stat, view } from '../../components/coordinatorships/__tests__/fixtures'
import { healthSummary } from './health'

describe('yapı sağlığı sayımları (E-08-08…11)', () => {
  it('koordinatörsüz, üyesi olmayan, görevsiz (+adlar), sessiz (null + 31 gün)', () => {
    const views = [
      view('d1', 'A', null, stat('d1', { coordinators: [], member_count: 0 })),
      view('d2', 'B', null, stat('d2', { total_tasks: 0, last_activity_at: null })),
      view('d3', 'C', null, stat('d3', { total_tasks: 0, last_activity_at: daysAgo(31) })),
      view('d4', 'D', null, stat('d4', { last_activity_at: daysAgo(30) })),
      view('d5', 'E', null, null),
    ]
    expect(healthSummary(views, NOW)).toEqual({
      noLead: 1,
      noMembers: 1,
      noTasks: 2,
      noTaskNames: ['B', 'C'],
      quiet: 2,
    })
  })

  it('üye sayısı yalnız uye rolü: koordinatörlü ama üyesiz birim "üyesi olmayan"', () => {
    const lone = view('d1', 'A', null, stat('d1', { member_count: 0 }))
    expect(healthSummary([lone], NOW)).toMatchObject({ noLead: 0, noMembers: 1 })
  })
})
