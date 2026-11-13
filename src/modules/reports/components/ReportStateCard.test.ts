import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import ReportStateCard from './ReportStateCard.vue'

function card(props: Record<string, unknown>) {
  return mount(ReportStateCard, {
    props: props as never,
    global: { plugins: [i18n] },
  })
}

describe('ReportStateCard (01h ortak durum kartı)', () => {
  it('hazırlanıyor: role=status + aria-busy, belirsiz şerit ve statik "ilerleme yakında" (BE-131)', () => {
    const w = card({ tone: 'progress', title: 'Rapor hazırlanıyor…', body: 'metin' })
    expect(w.attributes('role')).toBe('status')
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.get('[role="progressbar"]').attributes('aria-label')).toBe(
      'Rapor hazırlanıyor, ilerleme bilinmiyor',
    )
    expect(w.get('[data-design-stub="BE-131"]').text()).toBe('ilerleme yakında')
    expect(w.text()).not.toMatch(/%|\d+ ?s\b/)
  })

  it('429/503: role=alert, başlık + kod satırı; süre metni yok', () => {
    const w = card({
      tone: 'warn',
      title: 'Zaten bir rapor hazırlanıyor',
      body: 'gövde',
      status: 429,
      code: 'reporting.export_in_progress',
    })
    expect(w.attributes('role')).toBe('alert')
    expect(w.attributes('aria-busy')).toBeUndefined()
    expect(w.get('.report-card__code').text()).toBe('429 · reporting.export_in_progress')
    expect(w.find('[role="progressbar"]').exists()).toBe(false)
  })

  it('kod yoksa kod satırı çizilmez; başarı kartı role=status ve alt not', () => {
    const w = card({
      tone: 'success',
      body: 'a.pdf indirildi',
      note: 'Rapor indirmeleri kayda geçer (denetim).',
    })
    expect(w.attributes('role')).toBe('status')
    expect(w.find('.report-card__code').exists()).toBe(false)
    expect(w.text()).toContain('Rapor indirmeleri kayda geçer (denetim).')
  })

  it('diğer hata: role=alert, başlıksız', () => {
    const w = card({ tone: 'error', body: 'Rapor oluşturulamadı.' })
    expect(w.attributes('role')).toBe('alert')
    expect(w.find('.report-card__title').exists()).toBe(false)
  })
})
