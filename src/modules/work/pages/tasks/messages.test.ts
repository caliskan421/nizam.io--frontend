import { describe, expect, it } from 'vitest'

import { tasksText, trTasksPage } from './messages'

describe('görev listesi sayfa metinleri', () => {
  it('ağaçtan okunur, yer tutucular doldurulur', () => {
    expect(tasksText('tasksPage.title')).toBe(trTasksPage.tasksPage.title)
    expect(tasksText('tasksPage.summary.tasksPartial', { n: 200 })).toBe('200+ görev')
    expect(tasksText('tasksPage.requests.bandTitle', { n: 3 })).toBe(
      '3 tarih değişikliği talebi onay bekliyor',
    )
    expect(tasksText('tasksPage.partial')).toBe('yüklenen kayıtlar içinde')
  })

  it('sekme adları: Geri gönderildi ve Geciken (P5)', () => {
    expect(tasksText('tasksPage.tabs.iade_edildi')).toBe('Geri gönderildi')
    expect(tasksText('tasksPage.tabs.geciken')).toBe('Geciken')
  })
})
