import { describe, expect, it } from 'vitest'

import { FILE_TAGS, WORK_ITEM_STATUSES } from './types'

describe('sözleşme kümeleri', () => {
  it('beş durum, sözleşme sırası (P5: iade_edildi dahil)', () => {
    expect(WORK_ITEM_STATUSES).toEqual([
      'baslanmadi',
      'devam_ediyor',
      'onaya_sunuldu',
      'iade_edildi',
      'tamamlandi',
    ])
  })

  it('attachFile etiketleri kapalı küme (backend.md §2)', () => {
    expect(FILE_TAGS).toEqual(['ister', 'plan', 'girdi', 'analiz', 'cikti', 'sonuc'])
  })
})
