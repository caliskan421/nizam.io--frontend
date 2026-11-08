import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import { detailText, trWorkDetail, type WorkDetailTextKey } from './messages'

function leaves(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : leaves(v as object, `${prefix}${k}.`),
  )
}

describe('ayrıntı paneli metinleri', () => {
  it('her anahtar çözülür; yer tutucu dışında vue-i18n özel karakteri yok', () => {
    for (const key of leaves(trWorkDetail) as WorkDetailTextKey[]) {
      const text = detailText(key, { n: 3 })
      expect(text.trim(), key).not.toBe('')
      expect(text, key).not.toMatch(/[{}@$|]/)
      expect(i18n.global.te(key), key).toBe(true)
    }
  })

  it('tasarım metinleri ve faz notları', () => {
    expect(detailText('workDetail.timeline.overdue', { n: 88 })).toBe('88 gündür gecikmede')
    expect(detailText('workDetail.status.iade_edildi')).toBe('Geri gönderildi')
    expect(detailText('workDetail.summary.archiveLater')).toContain('F5')
    expect(detailText('workDetail.actions.dateRequest')).toContain('F3')
  })
})
