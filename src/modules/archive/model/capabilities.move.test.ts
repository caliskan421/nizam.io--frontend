import { describe, expect, it } from 'vitest'

import type { Standing } from '@/shared/scope/standing-facts'

import { archiveCapabilities, moveTargetDepartments } from './capabilities'

const row = (department: string, role: 'coordinator' | 'member', program = 'p1') => ({
  programId: program,
  programName: 'P',
  departmentId: department,
  displayName: `Birim ${department}`,
  role,
})
const who = (companyAdmin: boolean, rows: Standing['rows'] = []): Standing => ({
  accountId: 'me',
  fullName: 'Ben',
  email: 'me@example.org',
  companyAdmin,
  rows,
})

describe('moveTargetDepartments (hedefte yükleme yetkisi, tek yüklem)', () => {
  it('seçili programdaki ekip satırı olan departmanlar; başka program ve yetkisizi içermez', () => {
    const standing = who(false, [
      row('d2', 'coordinator'),
      row('d1', 'coordinator'),
      row('d3', 'coordinator', 'p2'),
    ])
    expect(moveTargetDepartments(standing, 'p1').map((d) => d.departmentId)).toEqual(['d1', 'd2'])
  })

  it('her departman, `upload` yüklemiyle aynı kararı verir', () => {
    const standing = who(false, [row('d1', 'coordinator'), row('d2', 'member')])
    const caps = archiveCapabilities(standing, 'p1')
    for (const d of moveTargetDepartments(standing, 'p1')) {
      expect(caps.upload(d.departmentId)).toBe(true)
    }
    expect(caps.upload('d9')).toBe(false)
  })

  it('aynı departman iki satırda tek kez; yönetici/standing/program yoksa boş', () => {
    expect(
      moveTargetDepartments(who(false, [row('d1', 'coordinator'), row('d1', 'member')]), 'p1'),
    ).toHaveLength(1)
    expect(moveTargetDepartments(who(true, [row('d1', 'coordinator')]), 'p1')).toEqual([])
    expect(moveTargetDepartments(null, 'p1')).toEqual([])
    expect(moveTargetDepartments(who(false, [row('d1', 'coordinator')]), null)).toEqual([])
  })
})
