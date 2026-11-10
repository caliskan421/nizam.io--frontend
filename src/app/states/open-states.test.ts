import { describe, expect, it } from 'vitest'

import { openStateCopy } from './open-states'

describe('açık durum içeriği', () => {
  it('program yok: yönetici "program oluştur" → /programlar bağlantısı (W81); diğerleri bilgilendirme', () => {
    const admin = openStateCopy('state.no-program', true)!
    expect(admin.title).toBe('Program yok')
    expect(admin.action).toEqual({ label: 'Program oluştur', to: 'program.programs' })
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

  it('departman yok: yönetici "Departman ekle" program yönetimine bağlanır (K-6; faz notu yok)', () => {
    expect(openStateCopy('state.no-department', true)?.action).toEqual({
      label: 'Departman ekle',
      to: 'program.programs',
    })
    expect(openStateCopy('state.no-department', false)?.action).toBeNull()
  })

  it('çıkış doğrulanamadı metni ortak-kurallar §8; güncelleme gerekli kabukta çizilmez', () => {
    expect(openStateCopy('state.logout-unverified', false)?.text).toBe(
      'Bu cihazdaki oturum kapatıldı, sunucu doğrulaması alınamadı.',
    )
    expect(openStateCopy('state.update-required', true)).toBeNull()
  })
})
