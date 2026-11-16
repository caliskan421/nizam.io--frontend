import { describe, expect, it } from 'vitest'

import { coordinatorText, messageLine, myUnits, type MyUnitSource } from './units'

const row = (over: Partial<MyUnitSource> = {}): MyUnitSource => ({
  program_id: 'p1',
  department_id: 'd1',
  display_name: 'Altyapı ve tesisat',
  department_code: 'ALT',
  coordinators: [{ full_name: 'Kadir Özbek' }],
  ...over,
})

describe('Ü1 birim kaynağı (BE-141)', () => {
  it('yalnız seçili programın birimleri; aynı birim bir kez; kod ve koordinatör adları', () => {
    const units = myUnits(
      [
        row(),
        row({ department_id: 'd1', department_code: 'XXX' }),
        row({ program_id: 'p2', department_id: 'd9' }),
        row({ department_id: 'd2', department_code: null, coordinators: [] }),
      ],
      'p1',
    )
    expect(units).toEqual([
      {
        departmentId: 'd1',
        displayName: 'Altyapı ve tesisat',
        code: 'ALT',
        coordinators: ['Kadir Özbek'],
      },
      { departmentId: 'd2', displayName: 'Altyapı ve tesisat', code: null, coordinators: [] },
    ])
  })

  it('ad null/boş koordinatör atlanır; alan yoksa boş (ad ve e-posta uydurulmaz)', () => {
    const [unit] = myUnits(
      [row({ coordinators: [{ full_name: null }, { full_name: '  ' }, { full_name: 'Ayşe' }] })],
      'p1',
    )
    expect(unit!.coordinators).toEqual(['Ayşe'])
    const [none] = myUnits([row({ coordinators: undefined, department_code: ' ' })], 'p1')
    expect(none).toMatchObject({ coordinators: [], code: null })
  })

  it('metinler: tek/çok koordinatör; ad yoksa null', () => {
    expect(coordinatorText({ coordinators: ['Kadir'] })).toBe('Koordinatör: Kadir')
    expect(coordinatorText({ coordinators: ['Kadir', 'Ayşe'] })).toBe('Koordinatörler: Kadir, Ayşe')
    expect(coordinatorText({ coordinators: [] })).toBeNull()
    expect(messageLine({ coordinators: ['Kadir'], displayName: 'Altyapı' })).toBe('Kadir · Altyapı')
    expect(messageLine({ coordinators: [], displayName: 'Altyapı' })).toBeNull()
    expect(messageLine(null)).toBeNull()
  })
})
