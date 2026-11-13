import { describe, expect, it } from 'vitest'

import type { Standing } from '@/shared/scope/standing-facts'

import {
  REPORT_CAPABILITY_ACTIONS,
  REPORT_CAPABILITY_SOURCES,
  reportCapabilities,
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

// İki kayıt: koordinatörün birimindeki (d1) ve başka birimdeki (d2) kayıt; toplantı d2 sahipli,
// d1 dahil (REPORTING-K07: herhangi biri yeter).
const own = { task: { departmentId: 'd1' }, meeting: { departmentIds: ['d2', 'd1'] } }
const foreign = { task: { departmentId: 'd2' }, meeting: { departmentIds: ['d2', 'd3'] } }

describe('rapor capability tablosu (üç rol × iki kayıt)', () => {
  it('her eylemin kaynağı yazılı', () => {
    expect(Object.keys(REPORT_CAPABILITY_SOURCES).sort()).toEqual(
      [...REPORT_CAPABILITY_ACTIONS].sort(),
    )
  })

  it.each([
    // [ad, standing, görev(own), görev(foreign), toplantı(own), toplantı(foreign)]
    ['şirket yöneticisi', admin, true, true, true, true],
    ['koordinatör (d1)', coordinator, true, false, true, false],
    ['üye (d1)', member, false, false, false, false],
  ])('%s: görev/toplantı PDF', (_name, standing, taskOwn, taskForeign, meetOwn, meetForeign) => {
    const caps = reportCapabilities(standing, 'p1')
    expect(caps.canExportTaskReport(own.task)).toBe(taskOwn)
    expect(caps.canExportTaskReport(foreign.task)).toBe(taskForeign)
    expect(caps.canExportMeetingReport(own.meeting)).toBe(meetOwn)
    expect(caps.canExportMeetingReport(foreign.meeting)).toBe(meetForeign)
  })

  it.each([
    ['şirket yöneticisi', admin, true],
    ['koordinatör', coordinator, false],
    ['üye', member, false],
  ])('%s: dönem, iş yükü ve iki önizleme yalnız yönetici', (_name, standing, expected) => {
    const caps = reportCapabilities(standing, 'p1')
    expect(caps.canExportSeason()).toBe(expected)
    expect(caps.canExportWorkload()).toBe(expected)
    expect(caps.canPreviewSeason()).toBe(expected)
    expect(caps.canPreviewMeeting()).toBe(expected)
  })

  it('mercek yetki değildir: kapsam yalnız standing olgusundan gelir (P1)', () => {
    // Fonksiyon mercek almaz; yönetici K merceğinde de (aynı olgular) her şeyi görür.
    const caps = reportCapabilities(admin, 'p1')
    expect(caps.canExportSeason()).toBe(true)
    expect(caps.canExportTaskReport(foreign.task)).toBe(true)
  })

  it('koordinatörlük yalnız seçili programda sayılır', () => {
    const other = who(false, [row('d1', 'coordinator', 'p2')])
    const caps = reportCapabilities(other, 'p1')
    expect(caps.canExportTaskReport(own.task)).toBe(false)
    expect(caps.canExportMeetingReport(own.meeting)).toBe(false)
    expect(reportCapabilities(other, 'p2').canExportTaskReport(own.task)).toBe(true)
  })

  it('standing yokken ya da program yokken hiçbir şey görünmez', () => {
    for (const caps of [reportCapabilities(null, 'p1'), reportCapabilities(coordinator, null)]) {
      expect(caps.canExportSeason()).toBe(false)
      expect(caps.canExportTaskReport(own.task)).toBe(false)
      expect(caps.canExportMeetingReport(own.meeting)).toBe(false)
    }
  })

  it('toplantıda hiç departman yoksa koordinatör göremez; yönetici görür', () => {
    expect(
      reportCapabilities(coordinator, 'p1').canExportMeetingReport({ departmentIds: [] }),
    ).toBe(false)
    expect(reportCapabilities(admin, 'p1').canExportMeetingReport({ departmentIds: [] })).toBe(true)
  })
})
