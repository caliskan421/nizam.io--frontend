import { describe, expect, it } from 'vitest'

import { daysAgo, NOW, stat, view } from './__tests__/fixtures'
import {
  codeBadge,
  daysSince,
  flagOf,
  initialsOf,
  isQuiet,
  leadsOf,
  relativeDays,
} from './card-view'
import { coordsText } from './messages'

describe('kod rozeti (E-08-28)', () => {
  it('kodlu birimde kod, kodsuzda programdaki adın baş harfleri (tr büyük harf)', () => {
    expect(codeBadge({ code: 'MEK', displayName: 'Mekanik sistemler' })).toBe('MEK')
    expect(codeBadge({ code: null, displayName: 'idari işler' })).toBe('İİ')
    expect(initialsOf('  Tek  ')).toBe('T')
  })
})

describe('koordinatör yığını (E-08-32)', () => {
  it('en çok 3 avatar; satır "‹ilk› +n"', () => {
    const people = ['Ayşe Demir', 'Burak Can', 'Cem Er', 'Duru Ak'].map((full_name, i) => ({
      account_id: `a${i}`,
      full_name,
    }))
    const leads = leadsOf(view('d1', 'Birim', 'B1', stat('d1', { coordinators: people })))
    expect(leads?.avatars.map((a) => a.initials)).toEqual(['AD', 'BC', 'CE'])
    expect(leads?.line).toBe('Ayşe Demir +3')
  })

  it('tek koordinatörde yalnız ad; koordinatörsüz ya da rapor yoksa yığın yok', () => {
    expect(leadsOf(view('d1', 'Birim', null))?.line).toBe('Deniz Kaya')
    expect(leadsOf(view('d1', 'Birim', null, stat('d1', { coordinators: [] })))).toBeNull()
    expect(leadsOf(view('d1', 'Birim', null, null))).toBeNull()
  })
})

describe('sessiz (E-08-11) ve göreli zaman', () => {
  it('null ve 31 gün sessiz; 30 gün ve bugün sessiz değil', () => {
    expect(isQuiet(null, NOW)).toBe(true)
    expect(isQuiet('bozuk', NOW)).toBe(true)
    expect(isQuiet(daysAgo(31), NOW)).toBe(true)
    expect(isQuiet(daysAgo(30), NOW)).toBe(false)
    expect(isQuiet(daysAgo(0), NOW)).toBe(false)
  })

  it('gün farkı; gelecek tarih bugün sayılır', () => {
    expect(daysSince(daysAgo(5), NOW)).toBe(5)
    expect(daysSince(new Date(NOW + 3_600_000).toISOString(), NOW)).toBe(0)
    expect(relativeDays(0)).toBe('bugün')
    expect(relativeDays(1)).toBe('dün')
    expect(relativeDays(23)).toBe('23 gün önce')
  })
})

describe('durum bayrağı önceliği (E-08-37)', () => {
  it('koordinatörsüz > sessiz > normal', () => {
    const noLead = stat('d1', { coordinators: [], last_activity_at: null })
    expect(flagOf(view('d1', 'B', null, noLead), NOW)).toMatchObject({
      kind: 'no-lead',
      tone: 'gold',
      text: 'Koordinatör atanmamış',
    })
    expect(
      flagOf(view('d1', 'B', null, stat('d1', { last_activity_at: daysAgo(40) })), NOW),
    ).toMatchObject({
      kind: 'quiet',
      tone: 'danger',
      text: 'Sessiz · son görev hareketi 40 gün önce',
    })
    expect(
      flagOf(view('d1', 'B', null, stat('d1', { last_activity_at: null })), NOW),
    ).toMatchObject({ kind: 'quiet', text: 'Sessiz · görev hareketi yok' })
    expect(
      flagOf(view('d1', 'B', null, stat('d1', { last_activity_at: daysAgo(1) })), NOW),
    ).toMatchObject({ kind: 'active', tone: 'muted', text: 'Son görev hareketi dün' })
  })

  it('rapor satırı yoksa nötr; "dosya" metni hiçbir dalda yazılmaz', () => {
    expect(flagOf(view('d1', 'B', null, null), NOW).kind).toBe('unknown')
    for (const days of [null, 0, 1, 45]) {
      const s = stat('d1', { last_activity_at: days === null ? null : daysAgo(days) })
      expect(flagOf(view('d1', 'B', null, s), NOW).text).not.toMatch(/dosya/i)
    }
  })
})

describe('metin erişimi', () => {
  it('yer tutucular doldurulur; eksik parametre olduğu gibi kalır', () => {
    expect(coordsText('coordinatorships.footer.count', { shown: 2, total: 5 })).toBe(
      '2 / 5 koordinatörlük gösteriliyor',
    )
    expect(coordsText('coordinatorships.head.count')).toBe('{n} koordinatörlük')
  })
})
