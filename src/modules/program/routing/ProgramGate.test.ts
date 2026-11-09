import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, ref } from 'vue'

const standing = ref<{ companyAdmin: boolean } | null>(null)
const replace = vi.fn()
vi.mock('@/shared/scope/standing', () => ({
  useStanding: () => ({ standing: computed(() => standing.value) }),
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ replace }) }))

const { default: ProgramGate } = await import('./ProgramGate.vue')

const Host = defineComponent({
  setup: () => () => h(ProgramGate, null, { default: () => h('p', { id: 'inside' }) }),
})

describe('program kapısı', () => {
  it('standing yokken çizmez/yönlendirmez; yöneticide çizer; yönetici değilse ana sayfa', async () => {
    standing.value = null
    const wrapper = mount(Host)
    expect(wrapper.find('#inside').exists()).toBe(false)
    expect(replace).not.toHaveBeenCalled()
    standing.value = { companyAdmin: true }
    await wrapper.vm.$nextTick()
    expect(wrapper.find('#inside').exists()).toBe(true)
    standing.value = { companyAdmin: false }
    await wrapper.vm.$nextTick()
    expect(wrapper.find('#inside').exists()).toBe(false)
    expect(replace).toHaveBeenCalledWith({ name: 'home' })
    wrapper.unmount()
  })
})
