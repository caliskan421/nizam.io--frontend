import { describe, expect, it } from 'vitest'

import { TASKS_STATUS_FILTERS } from '@/modules/work/public'

import { countsFromDashboard, countsFromItems, kpiCards, percent } from './kpi'
import type { DashboardReport, KpiItem } from './types'

const item = (status: KpiItem['status'], over: Partial<KpiItem> = {}): KpiItem => ({
  status,
  is_overdue: false,
  assignee_account_ids: ['acc-1'],
  ...over,
})

const byKey = (cards: ReturnType<typeof kpiCards>) =>
  Object.fromEntries(cards.map((c) => [c.key, c]))

describe('KPI sayımı — K/Ü (istemci, E-01-04…07)', () => {
  const items = [
    item('baslanmadi'),
    item('devam_ediyor', { is_overdue: true }),
    item('onaya_sunuldu'),
    item('iade_edildi', { is_overdue: true }),
    item('tamamlandi'),
    // Tamamlanmış geç görev gecikmeye sayılmaz (E-01-06).
    item('tamamlandi', { is_overdue: true }),
  ]

  it('5 durum: iade açık sayılır, onayda değil; tamamlanmış geç görev gecikmede değil', () => {
    expect(countsFromItems(items)).toEqual({
      total: 6,
      completed: 2,
      open: 4,
      overdue: 2,
      pending: 1,
    })
  })

  it('"bana atananlar": yalnız assignee_account_ids ∋ me', () => {
    const mixed = [
      item('devam_ediyor', { assignee_account_ids: ['acc-2'] }),
      item('onaya_sunuldu', { assignee_account_ids: ['acc-2', 'acc-1'] }),
      item('tamamlandi', { assignee_account_ids: [] }),
    ]
    expect(countsFromItems(mixed, 'acc-1')).toEqual({
      total: 1,
      completed: 0,
      open: 1,
      overdue: 0,
      pending: 1,
    })
    expect(countsFromItems(mixed).total).toBe(3)
  })
})

describe('KPI sayımı — Admin (sunucu sayaçları)', () => {
  it('reportDashboard alanları birebir', () => {
    const report = {
      total_tasks: 79,
      completed_tasks: 39,
      active_tasks: 40,
      overdue_tasks: 15,
      pending_approvals: 3,
    } as DashboardReport
    expect(countsFromDashboard(report)).toEqual({
      total: 79,
      completed: 39,
      open: 40,
      overdue: 15,
      pending: 3,
    })
  })
})

describe('KPI kartları', () => {
  it('tasarım örneğiyle aynı türetme (79 / 39 / 40 / 15 / 3)', () => {
    const cards = byKey(kpiCards({ total: 79, completed: 39, open: 40, overdue: 15, pending: 3 }))
    expect(cards.completion).toMatchObject({
      value: '%49',
      note: '79 görevin 39’u bitti',
      bar: 49,
      tone: 'accent',
      status: 'tamamlandi',
    })
    expect(cards.open).toMatchObject({
      value: '40',
      note: '25 tanesi zamanında ilerliyor',
      bar: 51,
      status: null,
    })
    expect(cards.overdue).toMatchObject({
      value: '15',
      note: 'Açık görevlerin %38’i',
      bar: 38,
      danger: true,
      status: 'geciken',
    })
    // E-01-07: not satırı boş (öneri metni kodlanmaz); çubuk = onayda / açık.
    expect(cards.pending).toMatchObject({ value: '3', note: null, bar: 8, status: 'onaya_sunuldu' })
  })

  it('toplam 0 → "%0" ve nötr not; "0 görevin 0’ı" yazılmaz', () => {
    const cards = kpiCards({ total: 0, completed: 0, open: 0, overdue: 0, pending: 0 })
    expect(cards.map((c) => c.value)).toEqual(['%0', '0', '0', '0'])
    expect(cards.map((c) => c.note)).toEqual([
      'Henüz görev yok',
      'Henüz görev yok',
      'Henüz görev yok',
      null,
    ])
    expect(cards.every((c) => c.bar === 0)).toBe(true)
  })

  it('açık 0 (hepsi bitti) → Gecikmede nötr; yüzde payda 0 değil', () => {
    const cards = byKey(kpiCards({ total: 2, completed: 2, open: 0, overdue: 0, pending: 0 }))
    expect(cards.completion).toMatchObject({ value: '%100', note: '2 görevin 2’si bitti' })
    expect(cards.overdue!.note).toBe('Açık görev yok')
  })

  it('binlik ayırıcı tr-TR; süzgeç değerleri 03 katalog kümesinde', () => {
    const cards = byKey(
      kpiCards({ total: 1200, completed: 1000, open: 200, overdue: 0, pending: 0 }),
    )
    expect(cards.completion!.note).toBe('1.200 görevin 1.000’i bitti')
    for (const card of kpiCards({ total: 1, completed: 0, open: 1, overdue: 0, pending: 0 })) {
      if (card.status !== null) expect(TASKS_STATUS_FILTERS).toContain(card.status)
    }
  })

  it('yüzde sınırları', () => {
    expect(percent(1, 3)).toBe(33)
    expect(percent(2, 3)).toBe(67)
    expect(percent(5, 0)).toBe(0)
  })
})
