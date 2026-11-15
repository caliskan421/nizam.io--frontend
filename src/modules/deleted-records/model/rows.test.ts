import type { Meeting } from '@/modules/meetings/public'
import { describe, expect, it } from 'vitest'

import {
  makeMeetingDepartment,
  withDeletedAccountDefaults,
  withDeletedDepartmentDefaults,
  withDeletedTaskDefaults,
  withMeetingDefaults,
} from '@/shared/api/__tests__/defaults'

import { accountRow, departmentRow, meetingRow, taskRow, type RowContext } from './rows'

const CTX: RowContext = {
  timezone: 'Europe/Istanbul',
  departmentName: (id) => ({ d1: 'Mekanik', d2: 'Yazılım' })[id] ?? null,
}

function meeting(over: Partial<Meeting> = {}): Meeting {
  return withMeetingDefaults({
    meeting_id: 'm1',
    program_id: 'p1',
    title: 'Fuar yürüyüşü',
    meeting_date: '2026-10-24T07:00:00Z',
    created_at: '2026-10-01T07:00:00Z',
    updated_at: '2026-10-01T07:00:00Z',
    created_by_account_id: 'a1',
    created_by_role: 'admin',
    invite_mode: 'coordinatorship',
    members_included: false,
    owner_department_id: 'd1',
    departments: [
      makeMeetingDepartment({ department_id: 'd1', department_name: 'Mekanik (eski ad)' }),
      makeMeetingDepartment({ department_id: 'd9', department_name: 'Fuar' }),
    ],
    place: 'Fuar alanı',
    deleted_at: '2026-11-11T09:00:00Z',
    deleted_by: { account_id: 'a7', full_name: 'Reha Koçak' },
    ...over,
  })
}

describe('E-12-66 görev satırı', () => {
  const row = taskRow(
    withDeletedTaskDefaults({
      work_item_id: 'w1',
      title: 'Saha pano montajı',
      department_id: 'd1',
      status: 'devam_ediyor',
      deleted_at: '2026-11-11T10:42:00Z',
      file_count: 2,
    }),
    CTX,
  )

  it('alanlar yalnız liste öğesinden: başlık, alt satır, durum, dosya sayısı', () => {
    expect(row).toMatchObject({
      kind: 'gorev',
      id: 'w1',
      key: 'gorev:w1',
      title: 'Saha pano montajı',
      code: null,
      subLine: 'Mekanik › Görevler',
      status: 'devam_ediyor',
      fileCount: 2,
      // Silen bilgisi tutulmadan önce silinmiş görevde deleted_by null → ad boş.
      actor: { accountId: null, name: '' },
      departmentIds: ['d1'],
    })
  })

  it('silinmiş departmanın görevi: sözlükte yoksa "Bilinmeyen koordinatörlük"', () => {
    const orphan = taskRow(
      withDeletedTaskDefaults({
        ...{ work_item_id: 'w2', title: 'T', status: 's', deleted_at: '', file_count: 0 },
        department_id: 'dx',
      }),
      CTX,
    )
    expect(orphan.subLine).toBe('Bilinmeyen koordinatörlük › Görevler')
    expect(orphan.deletedAt).toBeNull()
  })
})

describe('E-12-47…52 görev ek alanları (BE-113)', () => {
  const full = withDeletedTaskDefaults({
    work_item_id: 'w1',
    title: 'T',
    department_id: 'd1',
    status: 'devam_ediyor',
    deleted_at: '2026-11-11T10:42:00Z',
    file_count: 2,
    assignees: [
      { account_id: 'a1', full_name: 'Reha Koçak' },
      { account_id: 'a2', full_name: null },
    ],
    subtask_counts: { total: 3, done: 1 },
    note_count: 5,
    pending_date_request: {
      request_id: 'r1',
      created_at: '2026-11-10T08:00:00Z',
      new_start_on: '2026-12-01',
      new_end_on: '2026-12-10',
    },
    deleted_by_department: true,
  })

  it('atananlar, yüzde (yuvarlanmış), alt görev/yorum/tarih talebi liste öğesinden', () => {
    expect(taskRow(full, CTX).task).toEqual({
      assignees: ['Reha Koçak', ''],
      progress: 33,
      subtasks: 3,
      notes: 5,
      dateRequest: true,
      byDepartment: true,
    })
  })

  it('koordinatörlüğüyle silinen görevin satırı "birlikte silindi" notu taşır', () => {
    expect(taskRow(full, CTX).subLine).toBe(
      'Mekanik › Görevler · koordinatörlükle birlikte silindi',
    )
    expect(taskRow({ ...full, deleted_by_department: false }, CTX).subLine).toBe(
      'Mekanik › Görevler',
    )
  })

  it('alt görev yoksa yüzde null (uydurulmaz); diğer türlerde task null', () => {
    const none = taskRow({ ...full, subtask_counts: { total: 0, done: 0 } }, CTX)
    expect(none.task?.progress).toBeNull()
    expect(meetingRow(meeting(), CTX).task).toBeNull()
  })
})

