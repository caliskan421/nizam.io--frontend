import { describe, expect, it, vi } from 'vitest'

import { dispositionName, safeFileName, saveBlob, ticketOf } from './save'

describe('bilet yolu', () => {
  it('yalnız sözleşmedeki göreli tüketme yolu (açık yönlendirme yok)', () => {
    expect(ticketOf('/v1/downloads/abc_DEF-123')).toBe('abc_DEF-123')
    for (const bad of [
      'https://kotu.example/v1/downloads/abc',
      '//kotu.example/v1/downloads/abc',
      '/v1/downloads/a/b',
      '/v1/downloads/',
      '/v1/files/f1/download',
      '/v1/downloads/abc?x=1',
      '',
    ]) {
      expect(ticketOf(bad), bad).toBeNull()
    }
  })
})

describe('Content-Disposition adı', () => {
  it('filename* (UTF-8) önce, ASCII yedek sonra', () => {
    expect(
      dispositionName(
        `attachment; filename="rapor.pdf"; filename*=UTF-8''r%C3%BCzgar%20raporu.pdf`,
      ),
    ).toBe('rüzgar raporu.pdf')
    expect(dispositionName('attachment; filename="rapor.pdf"')).toBe('rapor.pdf')
    expect(dispositionName('attachment; filename=arsiv.zip')).toBe('arsiv.zip')
    expect(dispositionName(null)).toBeNull()
    expect(dispositionName('attachment')).toBeNull()
  })

  it('bozuk UTF-8 kodlaması ASCII yedeğe düşer', () => {
    expect(dispositionName(`attachment; filename="a.pdf"; filename*=UTF-8''%E0%A4%A`)).toBe('a.pdf')
  })

  it('indirme adı yol ayracı ve denetim karakteri taşımaz', () => {
    expect(safeFileName('../etc/passwd', 'x.zip')).toBe('.._etc_passwd')
    expect(safeFileName('a\\b\u0001c', 'x.zip')).toBe('a_b_c')
    expect(safeFileName('   ', 'yedek.zip')).toBe('yedek.zip')
  })
})

describe('saveBlob', () => {
  it('geçici bağlantı tıklanır, URL hemen serbest bırakılır, öğe kaldırılır', () => {
    const create = vi.fn(() => 'blob:test-1')
    const revoke = vi.fn()
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    saveBlob(new Blob(['x']), 'a.zip')
    expect(create).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(revoke).toHaveBeenCalledWith('blob:test-1')
    expect(document.querySelector('a[download]')).toBeNull()
    click.mockRestore()
  })

  it('tıklama hata verse de URL serbest bırakılır', () => {
    const revoke = vi.fn()
    Object.assign(URL, { createObjectURL: () => 'blob:x', revokeObjectURL: revoke })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      throw new Error('boom')
    })
    expect(() => saveBlob(new Blob(['x']), 'a.zip')).toThrow('boom')
    expect(revoke).toHaveBeenCalledWith('blob:x')
    click.mockRestore()
  })
})
