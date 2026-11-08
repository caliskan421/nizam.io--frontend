import { describe, expect, it } from 'vitest'

import { workItem } from '../../model/__tests__/harness'
import type { WorkItem } from '../../model/types'
import {
  foldTr,
  hasDateRequest,
  inTab,
  matchesSearch,
  requestDepartmentIds,
  sortItems,
  tabCounts,
  uniqueAssigneeCount,
} from './rows'

const item = (over: Partial<WorkItem>) => workItem(over) as WorkItem
const pending = { request_id: 'r1', new_start_on: '2026-11-01', new_end_on: '2026-11-20' }

describe('istemci arama (BE-004, GAP-036)', () => {
  it('Türkçe katlama: İ/ı', () => {
    expect(foldTr('İSTANBUL')).toBe('istanbul')
    expect(foldTr('ISPARTA')).toBe('ısparta')
    const row = item({ title: 'İzmir Işık Planı' })
    expect(matchesSearch(row, 'izmir', null)).toBe(true)
    expect(matchesSearch(row, 'IŞIK', null)).toBe(true)
    expect(matchesSearch(row, 'isik', null)).toBe(false)
  })

  it('başlık + kısa kod öneki + atanan adı; boş arama her şeyi geçirir', () => {
    const row = item({
      title: 'Rapor',
      assignees: [
        { account_id: 'a1', full_name: 'Şule Öz' },
        { account_id: 'a2', full_name: null },
      ],
    })
    expect(matchesSearch(row, 'mek', 'MEK')).toBe(true)
    expect(matchesSearch(row, 'şule', null)).toBe(true)
    expect(matchesSearch(row, 'yok', 'MEK')).toBe(false)
    expect(matchesSearch(row, '  ', null)).toBe(true)
  })
})

describe('sekmeler ve sayaçlar (E-03-07/08, P5)', () => {
  const rows = [
    item({ work_item_id: 'a', status: 'baslanmadi', is_overdue: true }),
    item({ work_item_id: 'b', status: 'devam_ediyor', is_overdue: true }),
    item({ work_item_id: 'c', status: 'onaya_sunuldu' }),
    item({ work_item_id: 'd', status: 'iade_edildi' }),
    item({ work_item_id: 'e', status: 'tamamlandi', pending_date_request: pending }),
  ]

  it('5 durum + geciken (kesişen küme) süzmesi; iade_edildi kendi sekmesinde', () => {
    expect(rows.filter((r) => inTab(r, 'iade_edildi')).map((r) => r.work_item_id)).toEqual(['d'])
    expect(rows.filter((r) => inTab(r, 'geciken')).map((r) => r.work_item_id)).toEqual(['a', 'b'])
    expect(rows.filter((r) => inTab(r, 'tumu'))).toHaveLength(5)
  })

  it('sayaç = yüklenen satır sayımı', () => {
    expect(tabCounts(rows)).toEqual({
      tumu: 5,
      baslanmadi: 1,
      devam_ediyor: 1,
      onaya_sunuldu: 1,
      iade_edildi: 1,
      tamamlandi: 1,
      geciken: 2,
    })
  })

  it('tarih talebi: sayı, VE süzme için yüklem, band departmanları tekil', () => {
    const more = [
      ...rows,
      item({ work_item_id: 'f', department_id: 'd9', pending_date_request: pending }),
      item({ work_item_id: 'g', department_id: 'd2', pending_date_request: pending }),
    ]
    expect(more.filter(hasDateRequest)).toHaveLength(3)
    expect(more.filter((r) => hasDateRequest(r) && inTab(r, 'tamamlandi'))).toHaveLength(1)
    expect(requestDepartmentIds(more)).toEqual(['d2', 'd9'])
  })

  it('tekil kişi sayısı', () => {
    const people = [
      item({ assignees: [{ account_id: 'a1', full_name: 'A' }] }),
      item({
        assignees: [
          { account_id: 'a1', full_name: 'A' },
          { account_id: 'a2', full_name: null },
        ],
      }),
    ]
    expect(uniqueAssigneeCount(people)).toBe(2)
  })
})

describe('istemci sıralaması (E-03-16, BE-040)', () => {
  const rows = [
    item({
      work_item_id: 'w3',
      title: 'çizim',
      status: 'tamamlandi',
      end_on: '2026-11-02',
      created_at: '2026-01-03T00:00:00Z',
    }),
    item({
      work_item_id: 'w1',
      title: 'Ölçüm',
      status: 'baslanmadi',
      end_on: '2026-11-02',
      created_at: '2026-01-01T00:00:00Z',
    }),
    item({
      work_item_id: 'w2',
      title: 'cam',
      status: 'iade_edildi',
      end_on: '2026-11-01',
      created_at: '2026-01-02T00:00:00Z',
    }),
  ]
  const ids = (list: WorkItem[]) => list.map((r) => r.work_item_id)

  it('null → sunucu sırası (kopya, değiştirmez)', () => {
    const sorted = sortItems(rows, null)
    expect(ids(sorted)).toEqual(['w3', 'w1', 'w2'])
    expect(sorted).not.toBe(rows)
  })

  it('görev: tr sıralaması (c < ç < ö)', () => {
    expect(ids(sortItems(rows, { field: 'gorev', direction: 'artan' }))).toEqual(['w2', 'w3', 'w1'])
    expect(ids(sortItems(rows, { field: 'gorev', direction: 'azalan' }))).toEqual([
      'w1',
      'w3',
      'w2',
    ])
  })

  it('durum: enum sırası', () => {
    expect(ids(sortItems(rows, { field: 'durum', direction: 'artan' }))).toEqual(['w1', 'w2', 'w3'])
  })

  it('bitiş: eşitlikte created_at, work_item_id (kararlı)', () => {
    expect(ids(sortItems(rows, { field: 'bitis', direction: 'artan' }))).toEqual(['w2', 'w1', 'w3'])
    expect(ids(sortItems(rows, { field: 'bitis', direction: 'azalan' }))).toEqual([
      'w1',
      'w3',
      'w2',
    ])
  })
})
