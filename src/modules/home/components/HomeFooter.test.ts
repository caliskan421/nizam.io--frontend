import { afterEach, describe, expect, it } from 'vitest'

import { dashboard, mountWith, resetAll } from '../__tests__/harness'
import HomeFooter from './HomeFooter.vue'

afterEach(resetAll)

describe('alt bilgi (E-01-39)', () => {
  it('beş pano sayısı tek satırda', async () => {
    const { wrapper } = await mountWith(HomeFooter, null, {
      report: dashboard({
        total_coordinatorships: 11,
        total_users: 18,
        total_admins: 2,
        total_coordinators: 15,
        total_members: 3,
      }),
    })
    expect(wrapper.get('footer').text()).toBe(
      '11 koordinatörlük · 18 kullanıcı (2 admin, 15 koordinatör, 3 üye)',
    )
    expect(wrapper.get('footer span').attributes('title')).toContain('şirket geneli')
  })

  it('veri yokken satır çizilmez', async () => {
    const { wrapper } = await mountWith(HomeFooter, null, { report: null })
    expect(wrapper.find('footer').exists()).toBe(false)
  })
})
