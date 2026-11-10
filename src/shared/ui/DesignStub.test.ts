import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'

import DesignStub from './DesignStub.vue'

afterEach(() => vi.unstubAllEnvs())

function mountStub() {
  const clicks = ref(0)
  const wrapper = mount(
    defineComponent({
      components: { DesignStub },
      setup: () => ({ clicks }),
      template:
        '<DesignStub id="BE-040" as="div"><button @click="clicks++">Hatırlat</button></DesignStub>',
    }),
    { attachTo: document.body },
  )
  return { wrapper, clicks }
}

describe('DesignStub', () => {
  it('kimliği işaretler; geliştirmede kesikli çerçeve sınıfı', () => {
    const { wrapper } = mountStub()
    const stub = wrapper.get('[data-design-stub]')
    expect(stub.attributes('data-design-stub')).toBe('BE-040')
    expect(stub.element.tagName).toBe('DIV')
    expect(stub.classes()).toContain('ui-stub--dev')
    expect(stub.attributes('title')).toBe('Yakında: sunucu desteği bekleniyor')
  })

  it('üretimde çerçeve yok', () => {
    vi.stubEnv('DEV', false)
    const { wrapper } = mountStub()
    expect(wrapper.get('[data-design-stub]').classes()).not.toContain('ui-stub--dev')
  })

  it('eylem tetiklemez: tıklama ve Enter/Boşluk içeride yakalanır', async () => {
    const { wrapper, clicks } = mountStub()
    const button = wrapper.get('button')
    await button.trigger('click')
    expect(clicks.value).toBe(0)
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    button.element.dispatchEvent(enter)
    expect(enter.defaultPrevented).toBe(true)
    const other = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    button.element.dispatchEvent(other)
    expect(other.defaultPrevented).toBe(false)
  })
})
