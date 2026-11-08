import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import UiToast from './UiToast.vue'
import { useToast } from './use-toast'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  useToast().clear()
  vi.useRealTimers()
})

describe('UiToast', () => {
  it('canlı bölge hep var; bildirim yokken boş', () => {
    const wrapper = mount(UiToast)
    expect(wrapper.attributes('aria-live')).toBe('polite')
    expect(wrapper.find('.rp-toast').exists()).toBe(false)
  })

  it('süresi dolunca kapanır, sıradaki görünür', async () => {
    const wrapper = mount(UiToast)
    useToast().push({ message: 'Kaydedildi', timeout: 1000 })
    useToast().push({ message: 'İkinci', timeout: 0 })
    await nextTick()
    expect(wrapper.get('.rp-toast').text()).toBe('Kaydedildi')
    expect(wrapper.get('.rp-toast').attributes('role')).toBe('status')
    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(wrapper.get('.rp-toast').text()).toBe('İkinci')
    vi.advanceTimersByTime(60_000)
    await nextTick()
    expect(wrapper.find('.rp-toast').exists()).toBe(true)
  })

  it('tehlike tonu alert; kapat düğmesi kaldırır', async () => {
    const wrapper = mount(UiToast)
    useToast().push({ message: 'Sonuç bilinmiyor', tone: 'danger', timeout: 0 })
    await nextTick()
    const toast = wrapper.get('.rp-toast')
    expect(toast.attributes('role')).toBe('alert')
    expect(toast.classes()).toContain('rp-toast--danger')
    const close = toast.get('button')
    expect(close.attributes('aria-label')).toBe('Bildirimi kapat')
    await close.trigger('click')
    expect(wrapper.find('.rp-toast').exists()).toBe(false)
  })
})