describe('E-12-67 toplantı satırı', () => {
  it('alt satır "tarih saat · sahip koordinatörlük"; silen deleted_by', () => {
    const row = meetingRow(meeting(), CTX)
    expect(row.subLine).toBe('24 Ekim 10:00 · Mekanik')
    expect(row.actor).toEqual({ accountId: 'a7', name: 'Reha Koçak' })
    expect(row.departmentIds).toEqual(['d1', 'd9'])
    expect(row.departmentNames).toEqual(['Mekanik', 'Fuar'])
    expect(row.place).toBe('Fuar alanı')
    expect(row.inviteMode).toBe('coordinatorship')
    expect(row.deletedAt).toBe('2026-11-11T09:00:00Z')
  })

  it('sözlükte olmayan koordinatörlük bağ adına düşer; eski kayıtta silen null → ad boş', () => {
    const row = meetingRow(meeting({ deleted_by: null, owner_department_id: 'd9' }), CTX)
    expect(row.subLine).toBe('24 Ekim 10:00 · Fuar')
    expect(row.actor).toEqual({ accountId: null, name: '' })
  })
})

describe('E-12-68/69 koordinatörlük ve kullanıcı satırı', () => {
  it('koordinatörlük: ad, kod, kind; silinme zamanı boş olabilir', () => {
    const row = departmentRow(
      withDeletedDepartmentDefaults({
        department_id: 'd5',
        name: 'Operasyon',
        code: 'OPE',
        kind: 'koordinatorluk',
        deleted_at: '',
      }),
    )
    expect(row).toMatchObject({
      kind: 'koordinatorluk',
      title: 'Operasyon',
      code: 'OPE',
      subLine: 'koordinatorluk',
      deletedAt: null,
      departmentIds: ['d5'],
    })
    expect(
      departmentRow(
        withDeletedDepartmentDefaults({
          department_id: 'd6',
          name: 'X',
          kind: '',
          deleted_at: 'x',
        }),
      ).subLine,
    ).toBe('')
  })

  it('kullanıcı: ad, ekipler, silinme tarihi ve şirket yöneticiliği (BE-118); silen deleted_by (BE-108)', () => {
    const team = (id: string, name: string) => ({
      department_id: id,
      display_name: name,
      program_id: 'p1',
      program_name: 'Program Bir',
      role: 'uye' as const,
    })
    const row = accountRow(
      withDeletedAccountDefaults({
        account_id: 'a1',
        full_name: 'Gökhan Tanaydın',
        deleted_at: '2026-11-11T14:30:00Z',
        deleted_by: { account_id: 'a7', full_name: 'Reha Koçak' },
        company_admin: true,
        teams: [team('d1', 'Mekanik'), team('d1', 'Mekanik'), team('d2', 'Yazılım')],
      }),
    )
    expect(row).toMatchObject({
      kind: 'kullanici',
      key: 'kullanici:a1',
      title: 'Gökhan Tanaydın',
      subLine: 'Mekanik, Yazılım',
      deletedAt: '2026-11-11T14:30:00Z',
      actor: { accountId: 'a7', name: 'Reha Koçak' },
      departmentIds: ['d1', 'd2'],
      departmentNames: ['Mekanik', 'Yazılım'],
      companyAdmin: true,
    })
  })

  it('kullanıcı: ekipsiz ve silinme anı okunamayan kayıtta alt satır boş, tarih null (sahte değer yok)', () => {
    const row = accountRow(
      withDeletedAccountDefaults({ account_id: 'a2', full_name: 'X', deleted_at: '' }),
    )
    expect(row).toMatchObject({ subLine: '', deletedAt: null, companyAdmin: false })
  })
})
