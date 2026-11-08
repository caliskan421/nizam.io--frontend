import { describe, expect, it } from 'vitest'

import { openStateCopy } from './open-states'

describe('açık durum içeriği', () => {
  it('program yok: yönetici "program oluştur" devre dışı + F2 notu; diğerleri bilgilendirme', () => {
    const admin = openStateCopy('state.no-program', true)!
    expect(admin.title).toBe('Program yok')
    expect(admin.action).toEqual({
      label: 'Program oluştur',
      note: 'Program oluştur F2’de açılacak.',
    })
    const other = openStateCopy('state.no-program', false)!
    expect(other.action).toBeNull()
    expect(other.text).not.toBe(admin.text)
  })

  it('departman ataması bekleniyor: eylem yok (yöneticide de)', () => {
    expect(openStateCopy('state.membership-pending', true)?.action).toBeNull()
    expect(openStateCopy('state.membership-pending', false)?.title).toBe(
      'Departman ataması bekleniyor',
    )
  })

  it('departman yok: yönetici "departman ekle" devre dışı', () => {
    expect(openStateCopy('state.no-department', true)?.action?.label).toBe('Departman ekle')
    expect(openStateCopy('state.no-department', false)?.action).toBeNull()
  })

  it('çıkış doğrulanamadı metni ortak-kurallar §8; güncelleme gerekli kabukta çizilmez', () => {
    expect(openStateCopy('state.logout-unverified', false)?.text).toBe(
      'Bu cihazdaki oturum kapatıldı, sunucu doğrulaması alınamadı.',
    )
    expect(openStateCopy('state.update-required', true)).toBeNull()
  })
})
