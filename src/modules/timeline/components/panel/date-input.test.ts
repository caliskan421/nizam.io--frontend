import { describe, expect, it } from 'vitest'

import { checkDraft, formatInputDay, parseInputDay } from './date-input'

describe('panel tarih girdisi (gg.aa.yyyy ↔ YYYY-MM-DD)', () => {
  it('biçimler gidiş dönüş', () => {
    expect(formatInputDay('2026-06-22')).toBe('22.06.2026')
    expect(parseInputDay('22.06.2026')).toBe('2026-06-22')
    expect(parseInputDay(' 2.6.2026 ')).toBe('2026-06-02')
  })

  it.each(['', '2026-06-22', '31.02.2026', '32.01.2026', '22.13.2026', 'abc', '22.06.26'])(
    'geçersiz girdi reddedilir: %j',
    (text) => {
      expect(parseInputDay(text)).toBeNull()
    },
  )

  it('biçim dışı ya da boş ISO değeri boş girdi olur (uydurma tarih yok)', () => {
    expect(formatInputDay('')).toBe('')
    expect(formatInputDay('22.06.2026')).toBe('')
  })

  it('checkDraft: geçerli aralık, tek günlük aralık, ters sıra, geçersiz uç', () => {
    expect(checkDraft('01.11.2026', '10.11.2026')).toEqual({
      value: { startOn: '2026-11-01', endOn: '2026-11-10' },
      start: null,
      end: null,
    })
    expect(checkDraft('05.11.2026', '05.11.2026').value).not.toBeNull()
    expect(checkDraft('10.11.2026', '01.11.2026')).toEqual({
      value: null,
      start: null,
      end: 'order',
    })
    expect(checkDraft('x', '01.11.2026')).toEqual({ value: null, start: 'dateInvalid', end: null })
    expect(checkDraft('01.11.2026', '')).toEqual({ value: null, start: null, end: 'dateInvalid' })
  })
})
