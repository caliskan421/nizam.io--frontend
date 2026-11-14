import { describe, expect, it } from 'vitest'

import { notificationTarget } from '@/modules/notifications/public'

import { bellTargetLocation } from './bell-target'

const ref = (kind: string, id: string) => ({ subject_ref: { kind, id } })

describe('zil hedefi → tipli rota konumu', () => {
  it('görev → /gorevler?gorev=<id>', () => {
    const target = notificationTarget(ref('work_item', 'w-9'))!
    expect(bellTargetLocation(target)).toEqual({
      name: 'work.tasks',
      params: {},
      query: { gorev: 'w-9' },
    })
  })
  it('toplantı → 09b; aktarım → ana sayfa', () => {
    expect(bellTargetLocation(notificationTarget(ref('meeting', 'm-1'))!)).toEqual({
      name: 'collaboration.meeting',
      params: { meetingId: 'm-1' },
      query: {},
    })
    expect(bellTargetLocation(notificationTarget(ref('program_transfer', 't-1'))!)).toEqual({
      name: 'home',
      params: {},
      query: {},
    })
  })
})
