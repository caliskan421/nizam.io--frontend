import { describe, expect, it } from 'vitest'

import { task } from '../../model/__tests__/gantt-fixtures'
import { dotTitle, isLate, latenessNote, rowSummary, statusLabel, statusTone } from './task-view'

const OVERDUE = { ...task().lateness, is_overdue: true, days_overdue: 41 }
const DONE_LATE = { ...task().lateness, is_completed_late: true, days_late: 3 }

describe('görev gösterimi', () => {
  it('beş durum tonu; bilinmeyen durum en nötr ton', () => {
    expect(
      ['baslanmadi', 'devam_ediyor', 'onaya_sunuldu', 'iade_edildi', 'tamamlandi'].map(statusTone),
    ).toEqual(['todo', 'doing', 'review', 'back', 'done'])
    expect(statusTone('yeni_durum')).toBe('todo')
  })

  it('durum metni; bilinmeyen durumda sunucu değeri değil nötr metin', () => {
    expect(statusLabel('onaya_sunuldu')).toBe('Onay bekliyor')
    expect(statusLabel('iade_edildi')).toBe('Geri gönderildi')
    expect(statusLabel('yeni_durum')).toBe('Durum bilinmiyor')
  })

  it('gecikme notu: gecikmede ve geç bitişte; zamanında yok', () => {
    expect(latenessNote(task({ lateness: OVERDUE }))).toBe('41 gün gecikmede')
    expect(latenessNote(task({ lateness: DONE_LATE }))).toBe('3 gün geç bitti')
    expect(latenessNote(task())).toBeNull()
    expect(isLate(task({ lateness: OVERDUE }))).toBe(true)
    expect(isLate(task({ lateness: DONE_LATE }))).toBe(true)
    expect(isLate(task())).toBe(false)
  })

  it('nokta ipucu: <Durum> · N gün gecikmede', () => {
    expect(dotTitle(task({ lateness: OVERDUE }))).toBe('Devam ediyor · 41 gün gecikmede')
    expect(dotTitle(task({ status: 'tamamlandi', lateness: DONE_LATE }))).toBe(
      'Tamamlandı · 3 gün geç bitti',
    )
    expect(dotTitle(task())).toBe('Devam ediyor')
  })

  it('ekran okuyucu özeti: başlık, durum, aralık, gecikme, bağımlılık', () => {
    expect(rowSummary(task({ title: 'Hidrofor', lateness: OVERDUE }), true)).toBe(
      'Hidrofor, Devam ediyor, 2 Kas – 10 Kas, 41 gün gecikmede, Bağımlılığı var',
    )
    expect(rowSummary(task({ title: 'Hidrofor' }), false)).toBe(
      'Hidrofor, Devam ediyor, 2 Kas – 10 Kas',
    )
  })
})
