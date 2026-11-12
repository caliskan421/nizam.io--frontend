import { describe, expect, it } from 'vitest'

import type { Standing } from '@/shared/scope/standing-facts'

import {
  ARCHIVE_CAPABILITY_ACTIONS,
  ARCHIVE_CAPABILITY_SOURCES,
  archiveCapabilities,
} from './capabilities'

const row = (department: string, role: 'coordinator' | 'member', program = 'p1') => ({
  programId: program,
  programName: 'P',
  departmentId: department,
  displayName: department,
  role,
})
const who = (companyAdmin: boolean, rows: Standing['rows'] = []): Standing => ({
  accountId: 'me',
  fullName: 'Ben',
  email: 'me@example.org',
  companyAdmin,
  rows,
})

const admin = who(true)
const coordinator = who(false, [row('d1', 'coordinator')])
const member = who(false, [row('d1', 'member')])
const outsider = who(false)

const own = { departmentId: 'd1', uploadedByAccountId: 'me' }
const others = { departmentId: 'd1', uploadedByAccountId: 'baska' }
const foreign = { departmentId: 'd2', uploadedByAccountId: 'baska' }

describe('arşiv capability tablosu (üç rol × eylemler)', () => {
  it('her eylemin kaynağı yazılı', () => {
    expect(Object.keys(ARCHIVE_CAPABILITY_SOURCES).sort()).toEqual(
      [...ARCHIVE_CAPABILITY_ACTIONS].sort(),
    )
  })

  it.each([
    // [ad, standing, upload(d1), upload(d2), rename(own), rename(others), delete(own), delete(others)]
    ['şirket yöneticisi', admin, true, true, true, true, true, false],
    ['koordinatör (d1)', coordinator, true, false, true, true, true, false],
    ['üye (d1, atanmış)', member, true, false, true, false, true, false],
    ['ekip satırsız hesap', outsider, false, false, false, false, false, false],
  ])('%s', (_name, standing, up1, up2, renOwn, renOther, delOwn, delOther) => {
    const caps = archiveCapabilities(standing, 'p1')
    expect(caps.upload('d1')).toBe(up1)
    expect(caps.upload('d2')).toBe(up2)
    expect(caps.rename(own)).toBe(renOwn)
    expect(caps.rename(others)).toBe(renOther)
    expect(caps.delete(own)).toBe(delOwn)
    expect(caps.delete(others)).toBe(delOther)
  })

  it('ADR-0030: yönetici ekip satırı/atama olmadan yükler; yükleyen yönetici ekip satırı olmadan siler', () => {
    const caps = archiveCapabilities(admin, 'p1')
    expect(admin.rows).toHaveLength(0)
    expect(caps.upload('d9')).toBe(true)
    expect(caps.delete({ departmentId: 'd9', uploadedByAccountId: 'me' })).toBe(true)
    // ...ama başkasının dosyasını silemez; koordinatör de silemez.
    expect(caps.delete(foreign)).toBe(false)
    expect(archiveCapabilities(coordinator, 'p1').delete(others)).toBe(false)
  })

  it('üye atanmamışsa yükleyemez (assigned = false)', () => {
    expect(archiveCapabilities(member, 'p1').upload('d1', false)).toBe(false)
    expect(archiveCapabilities(member, 'p1').upload('d1', true)).toBe(true)
  })

  it('başka departmandaki dosya: yükleyen bile ekip satırı yoksa adlandıramaz/silemez', () => {
    const uploaderElsewhere = { departmentId: 'd2', uploadedByAccountId: 'me' }
    expect(archiveCapabilities(member, 'p1').rename(uploaderElsewhere)).toBe(false)
    expect(archiveCapabilities(member, 'p1').delete(uploaderElsewhere)).toBe(false)
    expect(archiveCapabilities(coordinator, 'p1').rename(foreign)).toBe(false)
  })

  it('rol seçili programdan okunur: başka programdaki satır yetki vermez', () => {
    const elsewhere = who(false, [row('d1', 'coordinator', 'p2')])
    const caps = archiveCapabilities(elsewhere, 'p1')
    expect(caps.upload('d1')).toBe(false)
    expect(caps.rename(own)).toBe(false)
  })

  it('klasör ZIP: ŞY her klasör; K yalnız kendi; Ü yalnız sanal klasör', () => {
    const ownFolder = { folder_id: 'd1', is_virtual: false }
    const otherFolder = { folder_id: 'd2', is_virtual: false }
    const mine = { folder_id: 'my-tasks', is_virtual: true }
    expect(archiveCapabilities(admin, 'p1').folderZip(otherFolder)).toBe(true)
    expect(archiveCapabilities(admin, 'p1').folderZip(mine)).toBe(true)
    const coord = archiveCapabilities(coordinator, 'p1')
    expect([
      coord.folderZip(ownFolder),
      coord.folderZip(otherFolder),
      coord.folderZip(mine),
    ]).toEqual([true, false, false])
    const mem = archiveCapabilities(member, 'p1')
    expect([mem.folderZip(ownFolder), mem.folderZip(otherFolder), mem.folderZip(mine)]).toEqual([
      false,
      false,
      true,
    ])
    expect(archiveCapabilities(outsider, 'p1').folderZip(mine)).toBe(false)
  })

  it('dönem ZIP yalnız ŞY; indir standing varken; standing yokken hepsi kapalı', () => {
    expect(archiveCapabilities(admin, 'p1').periodZip()).toBe(true)
    expect(archiveCapabilities(coordinator, 'p1').periodZip()).toBe(false)
    expect(archiveCapabilities(member, 'p1').periodZip()).toBe(false)
    const none = archiveCapabilities(null, null)
    expect(none.download()).toBe(false)
    expect(none.periodZip()).toBe(false)
    expect(none.upload('d1')).toBe(false)
    expect(none.rename(own)).toBe(false)
    expect(none.delete(own)).toBe(false)
    expect(none.folderZip({ folder_id: 'd1', is_virtual: false })).toBe(false)
    expect(none.canOpenUpload).toBe(false)
    expect(archiveCapabilities(admin, 'p1').canOpenUpload).toBe(true)
  })

  it('mercek girdi değildir: aynı olgu, aynı sonuç (P1)', () => {
    // Yetki yalnız (standing, program) ile hesaplanır; mercek parametresi yoktur.
    expect(archiveCapabilities.length).toBe(2)
  })
})
