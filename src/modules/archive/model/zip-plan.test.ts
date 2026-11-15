import { describe, expect, it } from 'vitest'

import { REPORT_PDF_DEPARTMENT_LIMIT, zipDate, zipPlan, zipSlug } from './zip-plan'

const dept = (name: string, files = 0, virtual = false) => ({
  name,
  file_count: files,
  is_virtual: virtual,
})

describe('zipSlug', () => {
  it('Türkçe harfler ASCII, ayraçlar tek tire', () => {
    expect(zipSlug('Şanlıurfa Teknofest')).toBe('Sanliurfa-Teknofest')
    expect(zipSlug('  Altyapı ve tesisat / Çevre!  ')).toBe('Altyapi-ve-tesisat-Cevre')
    expect(zipSlug('İĞÜŞÖÇ')).toBe('IGUSOC')
    expect(zipSlug('???')).toBe('')
  })
})

describe('zipDate', () => {
  it('kurulum saat diliminde YYYY-MM-DD', () => {
    const at = new Date('2026-10-20T22:30:00Z')
    expect(zipDate(at, 'Europe/Istanbul')).toBe('2026-10-21')
    expect(zipDate(at, 'UTC')).toBe('2026-10-20')
    expect(zipDate(at, null)).toBe('2026-10-21')
    expect(zipDate(at, 'Yok/Zone')).toBe('2026-10-21')
  })
})

describe('zipPlan', () => {
  it('kök ad + ada göre (tr-TR) numaralı departmanlar; dosya sayısı sunucudan', () => {
    const plan = zipPlan('Şanlıurfa Teknofest', '2026-10-21', [
      dept('Zemin', 4),
      dept('Çevre', 0),
      dept('Altyapı ve tesisat', 12),
    ])
    expect(plan.root).toBe('Sanliurfa-Teknofest-Donem-Arsivi-2026-10-21')
    expect(plan.departments).toEqual([
      { folder: '01-Altyapi-ve-tesisat', files: 12 },
      { folder: '02-Cevre', files: 0 },
      { folder: '03-Zemin', files: 4 },
    ])
    expect(plan.unitReports).toBe(true)
  })

  it('sanal klasör (üye) sayılmaz; ad boşsa yedek ad', () => {
    const plan = zipPlan('???', '2026-10-21', [dept('Görevlerim', 3, true), dept('!!!', 1)])
    expect(plan.root).toBe('Program-Donem-Arsivi-2026-10-21')
    expect(plan.departments).toEqual([{ folder: '01-Koordinatorluk', files: 1 }])
  })

  it('40 üstü departmanda birim raporu yok (NOT.txt)', () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => dept(`Birim ${i}`))
    expect(zipPlan('P', '2026-01-01', many(REPORT_PDF_DEPARTMENT_LIMIT)).unitReports).toBe(true)
    expect(zipPlan('P', '2026-01-01', many(REPORT_PDF_DEPARTMENT_LIMIT + 1)).unitReports).toBe(
      false,
    )
  })

  it('yüzden çok departmanda numara genişliği büyür', () => {
    const plan = zipPlan(
      'P',
      '2026-01-01',
      Array.from({ length: 120 }, (_, i) => dept(`B${String(i).padStart(3, '0')}`)),
    )
    expect(plan.departments[0]!.folder).toBe('001-B000')
    expect(plan.departments[119]!.folder).toBe('120-B119')
  })
})
