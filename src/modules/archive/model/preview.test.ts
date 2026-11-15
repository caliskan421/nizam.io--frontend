import { describe, expect, it } from 'vitest'

import { formatUploadedAt, subtaskTitle, uploaderName } from './preview'

const file = (over: Record<string, unknown>) =>
  ({
    file_id: 'f1',
    work_item_id: 'w1',
    display_name: 'a.pdf',
    content_type: 'application/pdf',
    size_bytes: 1,
    tag: 'plan',
    uploaded_by_account_id: 'a1',
    uploaded_by_full_name: 'Ayşe Yılmaz',
    ...over,
  }) as never

describe('önizleme yan okumaları', () => {
  it('yükleyen adı: null/boş ise nötr (kimlikten ad uydurulmaz)', () => {
    expect(uploaderName(file({}))).toBe('Ayşe Yılmaz')
    expect(uploaderName(file({ uploaded_by_full_name: null }))).toBeNull()
    expect(uploaderName(file({ uploaded_by_full_name: '  ' }))).toBeNull()
  })

  it('alt görev adı: kimlik yok / liste yok / eşleşme yok → nötr', () => {
    const subtasks = [{ subtask_id: 's1', title: 'Taslak' }] as never
    expect(subtaskTitle(subtasks, 's1')).toBe('Taslak')
    expect(subtaskTitle(subtasks, 's2')).toBeNull()
    expect(subtaskTitle(subtasks, undefined)).toBeNull()
    expect(subtaskTitle(undefined, 's1')).toBeNull()
  })
})

describe('formatUploadedAt', () => {
  it('kurulum saat diliminde "GG.AA.YYYY · SS:DD"', () => {
    expect(formatUploadedAt('2026-11-12T21:30:00Z', 'Europe/Istanbul')).toBe('13.11.2026 · 00:30')
    expect(formatUploadedAt('2026-11-12T21:30:00Z', 'UTC')).toBe('12.11.2026 · 21:30')
  })
  it('profil yoksa ya da dilim geçersizse İstanbul; bozuk tarih → null', () => {
    expect(formatUploadedAt('2026-11-12T09:05:00Z', null)).toBe('12.11.2026 · 12:05')
    expect(formatUploadedAt('2026-11-12T09:05:00Z', 'Yok/Zone')).toBe('12.11.2026 · 12:05')
    expect(formatUploadedAt('bozuk', 'UTC')).toBeNull()
  })
})
