import { describe, expect, it } from 'vitest'

import { EMPTY_SELECTION, resolveScope, type ResolveInput, type ScopeSelection } from './resolve'
import { parseStanding, type ProgramOption } from './standing-facts'

const row = (program: string, department: string, role: string) => ({
  program_id: program,
  program_name: `Program ${program}`,
  department_id: department,
  display_name: `Birim ${department}`,
  role,
})

function input(
  opts: {
    admin?: boolean
    rows?: ReturnType<typeof row>[]
    programs?: ProgramOption[] | null
    membershipRequired?: boolean
    current?: Partial<ScopeSelection>
    remembered?: Partial<ScopeSelection>
  } = {},
): ResolveInput {
  return {
    standing: parseStanding(
      { account_id: 'a', email: 'e@x.test', full_name: 'A', company_admin: opts.admin ?? false },
      { departments: opts.rows ?? [] },
    ),
    programs: opts.programs ?? null,
    membershipRequired: opts.membershipRequired ?? false,
    current: { ...EMPTY_SELECTION, ...opts.current },
    remembered: { ...EMPTY_SELECTION, ...opts.remembered },
  }
}

const P = (id: string, name = id): ProgramOption => ({ programId: id, name, year: null })

describe('resolveScope', () => {
  it('membership_required → K7 "departman ataması bekleniyor", seçim yok', () => {
    expect(resolveScope(input({ membershipRequired: true }))).toEqual({
      kind: 'empty',
      selection: EMPTY_SELECTION,
      reason: 'membership_required',
    })
  })

  it('satırsız yönetici: tek program → admin merceği, departmansız kapsam', () => {
    expect(resolveScope(input({ admin: true, programs: [P('p1')] }))).toEqual({
      kind: 'ready',
      selection: { programId: 'p1', lens: 'admin', departmentId: null },
    })
  })

  it('görünür program yok → K7 no_program', () => {
    expect(resolveScope(input({ admin: true, programs: [] }))).toMatchObject({
      kind: 'empty',
      reason: 'no_program',
    })
  })

  it('çok program + hatırlanan yok → sessiz ilk seçim YOK, program seçici', () => {
    const r = resolveScope(input({ admin: true, programs: [P('p1'), P('p2')] }))
    expect(r).toEqual({ kind: 'selecting', selection: EMPTY_SELECTION, pending: 'program' })
  })

  it('hatırlanan geçerliyse kullanılır, geçersizse düşer', () => {
    const programs = [P('p1'), P('p2')]
    expect(
      resolveScope(
        input({ admin: true, programs, remembered: { programId: 'p2', lens: 'admin' } }),
      ),
    ).toMatchObject({ kind: 'ready', selection: { programId: 'p2', lens: 'admin' } })
    expect(
      resolveScope(input({ admin: true, programs, remembered: { programId: 'silinmis' } })),
    ).toMatchObject({ kind: 'selecting', pending: 'program' })
  })

  it('çoklu rol (yönetici + koordinatör): mercek seçici açılır; hatırlanan mercek kullanılır', () => {
    const rows = [row('p1', 'd1', 'koordinator')]
    expect(resolveScope(input({ admin: true, rows, programs: [P('p1')] }))).toEqual({
      kind: 'selecting',
      selection: { programId: 'p1', lens: null, departmentId: null },
      pending: 'lens',
    })
    expect(
      resolveScope(
        input({ admin: true, rows, programs: [P('p1')], remembered: { lens: 'coordinator' } }),
      ),
    ).toEqual({
      kind: 'ready',
      selection: { programId: 'p1', lens: 'coordinator', departmentId: 'd1' },
    })
  })

  it('koordinatör iki birimde: departman seçici; tek birimde otomatik', () => {
    const two = [row('p1', 'd1', 'koordinator'), row('p1', 'd2', 'koordinator')]
    expect(resolveScope(input({ rows: two, programs: [P('p1')] }))).toEqual({
      kind: 'selecting',
      selection: { programId: 'p1', lens: 'coordinator', departmentId: null },
      pending: 'department',
    })
    expect(resolveScope(input({ rows: [row('p1', 'd1', 'uye')] }))).toEqual({
      kind: 'ready',
      selection: { programId: 'p1', lens: 'member', departmentId: 'd1' },
    })
  })

  it('program değişince geçerli mercek korunur, birim yeni programda yoksa seçici', () => {
    const rows = [
      row('p1', 'd1', 'koordinator'),
      row('p2', 'd2', 'koordinator'),
      row('p2', 'd3', 'koordinator'),
    ]
    const r = resolveScope(
      input({
        rows,
        current: { programId: 'p2', lens: 'coordinator', departmentId: null },
        remembered: { programId: 'p1', lens: 'coordinator', departmentId: 'd1' },
      }),
    )
    expect(r).toEqual({
      kind: 'selecting',
      selection: { programId: 'p2', lens: 'coordinator', departmentId: null },
      pending: 'department',
    })
  })

  it('aynı departman iki programda: hatırlanan birim yeni programda da geçerliyse korunur', () => {
    const rows = [row('p1', 'd1', 'uye'), row('p2', 'd1', 'uye'), row('p2', 'd2', 'uye')]
    const r = resolveScope(
      input({
        rows,
        current: { programId: 'p2', lens: 'member' },
        remembered: { departmentId: 'd1' },
      }),
    )
    expect(r).toEqual({
      kind: 'ready',
      selection: { programId: 'p2', lens: 'member', departmentId: 'd1' },
    })
  })

  it('yetki kaybı: seçili birim satırlardan düştü → tek kalan otomatik', () => {
    const r = resolveScope(
      input({
        rows: [row('p1', 'd2', 'uye')],
        current: { programId: 'p1', lens: 'member', departmentId: 'd1' },
      }),
    )
    expect(r).toEqual({
      kind: 'ready',
      selection: { programId: 'p1', lens: 'member', departmentId: 'd2' },
    })
  })

  it('yetki kaybı: koordinatörlük düştü, üyelik kaldı → mercek yeniden çözülür', () => {
    const r = resolveScope(
      input({
        rows: [row('p1', 'd1', 'uye')],
        current: { programId: 'p1', lens: 'coordinator', departmentId: 'd1' },
      }),
    )
    expect(r).toEqual({
      kind: 'ready',
      selection: { programId: 'p1', lens: 'member', departmentId: 'd1' },
    })
  })
})
