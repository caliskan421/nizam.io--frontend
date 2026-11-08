import { describe, expect, it } from 'vitest'

import { scopedKey } from './scope'

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

  // isScopedQueryKey testi tek tanımın yanında: src/shared/http/query-keys.test.ts.
})
