import { describe, expect, it } from 'vitest'

import { counts, item } from '../../__tests__/rows'
import { approvalsOf, attentionOf, requestRows, unassignedOf } from './queues'
import { longestOverdue, unitSummary } from './summary'
import { assignedOpenCount, sliceOf, teamLoad } from './team'

const A = { account_id: 'a', full_name: 'Ayşe Kaya' }

describe('K1 birim özeti (E-K1-07…13)', () => {
  it('sayılar sunucu sayaçlarından; açık = toplam − tamamlanan; atanmamış istemci türetimi', () => {
    const items = [
      item({ status: 'devam_ediyor', assignee_account_ids: ['a'] }),
      item({ status: 'baslanmadi' }),
      item({ status: 'tamamlandi' }),
    ]
    const c = counts({
      by: { devam_ediyor: 5, baslanmadi: 2, onaya_sunuldu: 3, iade_edildi: 1, tamamlandi: 4 },
      overdue: 6,
      pending: 2,
    })
    const s = unitSummary(c, items, true)
    expect(s).toMatchObject({
      total: 15,
      open: 11,
      doing: 5,
      notStarted: 2,
      overdue: 6,
      pending: 3,
      returned: 1,
      unassigned: 1,
      dateRequests: 2,
      partial: false,
    })
  })

  it('küme tam değilse partial; en uzun gecikme yalnız açık gecikenlerden', () => {
    const items = [
      item({ is_overdue: true, days_overdue: 4 }),
      item({ is_overdue: true, days_overdue: 21 }),
      item({ status: 'tamamlandi', is_overdue: true, days_overdue: 99 }),
    ]
    expect(longestOverdue(items)).toBe(21)
    expect(longestOverdue([item()])).toBeNull()
    expect(unitSummary(counts(), items, false).partial).toBe(true)
  })

  it('iade notu: tek iade → atanan adı; birden çok → sayı; yok → none', () => {
    const one = [item({ status: 'iade_edildi', assignees: [A] })]
    expect(unitSummary(counts({ by: { iade_edildi: 1 } }), one, true).returnedNote).toEqual({
      kind: 'one',
      names: ['Ayşe Kaya'],
      count: 1,
    })
    expect(unitSummary(counts({ by: { iade_edildi: 3 } }), one, true).returnedNote.kind).toBe(
      'many',
    )
    expect(unitSummary(counts(), [], true).returnedNote.kind).toBe('none')
  })
})

describe('K1 kuyrukları', () => {
  it('onay bekleyenler ve atanmamışlar (tamamlananlar atanmamışa girmez)', () => {
    const items = [
      item({ status: 'onaya_sunuldu', end_on: '2026-10-20', assignee_account_ids: ['a'] }),
      item({ status: 'onaya_sunuldu', end_on: '2026-10-10', assignee_account_ids: ['a'] }),
      item({ status: 'baslanmadi' }),
      item({ status: 'tamamlandi' }),
      item({ status: 'devam_ediyor', assignee_account_ids: ['a'] }),
    ]
    expect(approvalsOf(items).map((i) => i.end_on)).toEqual(['2026-10-10', '2026-10-20'])
    expect(unassignedOf(items)).toHaveLength(1)
  })

  it('dikkat: en uzun gecikme önde; talep durumu (bekleyen / reddedilen)', () => {
    const late1 = item({ is_overdue: true, days_overdue: 3 })
    const late2 = item({
      is_overdue: true,
      days_overdue: 9,
      pending_date_request: {
        request_id: 'r1',
        new_start_on: '2026-11-01',
        new_end_on: '2026-11-09',
      },
    })
    const late3 = item({ is_overdue: true, days_overdue: 1 })
    const requests = [
      {
        request_id: 'q1',
        work_item_id: late1.work_item_id,
        status: 'rejected' as const,
        old_start_on: '',
        old_end_on: '',
        new_start_on: '',
        new_end_on: '',
      },
    ]
    const rows = attentionOf(
      [late1, late2, late3, item({ status: 'tamamlandi', is_overdue: true })],
      requests,
    )
    expect(rows.map((r) => r.item.work_item_id)).toEqual([
      late2.work_item_id,
      late1.work_item_id,
      late3.work_item_id,
    ])
    expect(rows[0]).toMatchObject({ requestPending: true, requestRejected: false })
    expect(rows[1]).toMatchObject({ requestPending: false, requestRejected: true })
    expect(rows[2]).toMatchObject({ requestPending: false, requestRejected: false })
  })

  it('tarih talepleri: bekleyenler önde, başlık yalnız yüklenen kümeden', () => {
    const known = item({ title: 'Bilinen görev' })
    const req = (id: string, work: string, status: 'pending' | 'approved' | 'rejected') => ({
      request_id: id,
      work_item_id: work,
      status,
      old_start_on: '2026-10-01',
      old_end_on: '2026-10-30',
      new_start_on: '2026-10-01',
      new_end_on: '2026-11-30',
    })
    const out = requestRows(
      [req('1', known.work_item_id, 'approved'), req('2', 'bilinmeyen', 'pending')],
      [known],
    )
    expect(out.rows.map((r) => r.request.request_id)).toEqual(['2', '1'])
    expect(out.rows.map((r) => r.title)).toEqual([null, 'Bilinen görev'])
    expect(out).toMatchObject({ pending: 1, decided: 1 })
  })
})

