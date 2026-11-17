import { describe, expect, it } from 'vitest'

import { notificationTarget } from './target'

const ref = (kind: string, id: string) => ({ subject_ref: { kind, id } })

describe('notificationTarget', () => {
  it('work_item → /gorevler?gorev=<id> (03 derin bağlantısı)', () => {
    expect(notificationTarget(ref('work_item', 'w-1'))).toEqual({
      route: 'work.tasks',
      params: {},
      query: { gorev: 'w-1' },
      programId: null,
    })
  })
  it('meeting → 09b', () => {
    expect(notificationTarget(ref('meeting', 'm1'))).toEqual({
      route: 'collaboration.meeting',
      params: { meetingId: 'm1' },
      query: {},
      programId: null,
    })
  })
  it('program_transfer → ana sayfa (kimlik aktarım kimliğidir)', () => {
    expect(notificationTarget(ref('program_transfer', 'anything goes'))).toEqual({
      route: 'home',
      params: {},
      query: {},
      programId: null,
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

  it('program_id üst düzey alandan gelir; başka alandan (seçili program) tahmin edilmez', () => {
    expect(notificationTarget({ ...ref('work_item', 'w-1'), program_id: 'p-7' })?.programId).toBe(
      'p-7',
    )
    expect(
      notificationTarget({ ...ref('work_item', 'w-1'), program_id: null })?.programId,
    ).toBeNull()
    expect(notificationTarget(ref('work_item', 'w-1'))?.programId).toBeNull()
  })

  it('chat → konuşma rotası; detail.seq varsa mesaj=<seq>, yoksa/geçersizse yalnız konuşma', () => {
    const base = { ...ref('chat', 'c-1'), program_id: 'p-2' }
    expect(notificationTarget({ ...base, detail: { seq: 42, message_id: 'x' } })).toEqual({
      route: 'collaboration.chat',
      params: { chatId: 'c-1' },
      query: { mesaj: '42' },
      programId: 'p-2',
    })
    for (const detail of [null, {}, { seq: 0 }, { seq: -3 }, { seq: 1.5 }]) {
      expect(notificationTarget({ ...base, detail })?.query).toEqual({})
    }
    expect(notificationTarget({ ...ref('chat', '../x'), program_id: 'p-2' })).toBeNull()
  })

  it('program (günlük özet) → ana sayfa; program konunun kimliğidir', () => {
    expect(notificationTarget({ ...ref('program', 'p-9'), program_id: 'p-1' })).toEqual({
      route: 'home',
      params: {},
      query: {},
      programId: 'p-9',
    })
    expect(notificationTarget(ref('program', 'bad id!'))).toBeNull()
  })
})
