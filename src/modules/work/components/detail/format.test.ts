import { describe, expect, it } from 'vitest'

import { workItem } from '../../model/__tests__/harness'
import { WORK_ITEM_STATUSES } from '../../model/types'
import {
  formatDay,
  formatRange,
  instantDay,
  kickerText,
  personName,
  shortDay,
  STATUS_DOT,
  timelineEvents,
} from './format'

const TZ = 'Europe/Istanbul'

describe('tarih biçimleri', () => {
  it('gün GG.AA.YYYY; biçim dışı değer gösterilmez', () => {
    expect(formatDay('2026-07-25')).toBe('25.07.2026')
    expect(formatDay('25.07.2026')).toBeNull()
    expect(formatDay(undefined)).toBeNull()
  })

  it('aralık: aynı yılda "GG.AA → GG.AA.YYYY", farklı yılda iki tam tarih (E-03-49)', () => {
    expect(formatRange('2026-07-20', '2026-07-25')).toBe('20.07 → 25.07.2026')
    expect(formatRange('2026-12-30', '2027-01-04')).toBe('30.12.2026 → 04.01.2027')
    expect(formatRange('x', '2026-01-01')).toBeNull()
  })

  it('an kurulum saat diliminde güne iner (gece yarısı sınırı)', () => {
    expect(instantDay('2026-06-09T22:30:00Z', TZ)).toBe('2026-06-10')
    expect(instantDay('2026-06-09T22:30:00Z', 'UTC')).toBe('2026-06-09')
    expect(instantDay('bozuk', TZ)).toBeNull()
    expect(instantDay('2026-06-09T22:30:00Z', 'Yok/Dilim')).toBeNull()
  })

  it('kısa tarih "10 Haz" (tasarım rp-timeline)', () => {
    expect(shortDay('2026-06-10')).toBe('10 Haz')
    expect(shortDay('2026-07-05')).toBe('5 Tem')
    expect(shortDay(null)).toBeNull()
  })
})

describe('üst bilgi ve kişi', () => {
  it('kod öneki + statik sıra "—" (BE-005) · koordinatörlük; kodsuzda yalnız ad (E-03-41)', () => {
    expect(kickerText('MEK', 'Mekanik sistemler')).toBe('MEK-— · Mekanik sistemler')
    expect(kickerText(undefined, 'Mekanik sistemler')).toBe('Mekanik sistemler')
    expect(kickerText('', null)).toBe('')
  })

  it('ad null → "Bilinmeyen kişi"', () => {
    expect(personName(null)).toBe('Bilinmeyen kişi')
    expect(personName('Ayşe')).toBe('Ayşe')
  })

  it('her durumun noktası var; iade_edildi = back (P5)', () => {
    for (const status of WORK_ITEM_STATUSES) expect(STATUS_DOT[status]).toBeTruthy()
    expect(STATUS_DOT.iade_edildi).toBe('back')
    expect(STATUS_DOT.tamamlandi).toBe('done')
  })
})

describe('ilerleme çizgisi (E-03-51) — yalnız tarih alanlarından', () => {
  it('gecikmemiş açık görev: tanımlandı + planlanan başlangıç; gecikme olayı yok', () => {
    const events = timelineEvents(workItem({ created_at: '2026-06-10T08:00:00Z' }), TZ)
    expect(events.map((e) => e.key)).toEqual(['created', 'start'])
    expect(events[0]).toMatchObject({ text: 'Görev tanımlandı', when: '10 Haz', tone: 'done' })
    expect(events[1]).toMatchObject({ text: 'Planlanan başlangıç', when: '1 Kas', tone: 'doing' })
  })

  it('gecikmiş: plan bitişi geçti + "‹n› gündür gecikmede" bugün, kırmızı (sunucu bayrağı)', () => {
    const item = workItem({ is_overdue: true, days_overdue: 88, end_on: '2026-07-25' })
    const events = timelineEvents(item, TZ)
    expect(events.map((e) => e.key)).toEqual(['created', 'start', 'endPassed', 'overdue'])
    expect(events[2]).toMatchObject({ text: 'Plan bitişi geçti', when: '25 Tem', tone: 'late' })
    expect(events[3]).toMatchObject({
      text: '88 gündür gecikmede',
      when: 'bugün',
      alert: true,
    })
  })

  it('bayrak yoksa istemci tarih hesabı yapmaz; tamamlanma completed_on’dan', () => {
    const item = workItem({
      end_on: '2000-01-01',
      completed_on: '2026-11-08',
      status: 'tamamlandi',
    })
    const events = timelineEvents(item, TZ)
    expect(events.map((e) => e.key)).toEqual(['created', 'start', 'completed'])
    expect(events[2]).toMatchObject({ text: 'Görev tamamlandı', when: '8 Kas' })
  })

  it('biçim dışı tarih olayı düşer (uydurma yok)', () => {
    const events = timelineEvents(workItem({ created_at: 'bozuk', start_on: '' }), TZ)
    expect(events).toEqual([])
  })
})
