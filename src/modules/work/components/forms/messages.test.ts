import { describe, expect, it } from 'vitest'

import { WORK_ITEM_STATUSES } from '../../model/types'
import { formsText, priorityLabel, statusLabel } from './messages'
import { PRIORITIES } from './new-task-schema'

describe('W45 form metinleri', () => {
  it('beş durumun tasarım adı (E-03-23; iade_edildi = "Geri gönderildi", P5)', () => {
    expect(WORK_ITEM_STATUSES.map(statusLabel)).toEqual([
      'Başlamadı',
      'Devam ediyor',
      'Onay bekliyor',
      'Geri gönderildi',
      'Tamamlandı',
    ])
  })

  it('dört öncelik adı (sözleşme sırası)', () => {
    expect(PRIORITIES.map(priorityLabel)).toEqual(['Düşük', 'Orta', 'Yüksek', 'Acil'])
  })

  it('parametreli metin ve istemdeki kanıt iletisi', () => {
    expect(formsText('workForms.remove.body', { title: 'Rapor' })).toContain('"Rapor"')
    expect(formsText('workForms.transition.evidence')).toBe('Önce kanıt dosyası yükleyin.')
    expect(formsText('workForms.transition.subtasks.title')).toBe(
      'Açık alt görevler kapatılsın mı?',
    )
  })
})
