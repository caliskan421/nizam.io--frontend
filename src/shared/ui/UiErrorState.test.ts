import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'
import { errorText } from '@/shared/i18n'

import UiErrorState from './UiErrorState.vue'

describe('UiErrorState', () => {
  it('metin hata kodundan (i18n); istek kimliği görünür; role=alert', () => {
    const error = new ApiError({ code: 'platform.internal', requestId: 'req-123' })
    const wrapper = mount(UiErrorState, { props: { error } })
    expect(wrapper.attributes('role')).toBe('alert')
    expect(wrapper.text()).toContain(errorText(error))
    expect(wrapper.text()).toContain('İstek kimliği')
    expect(wrapper.get('code').text()).toBe('req-123')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('bilinmeyen kod genel metne düşer; istek kimliği yoksa satır yok', () => {
    const wrapper = mount(UiErrorState, {
      props: { error: { messageKey: 'errors.yok.boyle', requestId: null } },
    })
    expect(wrapper.text()).toContain(errorText({ messageKey: 'errors.platform.internal' }))
    expect(wrapper.find('code').exists()).toBe(false)
  })

  it('yeniden dene retry yayar; sürerken devre dışı', async () => {
    const error = { messageKey: 'errors.platform.internal', requestId: null }
    const wrapper = mount(UiErrorState, { props: { error, retryable: true, title: 'Yüklenemedi' } })
    expect(wrapper.get('.rp-empty__title').text()).toBe('Yüklenemedi')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
    const busy = mount(UiErrorState, { props: { error, retryable: true, retrying: true } })
    expect(busy.get('button').attributes('disabled')).toBeDefined()
    await busy.get('button').trigger('click')
    expect(busy.emitted('retry')).toBeUndefined()
  })
})
