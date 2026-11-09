import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import { createTestRouter } from '../components/tracking/__tests__/tracking-harness'
import UserPage from './UserPage.vue'

// Gövde W76'nın kendi bileşenidir; sayfa yalnız rota parametresini geçirir (kişi değişince yeniden kurar).
const PersonalTracking = defineComponent({
  name: 'PersonalTracking',
  props: { accountId: { type: String, required: true } },
  setup: (p) => () => h('div', { 'data-tracking': p.accountId }),
})

describe('05b sayfası', () => {
  it('rota parametresi → PersonalTracking accountId; kişi değişince yeniden kurulur', async () => {
    const router = createTestRouter()
    await router.push('/kullanicilar/u1')
    const wrapper = mount(UserPage, {
      global: { plugins: [router], stubs: { PersonalTracking } },
    })
    expect(wrapper.find('[data-tracking]').attributes('data-tracking')).toBe('u1')
    const first = wrapper.find('[data-tracking]').element
    await router.push('/kullanicilar/u2')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-tracking]').attributes('data-tracking')).toBe('u2')
    expect(wrapper.find('[data-tracking]').element).not.toBe(first)
  })
})
