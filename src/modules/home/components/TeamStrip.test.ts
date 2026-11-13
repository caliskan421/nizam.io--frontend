import { afterEach, describe, expect, it } from 'vitest'

import { dashboard, mountWith, resetAll, settle } from '../__tests__/harness'
import TeamStrip from './TeamStrip.vue'

afterEach(resetAll)

const REPORT = dashboard({
  total_users: 18,
  total_coordinatorships: 11,
  total_admins: 2,
  total_coordinators: 15,
  total_members: 3,
})

describe('ekip şeridi (E-01-19/20)', () => {
  it('toplam kullanıcı + koordinatörlük ve üç rol sayısı; karışık kapsam ipucu', async () => {
    const { wrapper } = await mountWith(TeamStrip, null, { report: REPORT })
    expect(wrapper.get('[data-team-users]').text()).toBe('18')
    expect(wrapper.get('[data-team-summary]').text()).toContain('kullanıcı · 11 koordinatörlük')
    expect(wrapper.get('[data-team-summary]').attributes('title')).toBe(
      'Yöneticiler şirket geneli, diğerleri bu program için sayılır.',
    )
    const roles = wrapper.findAll('[data-role]').map((r) => [r.attributes('data-role'), r.text()])
    expect(roles).toEqual([
      ['admin', '2Admin'],
      ['koordinator', '15Koordinatör'],
      ['uye', '3Üye'],
    ])
    expect(wrapper.get('[data-role="admin"]').attributes('title')).toContain('şirket geneli')
    expect(wrapper.get('[data-role="uye"]').attributes('title')).toBeUndefined()
  })

  it('rol kartı 05 rol sekmesi süzgeciyle açar', async () => {
    const { wrapper, router } = await mountWith(TeamStrip, null, { report: REPORT })
    const card = wrapper.get('[data-role="koordinator"]')
    expect(card.attributes('href')).toBe('/kullanicilar?rol=koordinator')
    expect(card.attributes('aria-label')).toBe('Koordinatör: 15 kullanıcıyı gör')
    await card.trigger('click')
    await settle()
    expect(router.currentRoute.value.name).toBe('organization.users')
    expect(router.currentRoute.value.query).toEqual({ rol: 'koordinator' })
  })

  it('yükleniyor: iskelet, sayı yok; hata: bölge içi hata + yeniden dene', async () => {
    const loading = await mountWith(TeamStrip, null, { report: null })
    expect(loading.wrapper.find('[data-team-users]').exists()).toBe(false)
    expect(loading.wrapper.findAll('[data-team-skeleton]')).toHaveLength(3)
    expect(loading.wrapper.get('[data-region="team"]').attributes('aria-busy')).toBe('true')
    const failed = await mountWith(TeamStrip, null, {
      report: null,
      error: { messageKey: 'errors.unknown', requestId: 'req-9' },
    })
    expect(failed.wrapper.get('[role="alert"]').text()).toContain('Ekip özeti yüklenemedi')
    await failed.wrapper.get('[role="alert"] button').trigger('click')
    expect(failed.wrapper.findComponent(TeamStrip).emitted('retry')).toHaveLength(1)
  })
})
