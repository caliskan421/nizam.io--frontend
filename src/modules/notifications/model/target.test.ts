import { describe, expect, it } from 'vitest'

import { notificationTarget } from './target'

const ref = (kind: string, id: string) => ({ subject_ref: { kind, id } })

describe('notificationTarget', () => {
  it('work_item → /gorevler?gorev=<id> (03 derin bağlantısı)', () => {
    expect(notificationTarget(ref('work_item', 'w-1'))).toEqual({
      route: 'work.tasks',
      params: {},
      query: { gorev: 'w-1' },
    })
  })
  it('meeting → 09b', () => {
    expect(notificationTarget(ref('meeting', 'm1'))).toEqual({
      route: 'collaboration.meeting',
      params: { meetingId: 'm1' },
      query: {},
    })
  })
  it('program_transfer → ana sayfa (kimlik aktarım kimliğidir)', () => {
    expect(notificationTarget(ref('program_transfer', 'anything goes'))).toEqual({
      route: 'home',
      params: {},
      query: {},
    })
  })
  it('membership ve bilinmeyen kind: gezinme yok', () => {
    expect(notificationTarget(ref('membership', 'x'))).toBeNull()
    expect(notificationTarget(ref('something_new', 'x'))).toBeNull()
  })
  it('geçersiz kimlik gezinme üretmez', () => {
    expect(notificationTarget(ref('work_item', ''))).toBeNull()
    expect(notificationTarget(ref('meeting', '../x'))).toBeNull()
    expect(notificationTarget(ref('work_item', 'a'.repeat(129)))).toBeNull()
  })
})
