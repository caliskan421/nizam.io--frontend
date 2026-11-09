import { describe, expect, it } from 'vitest'

import { formatNoteTime, notesText, trNotes } from './messages'

describe('notlar metinleri', () => {
  it('work.notes.* anahtarları birleşir', () => {
    expect(notesText('add')).toBe(trNotes.work.notes.add)
    expect(notesText('confirmTitle')).toBe('Not silinsin mi?')
  })

  it('zaman kurulum saat diliminde; geçersiz dilimde tarayıcı dilimi; okunamayan tarih boş', () => {
    expect(formatNoteTime('2026-11-01T08:00:00Z', 'Europe/Istanbul')).toBe('1 Kas 2026 11:00')
    expect(formatNoteTime('2026-11-01T08:00:00Z', 'UTC')).toBe('1 Kas 2026 08:00')
    expect(formatNoteTime('2026-11-01T08:00:00Z', 'Yok/Bölge')).toMatch(/^1 Kas 2026 \d\d:\d\d$/)
    expect(formatNoteTime('2026-11-01T08:00:00Z', null)).toMatch(/^1 Kas 2026 \d\d:\d\d$/)
    expect(formatNoteTime('tarih değil', 'UTC')).toBe('')
  })
})