describe('K1 ekip yükü (E-K1-26…28)', () => {
  it('dilim önceliği: iade > geciken > onayda > devam; başlanmamış çizilmez', () => {
    expect(sliceOf({ status: 'iade_edildi', is_overdue: true })).toBe('back')
    expect(sliceOf({ status: 'devam_ediyor', is_overdue: true })).toBe('late')
    expect(sliceOf({ status: 'onaya_sunuldu', is_overdue: false })).toBe('review')
    expect(sliceOf({ status: 'devam_ediyor', is_overdue: false })).toBe('doing')
    expect(sliceOf({ status: 'baslanmadi', is_overdue: false })).toBeNull()
  })

  it('üye başına açık, kişi başı 4 görev = %100, sıra açık azalan sonra ad, atanmamış yüke girmez', () => {
    const members = [
      { accountId: 'a', fullName: 'Zeynep', coordinator: false },
      { accountId: 'b', fullName: 'Ali', coordinator: true },
      { accountId: 'c', fullName: 'Can', coordinator: false },
    ]
    const items = [
      item({ assignee_account_ids: ['a'], status: 'devam_ediyor' }),
      item({ assignee_account_ids: ['a', 'b'], status: 'onaya_sunuldu' }),
      item({
        assignee_account_ids: ['b'],
        status: 'devam_ediyor',
        is_overdue: true,
        days_overdue: 2,
      }),
      item({ assignee_account_ids: ['b'], status: 'iade_edildi' }),
      item({ assignee_account_ids: [], status: 'devam_ediyor' }),
      item({ assignee_account_ids: ['c'], status: 'tamamlandi' }),
    ]
    const rows = teamLoad(members, items, 'a')
    expect(rows.map((r) => [r.member.fullName, r.open])).toEqual([
      ['Ali', 3],
      ['Zeynep', 2],
      ['Can', 0],
    ])
    expect(rows[0]!.widths).toEqual({ doing: 0, review: 25, late: 25, back: 25 })
    expect(rows[1]).toMatchObject({ me: true, doing: 1, review: 1 })
    expect(assignedOpenCount(items)).toBe(4)
  })

  it('dilim genişlikleri toplam %100’ü aşmaz', () => {
    const items = Array.from({ length: 6 }, () => item({ assignee_account_ids: ['a'] }))
    const [row] = teamLoad([{ accountId: 'a', fullName: 'A', coordinator: false }], items, null)
    const sum = Object.values(row!.widths).reduce((x, y) => x + y, 0)
    expect(sum).toBeLessThanOrEqual(100)
    expect(row!.widths.doing).toBe(100)
  })
})
