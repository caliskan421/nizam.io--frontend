import { describe, expect, it } from 'vitest'

import { subtaskText, trSubtasks } from './messages'

describe('alt görev metinleri', () => {
  it('parametreli metinler', () => {
    expect(subtaskText('subtasks.head', { done: 2, total: 4 })).toBe('alt görevler · 2/4')
    expect(subtaskText('subtasks.add.label', { title: 'Rapor' })).toBe('Rapor için alt görev ekle')
    expect(subtaskText('subtasks.add.placeholder')).toBe(trSubtasks.subtasks.add.placeholder)
  })

  it('E-03-30: yalnız isteğe bağlılık cümlesi (P5 — kanıt/tamamlama kuralı metni yok)', () => {
    expect(subtaskText('subtasks.caption')).toBe('Kişi ve tarih isteğe bağlıdır.')
    const all = JSON.stringify(trSubtasks)
    expect(all).not.toMatch(/bitirilemez|tamamlanamaz/)
  })
})
