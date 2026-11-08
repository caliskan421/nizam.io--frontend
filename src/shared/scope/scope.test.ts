import { describe, expect, it } from 'vitest'

import { globalKey, isScopedKey, scopedKey } from './scope'

describe('sorgu anahtarları', () => {
  it('kapsamlı anahtar program, departman ve merceği taşır', () => {
    const a = scopedKey({ programId: 'p1', departmentId: 'd1', lens: 'coordinator' }, 'work-items')
    const b = scopedKey({ programId: 'p1', departmentId: 'd1', lens: 'member' }, 'work-items')
    expect(a).not.toEqual(b)
    expect(a[1]).toEqual({ program: 'p1', department: 'd1', lens: 'coordinator' })
    // Mercek yoksa anahtar biçimi değişmez.
    expect(scopedKey({ programId: 'p1', departmentId: null }, 'x')[1]).toEqual({
      program: 'p1',
      department: null,
    })
  })

  it('isScopedKey yalnız scopedKey anahtarlarını seçer', () => {
    expect(isScopedKey(scopedKey({ programId: 'p1', departmentId: null }, 'work-items'))).toBe(true)
    expect(isScopedKey(globalKey('x'))).toBe(false)
    expect(isScopedKey(['me'])).toBe(false)
    expect(isScopedKey(['me', 'departments'])).toBe(false)
    expect(isScopedKey(['programs'])).toBe(false)
    expect(isScopedKey(['notifications', 'unread-count'])).toBe(false)
    expect(isScopedKey(['nizamio', ['program']])).toBe(false)
  })
})
