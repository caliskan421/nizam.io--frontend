import { describe, expect, it } from 'vitest'

import { item } from '../../__tests__/rows'
import { queueParts } from './queue-parts'

const TZ = 'Europe/Istanbul'

describe('Ü1 kuyruk satır parçaları (BE-137)', () => {
  it('"‹n› dosya"; onaydaki satırda "‹GG.AA›’da gönderildi"', () => {
    const review = item({
      status: 'onaya_sunuldu',
      file_count: 2,
      submitted_at: '2026-10-19T09:00:00Z',
    })
    expect(queueParts(review, TZ)).toEqual({ files: '2 dosya', sent: '19.10’da gönderildi' })
  })

  it('dosya 0 ve zaman null → gizli; onayda olmayan satırda gönderildi çizilmez', () => {
    expect(queueParts(item({ file_count: 0 }), TZ)).toEqual({ files: null, sent: null })
    const doing = item({ status: 'devam_ediyor', submitted_at: '2026-10-19T09:00:00Z' })
    expect(queueParts(doing, TZ).sent).toBeNull()
  })
})
