import { describe, expect, it } from 'vitest'

import { item } from '../../__tests__/rows'
import { assigneeNames, isOpen, openCount, priorityRank } from './common'
import { daysBetween, dayIn, formatDayShort, monthOf, shiftMonth } from './dates'
import { meetingView, shortName, upcomingViews } from './meetings'

describe('ortak türetimler', () => {
  it('açık görev ve sayaç', () => {
    expect(isOpen({ status: 'iade_edildi' })).toBe(true)
    expect(isOpen({ status: 'tamamlandi' })).toBe(false)
    expect(
      openCount({
        total: 10,
        by_status: {
          baslanmadi: 1,
          devam_ediyor: 2,
          onaya_sunuldu: 1,
          iade_edildi: 1,
          tamamlandi: 5,
        },
        overdue: 0,
        pending_date_requests: 0,
      }),
    ).toBe(5)
    expect(priorityRank('acil')).toBeLessThan(priorityRank('dusuk'))
    expect(
      assigneeNames(
        item({
          assignees: [
            { account_id: 'a', full_name: 'Ali' },
            { account_id: 'b', full_name: null },
          ],
        }),
      ),
    ).toEqual(['Ali'])
  })
})

describe('tarih yardımcıları', () => {
  it('biçim, fark, ay kaydırma, kurulum günü', () => {
    expect(formatDayShort('2026-10-20')).toBe('20.10')
    expect(formatDayShort('bozuk')).toBe('bozuk')
    expect(daysBetween('2026-10-21', '2026-10-25')).toBe(4)
    expect(daysBetween('2026-10-21', 'x')).toBeNull()
    expect(monthOf('2026-10-21')).toBe('2026-10')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    // 23:30 UTC = İstanbul'da ertesi gün 02:30.
    expect(dayIn('Europe/Istanbul', new Date('2026-10-20T23:30:00Z'))).toBe('2026-10-21')
    expect(dayIn('Geçersiz/Dilim', new Date('2026-10-20T23:30:00Z'))).toBe('2026-10-21')
  })
})

describe('toplantı satırı (E-K1-35, E-Ü1-29)', () => {
  const meeting = (over: Record<string, unknown> = {}) => ({
    meeting_id: 'm1',
    program_id: 'p1',
    title: 'Hidrofor teslim kontrolü',
    meeting_date: '2026-10-21T12:30:00Z',
    owner_department_id: 'd2',
    departments: [
      { department_id: 'd1', department_name: 'Altyapı ve tesisat' },
      { department_id: 'd2', department_name: 'Sistem' },
    ],
    members_included: true,
    invite_mode: 'coordinatorship' as const,
    place: null,
    created_at: '',
    updated_at: '',
    created_by_account_id: 'a',
    created_by_role: 'admin' as const,
    summary: { participant_count: 9 },
    ...over,
  })

  it('kurulum saat diliminde gün/ay/saat; sahip önde; kısaltma', () => {
    const view = meetingView(meeting() as never, 'Europe/Istanbul', '2026-10-21')
    expect(view).toMatchObject({
      day: '21',
      time: '15:30',
      today: true,
      participants: 9,
      membersIncluded: true,
    })
    expect(view.month).toBe('EKİ')
    expect(view.units.map((u) => [u.short, u.owner])).toEqual([
      ['SİS', true],
      ['AVT', false],
    ])
    expect(shortName('Sistem koordinatörlüğü')).toBe('SK')
  })

  it('özet yoksa katılımcı sayısı yok; en yakın önde ve sınırlı', () => {
    expect(
      meetingView(meeting({ summary: undefined }) as never, 'Europe/Istanbul', '2026-10-22')
        .participants,
    ).toBeNull()
    const list = [
      meeting({ meeting_id: 'b', meeting_date: '2026-10-25T09:00:00Z' }),
      meeting({ meeting_id: 'a', meeting_date: '2026-10-22T09:00:00Z' }),
      meeting({ meeting_id: 'c', meeting_date: '2026-10-30T09:00:00Z' }),
    ]
    expect(
      upcomingViews(list as never, 'Europe/Istanbul', '2026-10-21', 2).map((m) => m.meetingId),
    ).toEqual(['a', 'b'])
  })
})

describe('bitiş göstergesi', () => {
  it('geciken sunucudan; kalan gün kurulum gününe göre', async () => {
    const { dueView } = await import('./due')
    expect(
      dueView({ end_on: '2026-10-20', is_overdue: true, days_overdue: 1 }, '2026-10-21'),
    ).toEqual({
      date: '20.10',
      kind: 'late',
      days: 1,
    })
    expect(
      dueView({ end_on: '2026-10-21', is_overdue: false, days_overdue: 0 }, '2026-10-21').kind,
    ).toBe('today')
    expect(
      dueView({ end_on: '2026-10-24', is_overdue: false, days_overdue: 0 }, '2026-10-21'),
    ).toMatchObject({
      kind: 'left',
      days: 3,
    })
    expect(
      dueView({ end_on: 'bozuk', is_overdue: false, days_overdue: 0 }, '2026-10-21').kind,
    ).toBe('unknown')
  })
})
