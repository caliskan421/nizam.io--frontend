import { describe, expect, it } from 'vitest'

import {
  departmentTarget,
  listDepartmentFilter,
  locatedItems,
  resolveTarget,
  targetOf,
} from './target'

const admin = { programId: 'p1', departmentId: null, lens: 'admin' as const }
const coord = { programId: 'p1', departmentId: 'd1', lens: 'coordinator' as const }
const row = { work_item_id: 'w1', program_id: 'p1', department_id: 'd2' }

describe('kapsam hedefleri', () => {
  it('görevin kendi kapsamı', () => {
    expect(targetOf(row)).toEqual({ programId: 'p1', departmentId: 'd2' })
  })

  it('yeni görev hedefi: program + seçilen departman', () => {
    expect(departmentTarget(admin, 'd3')).toEqual({ programId: 'p1', departmentId: 'd3' })
    expect(departmentTarget(admin, null)).toBeNull()
    expect(departmentTarget({ programId: null, departmentId: null }, 'd3')).toBeNull()
  })

  it('liste department_id: Admin → süzgeç (tek değer), K/Ü → seçili birim (süzgeç yok sayılır)', () => {
    expect(listDepartmentFilter(admin, null)).toBeNull()
    expect(listDepartmentFilter(admin, 'd2')).toBe('d2')
    expect(listDepartmentFilter(coord, 'd9')).toBe('d1')
    expect(listDepartmentFilter({ ...coord, lens: 'member' }, null)).toBe('d1')
  })

  it("yalnız kimlikten hedef: liste satırı > K/Ü birimi > Admin'de null", () => {
    expect(resolveTarget('w1', admin, [row])).toEqual({ programId: 'p1', departmentId: 'd2' })
    expect(resolveTarget('w9', admin, [row])).toBeNull()
    expect(resolveTarget('w9', coord, [row])).toEqual({ programId: 'p1', departmentId: 'd1' })
    // Başka programın satırı kullanılmaz.
    expect(resolveTarget('w1', { ...admin, programId: 'p2' }, [row])).toBeNull()
  })
})

describe('önbellek verisinden görev satırları (W142 KUSUR 3)', () => {
  it('sonsuz liste sayfaları ve tek görev; sayaç ve bozuk biçimler boş', () => {
    const other = { ...row, work_item_id: 'w2', department_id: 'd3' }
    expect(locatedItems({ pages: [{ items: [row] }, { items: [other] }] })).toEqual([row, other])
    expect(locatedItems(row)).toEqual([row])
    expect(locatedItems({ total: 3, by_status: {} })).toEqual([])
    expect(locatedItems({ pages: [{ items: [{ title: 'x' }] }, null] })).toEqual([])
    expect(locatedItems(undefined)).toEqual([])
  })

  it('K/Ü merceğinde liste dışı görev: önbellek satırının birimi, seçili birimden önce gelir', () => {
    const cached = { ...row, work_item_id: 'w9', department_id: 'd2' }
    expect(resolveTarget('w9', coord, locatedItems({ pages: [{ items: [cached] }] }))).toEqual({
      programId: 'p1',
      departmentId: 'd2',
    })
  })
})
