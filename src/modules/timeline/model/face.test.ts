import { describe, expect, it } from 'vitest'

import { ganttFace, ganttTarget } from './face'

describe('Gantt yüzü kapsamdan türetilir (K4)', () => {
  it.each([
    ['admin', 'd9', 'admin'],
    ['admin', null, 'admin'],
    ['coordinator', 'd1', 'coordinator'],
    ['member', 'd1', 'member'],
  ] as const)('mercek %s, birim %s → yüz %s', (lens, departmentId, face) => {
    expect(ganttFace({ programId: 'p1', departmentId, lens })).toBe(face)
  })

  it('Koordinatör/Üye yüzünde birim yoksa ya da mercek/program yoksa yüz yok (istek atılmaz)', () => {
    expect(ganttFace({ programId: 'p1', departmentId: null, lens: 'coordinator' })).toBeNull()
    expect(ganttFace({ programId: 'p1', departmentId: null, lens: 'member' })).toBeNull()
    expect(ganttFace({ programId: 'p1', departmentId: 'd1', lens: null })).toBeNull()
    expect(ganttFace({ programId: null, departmentId: 'd1', lens: 'admin' })).toBeNull()
  })

  it('hedef: Admin yüzünde departman yok (S2), diğerlerinde seçili birim (S3)', () => {
    expect(ganttTarget({ programId: 'p1', departmentId: 'dX', lens: 'admin' })).toEqual({
      programId: 'p1',
      departmentId: null,
    })
    expect(ganttTarget({ programId: 'p1', departmentId: 'd1', lens: 'coordinator' })).toEqual({
      programId: 'p1',
      departmentId: 'd1',
    })
    expect(ganttTarget({ programId: 'p1', departmentId: null, lens: 'member' })).toBeNull()
  })
})
