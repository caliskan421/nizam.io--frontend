import { describe, expect, it } from 'vitest'

import { item } from '../../__tests__/rows'
import { attentionNote, isLocked, lockText } from './lock'

describe('bekleyen bağımlılık ipucu (BE-138)', () => {
  it('kilit yalnız has_pending_dependency ile; metin yalnız SAYI (ad/kod uydurulmaz)', () => {
    const locked = item({ has_pending_dependency: true, pending_dependency_count: 2 })
    expect(isLocked(locked)).toBe(true)
    expect(lockText(locked)).toBe('2 görev bekleniyor')
    expect(lockText(item())).toBeNull()
  })

  it('dikkat notu: bağımlılık bekleyen yoksa yalnız geciken sayısı', () => {
    const late = item({ is_overdue: true })
    const waiting = item({ is_overdue: true, has_pending_dependency: true })
    expect(attentionNote([late, late, waiting])).toBe(
      '3 geciken görev · 1 görev bağımlılık bekliyor',
    )
    expect(attentionNote([late])).toBe('1 geciken görev')
  })
})
