import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import type { FileFilterBarProps } from '../index'
import FileFilterBar from './FileFilterBar.vue'

const mounted: ReturnType<typeof mount>[] = []
function mountBar(over: Partial<FileFilterBarProps> = {}) {
  const wrapper = mount(FileFilterBar, {
    props: { tag: null, view: 'izgara', loaded: 15, total: 15, hasMore: false, ...over },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  return wrapper
}
afterEach(() => {
  for (const w of mounted.splice(0)) w.unmount()
})

describe('FileFilterBar (E-06-38…40/46)', () => {
  it('başlık ve kesin sayaç; süzgeçlide "n+" (devam var), tek sayfada kesin', async () => {
    const w = mountBar()
    expect(w.find('h2').text()).toContain('Son eklenen dosyalar')
    expect(w.find('.rp-count').text()).toBe('15')
    await w.setProps({ total: null, loaded: 50, hasMore: true })
    expect(w.find('.rp-count').text()).toBe('50+')
    await w.setProps({ total: null, loaded: 3, hasMore: false })
    expect(w.find('.rp-count').text()).toBe('3')
  })

  it('etiket segmenti: Tümü + kapalı küme (P34 Türkçe adlar), renk noktaları token rengi', () => {
    const w = mountBar()
    const group = w.find('[role="group"][aria-label="Etiket"]')
    expect(group.findAll('button').map((b) => b.text())).toEqual([
      'Tümü',
      'İster',
      'Plan',
      'Girdi',
      'Analiz',
      'Çıktı',
      'Sonuç',
    ])
    expect(group.find('button[aria-pressed="true"]').text()).toBe('Tümü')
    const dots = group.findAll('.arch-dot')
    expect(dots).toHaveLength(6)
    for (const dot of dots) expect(dot.attributes('style')).toMatch(/var\(--/)
    expect(w.text()).not.toMatch(/Saha|Güncel/)
  })

  it('etiket seçimi update:tag; basılı etikete yeniden basmak null; Tümü null', async () => {
    const w = mountBar({ tag: 'plan' })
    expect(w.find('[data-tag="plan"]').attributes('aria-pressed')).toBe('true')
    await w.find('[data-tag="sonuc"]').trigger('click')
    await w.find('[data-tag="plan"]').trigger('click')
    await w.findAll('[aria-label="Etiket"] button')[0]!.trigger('click')
    expect(w.emitted('update:tag')).toEqual([['sonuc'], [null], [null]])
  })

  it('görünüm segmenti: Izgara/Liste aria-label, aria-pressed ve update:view', async () => {
    const w = mountBar({ view: 'liste' })
    const [grid, list] = w.findAll('[aria-label="Görünüm"] button')
    expect(grid!.attributes('aria-label')).toBe('Izgara')
    expect(list!.attributes('aria-label')).toBe('Liste')
    expect(list!.attributes('aria-pressed')).toBe('true')
    await grid!.trigger('click')
    expect(w.emitted('update:view')).toEqual([['izgara']])
  })

  it('klavye: segment içinde ←/→ odağı taşır', async () => {
    const w = mountBar()
    const buttons = w.findAll('[aria-label="Etiket"] button')
    ;(buttons[0]!.element as HTMLElement).focus()
    await buttons[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(buttons[1]!.element)
  })
})
