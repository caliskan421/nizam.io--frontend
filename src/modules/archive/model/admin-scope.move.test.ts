import { describe, expect, it } from 'vitest'

import { moveTargetSource } from './admin-scope'

describe('moveTargetSource (taşıma hedef görev kaynağı)', () => {
  it('yönetici: süzgeçsiz program kaynağı (bütün departmanlar, tek okuma)', () => {
    expect(moveTargetSource({ programId: 'p1', departmentId: 'd1' }, true)).toEqual({
      programId: 'p1',
      departmentId: null,
      program: true,
    })
  })

  it('koordinatör/üye: yalnız seçili kapsamın S3 hedefi', () => {
    expect(moveTargetSource({ programId: 'p1', departmentId: 'd1' }, false)).toEqual({
      programId: 'p1',
      departmentId: 'd1',
    })
  })

  it('program, standing ya da departman yoksa istek yok', () => {
    expect(moveTargetSource({ programId: null, departmentId: null }, true)).toBeNull()
    expect(moveTargetSource({ programId: 'p1', departmentId: 'd1' }, null)).toBeNull()
    expect(moveTargetSource({ programId: 'p1', departmentId: null }, false)).toBeNull()
  })
})
