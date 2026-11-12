import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { i18n } from '@/shared/i18n'

import TagLegend from './TagLegend.vue'

const mounted = (props: Record<string, unknown> = {}) =>
  mount(TagLegend, { props, global: { plugins: [i18n] } })

describe('etiket kartı (E-06-17…21; P34)', () => {
  it('altı kapalı etiket Türkçe adlarıyla, sözleşme sırasıyla', () => {
    const w = mounted()
    expect(w.findAll('[data-tag]').map((li) => li.text())).toEqual([
      'İster',
      'Plan',
      'Girdi',
      'Analiz',
      'Çıktı',
      'Sonuç',
    ])
    expect(w.text()).not.toMatch(/Saha görselleri|Sonuç dosyası|Güncel durum verisi/)
  })

  it('selected verilmezse açıklayıcı gösterge: düğme yok', async () => {
    const w = mounted()
    expect(w.findAll('.archive-tags__item').every((el) => el.element.tagName === 'DIV')).toBe(true)
    await w.get('[data-tag="plan"] .archive-tags__item').trigger('click')
    expect(w.emitted('select')).toBeUndefined()
  })

  it('selected verilirse satırlar düğme: seçili aria-pressed, tık select yayar', async () => {
    const w = mounted({ selected: 'cikti' })
    const rows = w.findAll('button.archive-tags__item')
    expect(rows).toHaveLength(6)
    expect(w.get('[data-tag="cikti"] button').attributes('aria-pressed')).toBe('true')
    expect(w.get('[data-tag="plan"] button').attributes('aria-pressed')).toBe('false')
    await w.get('[data-tag="plan"] button').trigger('click')
    expect(w.emitted('select')).toEqual([['plan']])
  })

  it('yeni etiket formu devre dışı, BE-024 stub; gönderim ağ isteği atmaz', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const w = mounted()
    const stub = w.get('[data-design-stub="BE-024"]')
    expect(stub.get('input').attributes('disabled')).toBeDefined()
    expect(stub.get('input').element.getAttribute('value') ?? '').toBe('')
    const swatches = stub.findAll('[role="radio"]')
    expect(swatches.map((s) => s.attributes('aria-label'))).toEqual([
      'Mor',
      'Sarı',
      'Yeşil',
      'Kırmızı',
      'Gri',
    ])
    expect(swatches.every((s) => s.attributes('disabled') !== undefined)).toBe(true)
    const create = stub.get('button[type="submit"]')
    expect(create.attributes('disabled')).toBeDefined()
    await stub.get('form').trigger('submit')
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})
