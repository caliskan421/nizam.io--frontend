import { describe, expect, it } from 'vitest'

import { paperContext } from './paper-context'

describe('kâğıt bağlamı', () => {
  const base = {
    program: 'Şanlıurfa Teknofest',
    shortName: null,
    year: 2026,
    generatedAt: '2026-10-21T11:05:00Z',
    now: new Date('2026-10-21T20:30:00Z'),
    timeZone: 'Europe/Istanbul',
  }

  it('kurulum saat diliminde oluşturulma ve bugün; büyük harf program; baş harf kısa ad', () => {
    expect(paperContext(base)).toEqual({
      program: 'Şanlıurfa Teknofest',
      programUpper: 'ŞANLIURFA TEKNOFEST',
      mark: 'ŞT',
      year: 2026,
      generatedAt: '21.10.2026 14:05',
      today: '21.10.2026',
      timeZone: 'Europe/Istanbul',
    })
  })

  it('kısa ad varsa o; geçersiz an null (uydurma yok)', () => {
    const ctx = paperContext({ ...base, shortName: 'ŞU', generatedAt: 'bozuk', year: null })
    expect(ctx.mark).toBe('ŞU')
    expect(ctx.generatedAt).toBeNull()
    expect(ctx.year).toBeNull()
  })

  it('oluşturulma yoksa null', () => {
    expect(paperContext({ ...base, generatedAt: null }).generatedAt).toBeNull()
  })
})
