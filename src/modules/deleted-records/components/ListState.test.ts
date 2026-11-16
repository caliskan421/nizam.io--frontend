import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'

import ListState from './ListState.vue'

const base = { kind: 'toplanti', error: null, retrying: false } as const

describe('ListState (E-12-60/61/62, P44)', () => {
  it('yükleniyor', () => {
    const wrapper = mount(ListState, { props: { ...base, state: 'loading' } })
    expect(wrapper.get('[role="status"]').text()).toBe('Silinen kayıtlar yükleniyor')
  })

  it('hata: kod → i18n metni (sunucu iletisi yok), istek kimliği, yeniden dene', async () => {
    const error = new ApiError({ code: 'platform.internal', requestId: 'req-1', status: 500 })
    const wrapper = mount(ListState, { props: { ...base, state: 'error', error } })
    expect(wrapper.text()).toContain('Silinen kayıtlar yüklenemedi')
    expect(wrapper.text()).toContain('req-1')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('boş: "Silinmiş ‹tür› yok."; neden/ne zaman cümlesi yok', () => {
    const wrapper = mount(ListState, { props: { ...base, state: 'empty', kind: 'kullanici' } })
    expect(wrapper.text()).toBe('Silinmiş kullanıcı yok.')
  })

  it('süzgeç boş: sunucu süzgeci olduğundan "yüklenenlerde yok" ayrımı yok; temizle düğmesi', async () => {
    const wrapper = mount(ListState, { props: { ...base, state: 'filtered' } })
    expect(wrapper.text()).toContain('Bu filtrelerle kayıt yok.')
    expect(wrapper.text()).not.toMatch(/Yüklenen|daha fazla/)
    await wrapper.get('[data-testid="dr-clear"]').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })
})
