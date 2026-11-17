import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import KindSegment from './KindSegment.vue'

const COUNTS = {
  tumu: 190,
  gorev: 12,
  altgorev: 7,
  dosya: 5,
  toplanti: 3,
  koordinatorluk: 0,
  kullanici: 127,
  notgundem: 36,
}

function mountSegment(counts: typeof COUNTS | null = COUNTS) {
  return mount(KindSegment, {
    props: { modelValue: 'gorev', counts },
    attachTo: document.body,
  })
}

describe('KindSegment (E-12-08…16, P41; v0.26 sekiz görünüm)', () => {
  it('sekiz görünüm tasarım sırasında, hepsi etkin; stub işareti yok', () => {
    const wrapper = mountSegment()
    const buttons = wrapper.findAll('button')
    expect(buttons.map((b) => b.text().replace(/\s*\d+$/, ''))).toEqual([
      'Tümü',
      'Görev',
      'Alt görev',
      'Dosya',
      'Toplantı',
      'Koordinatörlük',
      'Kullanıcı',
      'Not ve gündem',
    ])
    expect(buttons.every((b) => b.attributes('disabled') === undefined)).toBe(true)
    expect(wrapper.find('[data-design-stub]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('sayaçlar özetten ve kesin; özet yoksa hiç çizilmez', async () => {
    const wrapper = mountSegment()
    expect(wrapper.findAll('.rp-count').map((c) => c.text())).toEqual([
      '190',
      '12',
      '7',
      '5',
      '3',
      '0',
      '127',
      '36',
    ])
    expect(wrapper.get('[data-kind="notgundem"] .rp-count').text()).toBe('36')
    // Sıfır gerçek bir sayıdır ve gösterilir.
    expect(wrapper.get('[data-kind="koordinatorluk"] .rp-count').text()).toBe('0')
    await wrapper.setProps({ counts: null })
    expect(wrapper.find('.rp-count').exists()).toBe(false)
    wrapper.unmount()
  })

  it('tıklama görünüm yayar; aria-pressed açık görünümde; ←/→ düğmeler arasında gezinir', async () => {
    const wrapper = mountSegment()
    expect(wrapper.get('[data-kind="gorev"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-kind="tumu"]').attributes('aria-pressed')).toBe('false')
    await wrapper.get('[data-kind="dosya"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['dosya']])
    ;(wrapper.get('[data-kind="tumu"]').element as HTMLElement).focus()
    await wrapper.get('[data-testid="dr-kinds"]').trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(wrapper.get('[data-kind="notgundem"]').element)
    wrapper.unmount()
  })
})
