import { describe, expect, it } from 'vitest'

import { moveTargetSource } from './admin-scope'

describe('moveTargetSource (taşıma hedef görev kaynağı)', () => {
  it('yönetici: süzgeçsiz program kaynağı (bütün departmanlar, tek okuma)', () => {
    expect(moveTargetSource({ programId: 'p1', departmentId: 'd1' }, true, null)).toEqual({
      programId: 'p1',
      departmentId: null,
      program: true,
    })
  })

  it('koordinatör/üye: yalnız SEÇİLEN tek departmanın S3 hedefi (global kapsam değil)', () => {
    expect(moveTargetSource({ programId: 'p1', departmentId: 'd1' }, false, 'd2')).toEqual({
      programId: 'p1',
      departmentId: 'd2',
    })
  })

  it('program, standing ya da departman yoksa istek yok', () => {
    expect(moveTargetSource({ programId: null, departmentId: null }, true, null)).toBeNull()
    expect(moveTargetSource({ programId: 'p1', departmentId: 'd1' }, null, 'd1')).toBeNull()
    expect(moveTargetSource({ programId: 'p1', departmentId: 'd1' }, false, null)).toBeNull()
  })
})
