import { describe, expect, it, vi } from 'vitest'

import { captureLinkClicks } from './__tests__/support'
import { isRedeemPath, redeemDownload } from './download'

const TICKET = 'a'.repeat(21) + '_' + 'B'.repeat(20) + '-'

describe('indirme bileti tüketme (W46)', () => {
  it('yalnız sözleşmedeki göreli tüketme yolu kabul edilir', () => {
    expect(isRedeemPath(`/v1/downloads/${TICKET}`)).toBe(true)
    expect(isRedeemPath(`https://kotu.test/v1/downloads/${TICKET}`)).toBe(false)
    expect(isRedeemPath(`//kotu.test/v1/downloads/${TICKET}`)).toBe(false)
    expect(isRedeemPath('/v1/downloads/../files/f1/download')).toBe(false)
    expect(isRedeemPath(`/v1/downloads/${TICKET}?x=1`)).toBe(false)
    expect(isRedeemPath('/v1/downloads/')).toBe(false)
  })

  it('geçici bağlantı tıklanır ve hemen kaldırılır; bilet hiçbir yerde kalmaz', () => {
    const stored = vi.spyOn(Storage.prototype, 'setItem')
    const clicks = captureLinkClicks()
    expect(redeemDownload(`/v1/downloads/${TICKET}`, 'rapor.pdf')).toBe(true)
    expect(clicks.hrefs).toEqual([`/v1/downloads/${TICKET}`])
    expect(clicks.downloads).toEqual(['rapor.pdf'])
    expect(document.querySelector('a')).toBeNull()
    expect(document.body.innerHTML).not.toContain(TICKET)
    expect(window.location.href).not.toContain(TICKET)
    expect(stored).not.toHaveBeenCalled()
  })

  it('geçersiz yol açılmaz', () => {
    const clicks = captureLinkClicks()
    expect(redeemDownload('https://kotu.test/x', 'a')).toBe(false)
    expect(clicks.hrefs).toEqual([])
  })
})
