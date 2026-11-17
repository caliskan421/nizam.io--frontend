import { describe, expect, it } from 'vitest'

import { makeChatMessage } from '@/shared/api/__tests__/defaults'

import {
  FORWARD_NOTE_MAX,
  FORWARD_TARGETS_MAX,
  canForward,
  includesOpenChat,
  toForwardBody,
  validateForward,
} from './forward'

describe('forward modeli (BE-080)', () => {
  it('hedef 1–10 benzersiz; tekrarlar tek sayılır', () => {
    expect(validateForward([], '')).toBe('targetsRequired')
    expect(validateForward(['a', 'a'], '')).toBeNull()
    const ten = Array.from({ length: FORWARD_TARGETS_MAX }, (_, i) => `c${i}`)
    expect(validateForward(ten, '')).toBeNull()
    expect(validateForward([...ten, 'c10'], '')).toBe('targetsMax')
    expect(validateForward([...ten, 'c0'], '')).toBeNull()
  })

  it('not ≤ 5.000 karakter (kırpılmış)', () => {
    expect(validateForward(['a'], 'x'.repeat(FORWARD_NOTE_MAX))).toBeNull()
    expect(validateForward(['a'], 'x'.repeat(FORWARD_NOTE_MAX + 1))).toBe('noteTooLong')
    expect(validateForward(['a'], `  ${'x'.repeat(FORWARD_NOTE_MAX)}  `)).toBeNull()
  })

  it('gövde: benzersiz hedefler seçim sırasıyla; boş not yok; kaynak alanı yok', () => {
    expect(toForwardBody(['b', 'a', 'b'], '  ')).toEqual({ targets: ['b', 'a'] })
    expect(toForwardBody(['a'], ' Bakın ')).toEqual({ targets: ['a'], note: 'Bakın' })
  })

  it('anket iletilemez (menüde gizli); metin/ek/ref mesajı iletilir', () => {
    expect(canForward(makeChatMessage({ poll: null }))).toBe(true)
    const poll = { anonymous: false, closed_at: null, closes_at: null, multi: false, results: [] }
    expect(canForward(makeChatMessage({ poll }))).toBe(false)
  })

  it('açık sohbet hedef mi', () => {
    const result = { items: [{ chat_id: 'a', message_id: '1' }] }
    expect(includesOpenChat(result, 'a')).toBe(true)
    expect(includesOpenChat(result, 'b')).toBe(false)
    expect(includesOpenChat(result, null)).toBe(false)
  })
})
