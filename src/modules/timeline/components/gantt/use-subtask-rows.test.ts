import { describe, expect, it } from 'vitest'

import { useSubtaskRows } from './use-subtask-rows'

describe('useSubtaskRows (03d açık alt görev durumu)', () => {
  it('açılan görev sayı bilinmeden 1 satır ayırır; bildirilen sayı onu değiştirir', () => {
    const s = useSubtaskRows()
    expect(s.rows.value.size).toBe(0)
    s.toggle('a')
    expect([...s.rows.value]).toEqual([['a', 1]])
    s.setCount('a', 4)
    expect(s.rows.value.get('a')).toBe(4)
  })

  it('satırın subtask_counts.total değeri liste gelene dek ayrılan satır sayısıdır (en az 1)', () => {
    const tasks = [
      { work_item_id: 'a', subtask_counts: { total: 3, done: 1 } },
      { work_item_id: 'b', subtask_counts: { total: 0, done: 0 } },
    ]
    const s = useSubtaskRows(() => tasks)
    s.toggle('a')
    s.toggle('b')
    expect(s.rows.value.get('a')).toBe(3)
    expect(s.rows.value.get('b')).toBe(1)
    s.setCount('a', 2) // liste yüklendi: gerçek satır sayısı
    expect(s.rows.value.get('a')).toBe(2)
  })

  it('kapatma satırı düşürür; sayı bildirimi kapalı görevi açmaz', () => {
    const s = useSubtaskRows()
    s.toggle('a')
    s.toggle('a')
    expect(s.open.value.size).toBe(0)
    s.setCount('b', 2)
    expect(s.rows.value.size).toBe(0)
  })
})
