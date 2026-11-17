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

describe('zil hedefi — sohbet ve günlük özet (BE-143, v0.25)', () => {
  it('sohbet → tipli rota collaboration.chat `/mesajlar/:chatId`; seq varsa `mesaj`, `sohbet` alias yok', () => {
    const withSeq = notificationTarget({
      ...ref('chat', 'c-7'),
      detail: { seq: 12 },
      program_id: 'p1',
    })!
    expect(bellTargetLocation(withSeq)).toEqual({
      name: 'collaboration.chat',
      params: { chatId: 'c-7' },
      query: { mesaj: '12' },
    })
    const noSeq = notificationTarget({ ...ref('chat', 'c-7'), program_id: 'p1' })!
    expect(bellTargetLocation(noSeq)).toEqual({
      name: 'collaboration.chat',
      params: { chatId: 'c-7' },
      query: {},
    })
    expect(Object.keys(bellTargetLocation(withSeq).query)).not.toContain('sohbet')
  })
  it('günlük özet (program) → ana sayfa', () => {
    expect(bellTargetLocation(notificationTarget(ref('program', 'p-2'))!)).toEqual({
      name: 'home',
      params: {},
      query: {},
    })
  })
})
