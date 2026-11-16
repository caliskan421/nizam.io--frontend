import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import KindSegment from './KindSegment.vue'

const COUNTS = { gorev: 12, toplanti: 3, koordinatorluk: 0, kullanici: 127 }

function mountSegment(counts: typeof COUNTS | null = COUNTS) {
  return mount(KindSegment, {
    props: { modelValue: 'gorev', counts },
    attachTo: document.body,
  })
}

describe('KindSegment (E-12-08…16, P41, P42)', () => {
  it('canlı dört tür + devre dışı üç tür; sıra ve "Tümü" yok', () => {
    const wrapper = mountSegment()
    const buttons = wrapper.findAll('button')
    expect(buttons.map((b) => b.text().replace(/\s*\d+$/, ''))).toEqual([
      'Görev',
      'Toplantı',
      'Koordinatörlük',
      'Kullanıcı',
      'Alt görev',
      'Dosya',
      'Not ve gündem',
    ])
    expect(buttons.map((b) => b.attributes('disabled') !== undefined)).toEqual([
      false,
      false,
      false,
      false,
      true,
      true,
      true,
    ])
    expect(wrapper.text()).not.toContain('Tümü')
    wrapper.unmount()
  })

  it('devre dışı türler stub işaretli (BE-109, BE-076, BE-111) ve sayısız', () => {
    const wrapper = mountSegment()
    for (const [kind, stub] of [
      ['altgorev', 'BE-109'],
      ['dosya', 'BE-076'],
      ['notgundem', 'BE-111'],
    ] as const) {
      const holder = wrapper.get(`[data-design-stub="${stub}"]`)
      expect(holder.find(`[data-kind="${kind}"]`).exists()).toBe(true)
      expect(holder.find('.rp-count').exists()).toBe(false)
    }
    wrapper.unmount()
  })

  it('sayaçlar özetten ve kesin: etkin olmayan tür de sayı gösterir ("n+" yok); özet yoksa hiç çizilmez', async () => {
    const wrapper = mountSegment()
    expect(wrapper.findAll('.rp-count').map((c) => c.text())).toEqual(['12', '3', '0', '127'])
    expect(wrapper.get('[data-kind="kullanici"] .rp-count').text()).toBe('127')
    // Sıfır gerçek bir sayıdır ve gösterilir.
    expect(wrapper.get('[data-kind="koordinatorluk"] .rp-count').text()).toBe('0')
    await wrapper.setProps({ counts: null })
    expect(wrapper.find('.rp-count').exists()).toBe(false)
    wrapper.unmount()
  })

  it('tıklama tür yayar; aria-pressed açık türde; ←/→ canlı düğmeler arasında gezinir', async () => {
    const wrapper = mountSegment()
    expect(wrapper.get('[data-kind="gorev"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-kind="toplanti"]').attributes('aria-pressed')).toBe('false')
    await wrapper.get('[data-kind="toplanti"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['toplanti']])
    ;(wrapper.get('[data-kind="gorev"]').element as HTMLElement).focus()
    await wrapper.get('[data-testid="dr-kinds"]').trigger('keydown', { key: 'ArrowLeft' })
    // Devre dışı düğmeler atlanır: Görev'den sola gidince son canlı düğme (Kullanıcı).
    expect(document.activeElement).toBe(wrapper.get('[data-kind="kullanici"]').element)
    wrapper.unmount()
  })
})
