import { describe, expect, it } from 'vitest'

import { item } from '../../__tests__/rows'
import { checkReturnReason, latestReturnReason, shownReason } from './return-reason'

const returned = (reason: string | null, at = '2026-10-19T09:00:00Z') => ({
  reason,
  returned_at: at,
  returned_by: { account_id: 'acc-1', full_name: 'Kadir Özbek' },
})

describe('iade gerekçesi (BE-139)', () => {
  it('gönderim: boş geçerli (gerekçesiz); 3–500 karakter geçerli; 1–2 ve >500 geçersiz', () => {
    expect(checkReturnReason('   ')).toEqual({ ok: true, reason: null })
    expect(checkReturnReason('  imzalı liste eksik ')).toEqual({
      ok: true,
      reason: 'imzalı liste eksik',
    })
    expect(checkReturnReason('ab')).toEqual({ ok: false })
    expect(checkReturnReason('a'.repeat(500)).ok).toBe(true)
    expect(checkReturnReason('a'.repeat(501))).toEqual({ ok: false })
    // Karakter sayısı (kod noktası): üç emoji = 3 karakter
    expect(checkReturnReason('😀😀😀').ok).toBe(true)
  })

  it('gösterim: null last_return/null gerekçe nötr; uzun gerekçe kırpılır; metin olduğu gibi', () => {
    expect(shownReason(item({ last_return: null }))).toBeNull()
    expect(shownReason(item({ last_return: returned(null) }))).toBeNull()
    expect(shownReason(item({ last_return: returned('<b>x</b>  eksik') }))).toBe('<b>x</b> eksik')
    const long = shownReason(item({ last_return: returned('a'.repeat(300)) }))
    expect([...long!]).toHaveLength(121)
    expect(long!.endsWith('…')).toBe(true)
  })

  it('kart notu: en son iade edilenin gerekçesi; gerekçe yoksa null', () => {
    const items = [
      item({ status: 'iade_edildi', last_return: returned('eski neden', '2026-10-01T09:00:00Z') }),
      item({ status: 'iade_edildi', last_return: returned('yeni neden', '2026-10-19T09:00:00Z') }),
      item({ status: 'devam_ediyor', last_return: returned('başka', '2026-10-25T09:00:00Z') }),
    ]
    expect(latestReturnReason(items)).toBe('yeni neden')
    expect(latestReturnReason([item({ status: 'iade_edildi', last_return: returned(null) })])).toBe(
      null,
    )
    expect(latestReturnReason([])).toBeNull()
  })
})
