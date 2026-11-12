import { describe, expect, it } from 'vitest'

import { subtaskTitle, uploaderName } from './preview'

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
  it('yükleyen adı: satır yoksa ya da null ise nötr (kimlikten ad uydurulmaz)', () => {
    expect(uploaderName([file({})], 'f1')).toBe('Ayşe Yılmaz')
    expect(uploaderName([file({ uploaded_by_full_name: null })], 'f1')).toBeNull()
    expect(uploaderName([file({})], 'baska')).toBeNull()
    expect(uploaderName(undefined, 'f1')).toBeNull()
  })

  it('alt görev adı: kimlik yok / liste yok / eşleşme yok → nötr', () => {
    const subtasks = [{ subtask_id: 's1', title: 'Taslak' }] as never
    expect(subtaskTitle(subtasks, 's1')).toBe('Taslak')
    expect(subtaskTitle(subtasks, 's2')).toBeNull()
    expect(subtaskTitle(subtasks, undefined)).toBeNull()
    expect(subtaskTitle(undefined, 's1')).toBeNull()
  })
})
