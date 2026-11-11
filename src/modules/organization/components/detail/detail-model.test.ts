import { describe, expect, it } from 'vitest'

import type { WorkItem } from '@/modules/work/public'

import { rosterMember } from '../../__tests__/harness'
import type { CoordinatorshipStat, DashboardReport } from '../../model/types'
import { stat, workItem } from './__tests__/detail-harness'
import {
  attentionRows,
  badgeText,
  kpiCells,
  longestOverdue,
  possessiveSuffix,
  seasonAverage,
  teamOrder,
  teamTiles,
} from './detail-model'

const item = (o: Record<string, unknown> = {}) => workItem(o) as unknown as WorkItem
const s = (o: Record<string, unknown> = {}) => stat('d1', o) as unknown as CoordinatorshipStat
const dash = (completed: number, total: number) =>
  ({ completed_tasks: completed, total_tasks: total }) as unknown as DashboardReport

describe('kod rozeti (E-08-28/51)', () => {
  it('kod varsa kod, yoksa ilk iki sözcüğün baş harfleri (tr büyük harf)', () => {
    expect(badgeText('Altyapı ve tesisat', 'ALT')).toBe('ALT')
    expect(badgeText('idari işler birimi', null)).toBe('İİ')
    expect(badgeText('  Şasi  ', null)).toBe('Ş')
  })
})

describe('Türkçe iyelik eki', () => {
  it.each([
    [7, '’si'],
    [1, '’i'],
    [2, '’si'],
    [3, '’ü'],
    [4, '’ü'],
    [6, '’sı'],
    [9, '’u'],
    [10, '’u'],
    [20, '’si'],
    [30, '’u'],
    [40, '’ı'],
    [60, '’ı'],
    [100, '’ü'],
    [1000, '’i'],
    [0, '’ı'],
  ])('%i → %s', (n, suffix) => {
    expect(possessiveSuffix(n)).toBe(suffix)
  })
})

describe('KPI hücreleri (E-08-64…69)', () => {
  const full = { items: [] as WorkItem[], complete: true }

  it('açık = toplam − biten; not Türkçe ekli', () => {
    const cells = kpiCells({ stat: s(), dashboard: dash(41, 100), work: full, workLoading: false })
    expect(cells.map((c) => c.key)).toEqual([
      'open',
      'overdue',
      'completion',
      'dateRequest',
      'archive',
    ])
    expect(cells[0]).toMatchObject({ value: '5', note: '12 görevin 7’si bitti' })
  })

  it('tamamlanma 0–100 ölçeği yuvarlanır; sezon ortalaması rapordan', () => {
    const cells = kpiCells({
      stat: s({ completion_rate: 33.6 }),
      dashboard: dash(1, 3),
      work: full,
      workLoading: false,
    })
    expect(cells[2]).toMatchObject({ value: '%34', note: 'Sezon ortalaması %33' })
    expect(seasonAverage(dash(0, 0))).toBeNull()
    expect(seasonAverage(null)).toBeNull()
  })

  it('geciken: sayı rapordan (tehlike rengi), en uzun gecikme listeden', () => {
    const items = [item({ is_overdue: true, days_overdue: 12 }), item({ days_overdue: 50 })]
    const cells = kpiCells({
      stat: s(),
      dashboard: null,
      work: { items, complete: true },
      workLoading: false,
    })
    expect(cells[1]).toMatchObject({ value: '3', note: 'En uzunu 12 gün', danger: true })
    expect(longestOverdue(items)).toBe(12)
    const none = kpiCells({
      stat: s({ overdue_tasks: 0 }),
      dashboard: null,
      work: full,
      workLoading: false,
    })
    expect(none[1]).toMatchObject({ value: '0', note: 'Geciken görev yok', danger: false })
  })

  it('liste tamamlanmadıysa liste kaynaklı notlar yaklaşık etiketli; "yok" yazılmaz', () => {
    const partial = { items: [item({ is_overdue: true, days_overdue: 4 })], complete: false }
    const cells = kpiCells({ stat: s(), dashboard: null, work: partial, workLoading: false })
    expect(cells[1]!.note).toBe('En uzunu 4 gün · yüklenen kayıtlar içinde')
    expect(cells[3]!.note).toBe('')
    const empty = kpiCells({
      stat: s(),
      dashboard: null,
      work: { items: [], complete: false },
      workLoading: false,
    })
    expect(empty[1]!.note).toBe('')
  })

  it('tarih talebi: sayı + ilk görev başlığı; liste yüklenirken "—"', () => {
    const pending = { request_id: 'r', new_start_on: '2026-01-01', new_end_on: '2026-01-02' }
    const items = [
      item({ title: 'X', pending_date_request: pending }),
      item({ pending_date_request: pending }),
    ]
    const cells = kpiCells({
      stat: s(),
      dashboard: null,
      work: { items, complete: true },
      workLoading: false,
    })
    expect(cells[3]).toMatchObject({ value: '2', note: 'X' })
    const loading = kpiCells({ stat: s(), dashboard: null, work: full, workLoading: true })
    expect(loading[3]!.value).toBe('—')
  })

  it('rapor satırı yoksa değerler "—"; arşiv hücresi F5 devre dışı', () => {
    const cells = kpiCells({ stat: null, dashboard: null, work: full, workLoading: false })
    expect(cells.slice(0, 3).map((c) => c.value)).toEqual(['—', '—', '—'])
    expect(cells[4]).toMatchObject({ value: '—', note: 'F5’te', disabled: true })
  })
})

