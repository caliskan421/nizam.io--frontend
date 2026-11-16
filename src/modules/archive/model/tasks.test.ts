import { describe, expect, it } from 'vitest'

import { adjacentFile, filePosition } from './preview'
import { taskTitles, uploadTasks } from './tasks'

const tasks = [
  { work_item_id: 'w2', title: 'Zemin', file_count: 1, department_id: 'd1' },
  { work_item_id: 'w1', title: 'Ağ', file_count: 4, department_id: 'd1' },
]

describe('görev yardımcıları', () => {
  it('görev adı sözlüğü', () => {
    expect(taskTitles(tasks)).toEqual({ w2: 'Zemin', w1: 'Ağ' })
    expect(taskTitles(undefined)).toEqual({})
  })

  it("yükleme satırları: ada göre (tr-TR); başlık hedefi SEÇENEĞİN department_id'si (RECORDS-K39)", () => {
    const mixed = [
      { work_item_id: 'w2', title: 'Zemin', file_count: 0, department_id: 'd2' },
      { work_item_id: 'w1', title: 'Ağ', file_count: 4, department_id: 'd1' },
    ]
    expect(uploadTasks(mixed)).toEqual([
      { workItemId: 'w1', title: 'Ağ', departmentId: 'd1' },
      { workItemId: 'w2', title: 'Zemin', departmentId: 'd2' },
    ])
    expect(uploadTasks(undefined)).toEqual([])
  })
})

describe('önizleme konumu ve komşu dosya', () => {
  const files = [{ file_id: 'a' }, { file_id: 'b' }, { file_id: 'c' }]
  it('1 tabanlı konum; seçili/yok → 0', () => {
    expect(filePosition(files, 'b')).toBe(2)
    expect(filePosition(files, 'x')).toBe(0)
    expect(filePosition(files, null)).toBe(0)
  })
  it('önceki/sonraki; uçlarda null (devam varsa çağıran sayfa yükler)', () => {
    expect(adjacentFile(files, 'b', 'next')?.file_id).toBe('c')
    expect(adjacentFile(files, 'b', 'previous')?.file_id).toBe('a')
    expect(adjacentFile(files, 'c', 'next')).toBeNull()
    expect(adjacentFile(files, 'a', 'previous')).toBeNull()
    expect(adjacentFile(files, 'x', 'next')).toBeNull()
    expect(adjacentFile(files, null, 'previous')).toBeNull()
  })
})
