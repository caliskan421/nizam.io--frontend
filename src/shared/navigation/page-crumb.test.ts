import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'

import { pageCrumb, usePageCrumb } from './page-crumb'

function page(label: () => string | null) {
  return defineComponent({
    setup() {
      usePageCrumb(label)
      return () => null
    },
  })
}

describe('sayfa kırıntı etiketi (E-00-35 dinamik son parça)', () => {
  it('veri gelince etiket; null/boş iken yok; sökülünce düşer', async () => {
    const name = ref<string | null>(null)
    const wrapper = mount(page(() => name.value))
    expect(pageCrumb.value).toBeNull()
    name.value = 'Altyapı ve tesisat'
    await nextTick()
    expect(pageCrumb.value).toBe('Altyapı ve tesisat')
    name.value = '  '
    await nextTick()
    expect(pageCrumb.value).toBeNull()
    name.value = 'Yeni ad'
    await nextTick()
    wrapper.unmount()
    expect(pageCrumb.value).toBeNull()
  })

  it('eski sayfanın sökülmesi yeni sayfanın etiketini silmez', () => {
    const a = mount(page(() => 'A'))
    const b = mount(page(() => 'B'))
    expect(pageCrumb.value).toBe('B')
    a.unmount()
    expect(pageCrumb.value).toBe('B')
    b.unmount()
    expect(pageCrumb.value).toBeNull()
  })
})
