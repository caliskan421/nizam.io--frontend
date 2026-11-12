import { describe, expect, it } from 'vitest'

import { adjacentFile, filePosition } from './preview'
import { taskTitles, uploadTasks } from './tasks'

const tasks = [
  { work_item_id: 'w2', title: 'Zemin', file_count: 1 },
  { work_item_id: 'w1', title: 'Ağ', file_count: 4 },
]

describe('görev yardımcıları', () => {
  it('görev adı sözlüğü', () => {
    expect(taskTitles(tasks)).toEqual({ w2: 'Zemin', w1: 'Ağ' })
    expect(taskTitles(undefined)).toEqual({})
  })

  it('yükleme satırları: ada göre (tr-TR), departman başlık hedefi; departman yoksa boş', () => {
    expect(uploadTasks(tasks, 'd7')).toEqual([
      { workItemId: 'w1', title: 'Ağ', departmentId: 'd7' },
      { workItemId: 'w2', title: 'Zemin', departmentId: 'd7' },
    ])
    expect(uploadTasks(tasks, null)).toEqual([])
    expect(uploadTasks(undefined, 'd7')).toEqual([])
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
