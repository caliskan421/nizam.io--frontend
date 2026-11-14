import { describe, expect, it } from 'vitest'

import { mentionToken, refToken, segmentBody } from './rich-text'

describe('segmentBody', () => {
  it('bahsetme ve görev etiketini gövdede bulur; kalan düz metin kalır', () => {
    const { segments, unplacedRefs } = segmentBody(
      'Merhaba @Ayşe Yılmaz, #Trafo projesi hazır @herkes',
      [
        { token: mentionToken('Ayşe Yılmaz'), me: true },
        { token: mentionToken('herkes'), me: true },
      ],
      [{ token: refToken('Trafo projesi'), refId: 'r1' }],
    )
    expect(segments).toEqual([
      { kind: 'text', text: 'Merhaba ' },
      { kind: 'mention', text: '@Ayşe Yılmaz', me: true },
      { kind: 'text', text: ', ' },
      { kind: 'ref', text: '#Trafo projesi', refId: 'r1' },
      { kind: 'text', text: ' hazır ' },
      { kind: 'mention', text: '@herkes', me: true },
    ])
    expect(unplacedRefs).toEqual([])
  })

  it('eşleşmeyen bahsetme düz metin kalır; yeri bulunamayan görev başvurusu bildirilir', () => {
    const { segments, unplacedRefs } = segmentBody(
      '@Bilinmeyen merhaba',
      [{ token: '@Ayşe', me: false }],
      [{ token: refToken('Başka görev'), refId: 'r2' }],
    )
    expect(segments).toEqual([{ kind: 'text', text: '@Bilinmeyen merhaba' }])
    expect(unplacedRefs).toEqual(['r2'])
  })

  it('aynı konumda uzun etiket kısa olana üstün gelir; her geçiş çip olur', () => {
    const { segments } = segmentBody(
      '@Ali Veli ve @Ali',
      [
        { token: '@Ali', me: false },
        { token: '@Ali Veli', me: false },
      ],
      [],
    )
    expect(segments.map((s) => s.text)).toEqual(['@Ali Veli', ' ve ', '@Ali'])
  })

  it('uzun görev başlığı kısaltılır (aynı kısaltma iki yanda)', () => {
    const long = 'Çok uzun bir görev başlığı: trafo ve dağıtım projesi saha montajı'
    expect(refToken(long).length).toBeLessThanOrEqual(31)
    expect(refToken(long).endsWith('…')).toBe(true)
    expect(refToken('  iki   boşluk ')).toBe('#iki boşluk')
  })

  it('boş gövde parça üretmez', () => {
    expect(segmentBody('', [], []).segments).toEqual([])
  })
})
