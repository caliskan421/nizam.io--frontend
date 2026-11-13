// Oturum kartı rol halkası ve rol etiketi (E-00-47): canlı gösterim, kart tıklanamaz.
import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SideAccount from './SideAccount.vue'
import { createFakeLifecycle, mountWithScope, sideContext } from './__tests__/fake-lifecycle'
import { MENU_ROLES } from './menu-definition'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

afterEach(() => {
  document.body.innerHTML = ''
})

const LABELS = { admin: 'Admin', coordinator: 'Koordinatör', member: 'Üye' } as const

describe('SideAccount rol halkası', () => {
  it.each(MENU_ROLES)(
    '%s: halka sınıfı + rol etiketi; kart düğme/bağlantı değil, çıkış tek düğme',
    async (role) => {
      const ctx = await sideContext()
      const { lifecycle } = createFakeLifecycle()
      const w = mountWithScope(ctx, lifecycle, SideAccount, { role })
      await flushPromises()
      expect(w.get('.rp-av').classes()).toContain(`side-ring--${role}`)
      expect(w.get('.side-account__mail').text()).toBe(`${LABELS[role]} · kisi@example.test`)
      expect(w.find('a').exists()).toBe(false)
      expect(w.findAll('button')).toHaveLength(1)
      expect(w.get('button').attributes('aria-label')).toBe('Çıkış yap')
    },
  )

  it('halka rengi yalnız rol token’ından (ham renk yok)', async () => {
    const { readFileSync } = await import('node:fs')
    const css = readFileSync('src/app/shell/side/side.css', 'utf8')
    expect(css).toMatch(/\.side-ring--admin \{\s*--side-ring-color: var\(--role-admin\)/)
    expect(css).toMatch(/\.side-ring--coordinator \{\s*--side-ring-color: var\(--role-koord\)/)
    expect(css).toMatch(/\.side-ring--member \{\s*--side-ring-color: var\(--role-uye\)/)
  })
})
