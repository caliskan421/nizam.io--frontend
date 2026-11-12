import type { Meeting } from '@/modules/meetings/public'
import { describe, expect, it } from 'vitest'

import { accountRow, departmentRow, fold, meetingRow, taskRow, type RowContext } from './rows'

const CTX: RowContext = {
  timezone: 'Europe/Istanbul',
  departmentName: (id) => ({ d1: 'Mekanik', d2: 'Yazılım' })[id] ?? null,
}

function meeting(over: Partial<Meeting> = {}): Meeting {
  return {
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
      { department_id: 'd1', department_name: 'Mekanik (eski ad)' },
      { department_id: 'd9', department_name: 'Fuar' },
    ],
    place: 'Fuar alanı',
    deleted_at: '2026-11-11T09:00:00Z',
    deleted_by: { account_id: 'a7', full_name: 'Reha Koçak' },
    ...over,
  }
}

describe('E-12-66 görev satırı', () => {
  const row = taskRow(
    {
      work_item_id: 'w1',
      title: 'Saha pano montajı',
      department_id: 'd1',
      status: 'devam_ediyor',
      deleted_at: '2026-11-11T10:42:00Z',
      file_count: 2,
    },
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
      actor: null,
      departmentIds: ['d1'],
    })
  })

  it('silinmiş departmanın görevi: sözlükte yoksa "Bilinmeyen koordinatörlük"', () => {
    const orphan = taskRow(
      {
        ...{ work_item_id: 'w2', title: 'T', status: 's', deleted_at: '', file_count: 0 },
        department_id: 'dx',
      },
      CTX,
    )
    expect(orphan.subLine).toBe('Bilinmeyen koordinatörlük › Görevler')
    expect(orphan.deletedAt).toBeNull()
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

  it('arama metni başlık + silen + koordinatörlük adlarını kapsar', () => {
    const { searchText } = meetingRow(meeting(), CTX)
    expect(searchText).toContain('fuar')
    expect(searchText).toContain('reha')
    expect(searchText).toContain('mekanik')
  })
})

describe('E-12-68/69 koordinatörlük ve kullanıcı satırı', () => {
  it('koordinatörlük: ad, kod, kind; silinme zamanı boş olabilir', () => {
    const row = departmentRow({
      department_id: 'd5',
      name: 'Operasyon',
      code: 'OPE',
      kind: 'koordinatorluk',
      deleted_at: '',
    })
    expect(row).toMatchObject({
      kind: 'koordinatorluk',
      title: 'Operasyon',
      code: 'OPE',
      subLine: 'koordinatorluk',
      deletedAt: null,
      departmentIds: ['d5'],
    })
    expect(
      departmentRow({ department_id: 'd6', name: 'X', kind: '', deleted_at: 'x' }).subLine,
    ).toBe('')
  })

  it('kullanıcı: yalnız ad; silinme tarihi ve silen yok', () => {
    const row = accountRow({ account_id: 'a1', full_name: 'Gökhan Tanaydın' })
    expect(row).toMatchObject({
      kind: 'kullanici',
      key: 'kullanici:a1',
      title: 'Gökhan Tanaydın',
      subLine: '',
      deletedAt: null,
      actor: null,
    })
  })
})

describe('Türkçe katlama (E-12-20)', () => {
  it('İ/ı farkı gözetilir', () => {
    expect(fold('IŞIK')).toBe('ışık')
    expect(fold('İzmir')).toBe('izmir')
    expect(fold('ISIK')).not.toBe(fold('İŞİK'))
  })
})