describe('Dikkat gerektirenler (E-08-83)', () => {
  it('yalnız geciken; days_overdue azalan; ilk 3; kod + atananlar + tarih talebi', () => {
    const pending = { request_id: 'r', new_start_on: '2026-01-01', new_end_on: '2026-01-02' }
    const rows = attentionRows(
      [
        item({ title: 'a', is_overdue: true, days_overdue: 1 }),
        item({
          title: 'b',
          is_overdue: true,
          days_overdue: 30,
          assignees: [
            { account_id: 'x', full_name: 'Ayşe' },
            { account_id: 'y', full_name: null },
          ],
        }),
        item({ title: 'c', days_overdue: 99 }),
        item({ title: 'd', is_overdue: true, days_overdue: 7, pending_date_request: pending }),
        item({ title: 'e', is_overdue: true, days_overdue: 3 }),
      ],
      'ALT',
    )
    expect(rows.map((r) => r.title)).toEqual(['b', 'd', 'e'])
    expect(rows[0]).toMatchObject({ who: 'ALT · Ayşe', late: '30 gün gecikti' })
    expect(rows[1]!.who).toBe('ALT · tarih talebi var')
  })
})

describe('Ekip kutucukları (E-08-81)', () => {
  const members = [
    rosterMember('u1', 'Zeki', 'uye'),
    rosterMember('u2', 'Ceren', 'koordinator'),
    rosterMember('u3', 'Çiğdem', 'uye'),
    rosterMember('u4', 'Ahmet', 'koordinator'),
  ] as never

  it('koordinatörler önce, sonra ad (tr)', () => {
    expect(teamOrder(members).map((m) => m.account_id)).toEqual(['u4', 'u2', 'u3', 'u1'])
  })

  it('kesme sınırı ve açık iş sayısı (atanan yüklemi, tamamlanan hariç)', () => {
    const items = [
      item({ assignee_account_ids: ['u1'] }),
      item({ assignee_account_ids: ['u1'], status: 'tamamlandi' }),
      item({ assignee_account_ids: ['u3', 'u1'] }),
    ]
    const tiles = teamTiles(members, items, 3)
    expect(tiles.map((t) => [t.accountId, t.coordinator, t.open])).toEqual([
      ['u4', true, 0],
      ['u2', true, 0],
      ['u3', false, 1],
    ])
    expect(teamTiles(members, items).find((t) => t.accountId === 'u1')!.open).toBe(2)
  })
})
