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

  it('kapatma satırı düşürür; sayı bildirimi kapalı görevi açmaz', () => {
    const s = useSubtaskRows()
    s.toggle('a')
    s.toggle('a')
    expect(s.open.value.size).toBe(0)
    s.setCount('b', 2)
    expect(s.rows.value.size).toBe(0)
  })
})
