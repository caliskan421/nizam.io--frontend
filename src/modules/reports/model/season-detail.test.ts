import { describe, expect, it } from 'vitest'

import { seasonFixture } from '../__tests__/fixtures'
import { activityExtras, shiftDays, topRequested } from './season-extras'
import { detailCards, fileGroups, meetingCards, noteFlag } from './season-detail'
import { departmentSections } from './season-view'
import type { SeasonReport } from './types'

const TZ = 'Europe/Istanbul'
const season = seasonFixture()
const alt = () => departmentSections(season, () => null).find((s) => s.id === 'd1')!

describe('görev detay kartları (BE-136)', () => {
  it('yalnız içeriği olan görevler; kod, durum, tarih, atananlar, bağımlılık, not, talep, dosya', () => {
    const cards = detailCards(alt(), season, TZ)
    expect(cards.map((c) => c.id)).toEqual(['w1'])
    const [card] = cards
    expect(card).toMatchObject({
      label: 'ALT-7',
      status: 'devam_ediyor',
      start: '01.09.2026',
      end: '17.10.2026',
      plan: '30.09.2026',
      lateKind: 'overdue',
      lateDays: 4,
      assignees: ['Bahar Kılıç'],
      noteCount: 2,
    })
    expect(card!.dependencies).toEqual([
      { label: 'ALT-3', title: 'Atık su hattı', status: 'tamamlandi' },
    ])
    expect(card!.notes).toEqual([
      {
        no: '01',
        at: '09.10.2026 11:20',
        author: 'Bahar Kılıç',
        content: 'Kesişim çıktı; kazı durdu.',
        flag: null,
        shared: false,
      },
    ])
    expect(card!.requests[0]).toMatchObject({
      from: '17.10.2026',
      to: '24.10.2026',
      status: 'pending',
      by: 'Bahar Kılıç',
      at: '16.10.2026',
      reason: 'taşeron gecikmesi',
    })
    expect(card!.files.map((f) => f.name)).toEqual(['plan-v3.pdf', 'IMG_1042.jpg'])
    expect(card!.files[0]!.meta).toBe('Planlar · 3,0 MB · Bahar Kılıç')
  })

  it('detail null (details bölümü seçilmedi) ya da içeriksiz görev kart üretmez', () => {
    const bare = {
      ...season,
      tasks: season.tasks.map((t) => ({ ...t, detail: null, file_count: 0 })),
    } as SeasonReport
    expect(detailCards(departmentSections(bare, () => null)[0]!, bare, TZ)).toEqual([])
    const empty = {
      ...season,
      tasks: season.tasks.map((t) => ({
        ...t,
        file_count: 0,
        detail: { description: '  ', dependencies: [], recent_notes: [], date_requests: [] },
      })),
    } as SeasonReport
    expect(detailCards(departmentSections(empty, () => null)[0]!, empty, TZ)).toEqual([])
  })

  it('bağımlılık kodu yoksa başlık etiketi kullanılır (kod uydurulmaz)', () => {
    const noCode = {
      ...season,
      tasks: season.tasks.map((t) =>
        t.detail
          ? {
              ...t,
              detail: {
                ...t.detail,
                dependencies: [
                  { code: null, status: 'baslanmadi', title: 'Kodsuz', work_item_id: 'z' },
                ],
              },
            }
          : t,
      ),
    }
    const section = departmentSections(noCode, () => null).find((x) => x.id === 'd1')!
    const [card] = detailCards(section, noCode, TZ)
    expect(card?.dependencies[0]?.label).toBe('Kodsuz')
  })
})

describe('toplantı kartları ve dosya grupları (BE-136)', () => {
  it('toplantı: sahip ya da dahil her bölümde; diğer bölümler silinmiş işaretiyle', () => {
    const forAlt = meetingCards('d1', season, TZ)
    expect(forAlt).toHaveLength(1)
    expect(forAlt[0]).toMatchObject({
      date: '14.10.2026',
      time: '14:00',
      agendaChecked: 4,
      agendaTotal: 6,
      participants: 5,
      notes: 5,
      converted: 1,
      others: [{ name: 'Operasyon', deleted: true }],
    })
    expect(meetingCards('d2', season, TZ)[0]!.others).toEqual([
      { name: 'Altyapı ve tesisat', deleted: false },
    ])
    expect(meetingCards('dx', season, TZ)).toEqual([])
  })

  it('dosyalar: etikete göre (Türkçe sıra), etiketsiz sonda; grup toplamı; görev kodu', () => {
    const groups = fileGroups('d1', season, TZ)
    expect(groups.map((g) => [g.tag, g.count, g.size])).toEqual([
      ['Planlar', 1, '3,0 MB'],
      [null, 1, '1,0 MB'],
    ])
    expect(groups[0]!.rows[0]).toMatchObject({
      name: 'plan-v3.pdf',
      taskLabel: 'ALT-7',
      by: 'Bahar Kılıç',
      date: '12.10.2026',
    })
    expect(fileGroups('d2', season, TZ)).toEqual([])
  })
})

describe('genel bölüm ek türetimleri (BE-136)', () => {
  it('ortalama kayma: bir ondalık, virgüllü; yoksa null', () => {
    expect(shiftDays(season)).toBe('4,2')
    const none = {
      date_change_stats: { ...season.date_change_stats, average_shift_days: null },
    } as SeasonReport
    expect(shiftDays(none)).toBeNull()
  })

  it('en çok talep alan görevler sunucu sırasıyla', () => {
    expect(topRequested(season)).toEqual([
      { id: 'w1', code: 'ALT-7', title: 'Kablo kanalı kazısı', count: 2 },
    ])
  })

  it('aktivite dönem toplamları: not/dosya/talep; hepsi 0 ise null', () => {
    expect(activityExtras(season)).toEqual({ notes: 9, files: 3, requests: 1 })
    const zero = {
      monthly_activity: season.monthly_activity.map((m) => ({
        ...m,
        notes: 0,
        files: 0,
        date_requests: 0,
      })),
    } as SeasonReport
    expect(activityExtras(zero)).toBeNull()
  })
})

describe('not bayrağı', () => {
  it('bilinen bayraklar korunur; null ve gelecekteki bilinmeyen değer rozet üretmez', () => {
    for (const flag of ['urgent', 'blocker', 'question', 'info']) expect(noteFlag(flag)).toBe(flag)
    for (const flag of [null, undefined, '', 'yeni-bayrak']) expect(noteFlag(flag)).toBeNull()
  })
})
