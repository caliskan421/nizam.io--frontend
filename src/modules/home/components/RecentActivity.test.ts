import { afterEach, describe, expect, it } from 'vitest'

import { mountWith, resetAll, settle } from '../__tests__/harness'
import RecentActivity from './RecentActivity.vue'

afterEach(resetAll)

describe('Son işlemler (E-01-13/14, BE-010)', () => {
  it('nötr yer tutucu; akış satırı, ad, tarih, sayı yok', async () => {
    const { wrapper } = await mountWith(RecentActivity, null)
    expect(wrapper.get('h2').text()).toBe('Son işlemler')
    const stub = wrapper.get('[data-design-stub="BE-010"]')
    expect(stub.get('.rp-empty').text()).toBe('Henüz işlem geçmişi yok')
    expect(wrapper.find('ol.rp-timeline').exists()).toBe(false)
    expect(wrapper.findAll('li')).toHaveLength(0)
    expect(stub.text()).not.toMatch(/\d/)
  })

  it('"Tümü" açıklamalı devre dışı; tıklama gezinmez', async () => {
    const { wrapper, router } = await mountWith(RecentActivity, null)
    const all = wrapper.get('[data-recent-all]')
    expect(all.attributes('aria-disabled')).toBe('true')
    expect(all.attributes('title')).toBe('İşlem geçmişi bu sürümde yok')
    await all.trigger('click')
    await settle()
    expect(router.currentRoute.value.fullPath).toBe('/')
  })
})
