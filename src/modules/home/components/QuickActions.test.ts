import { afterEach, describe, expect, it } from 'vitest'

import { mountWith, resetAll, settle } from '../__tests__/harness'
import type { QuickAction } from '../model/quick-actions'
import QuickActions from './QuickActions.vue'

afterEach(resetAll)

const ALL: QuickAction[] = [
  { key: 'newTask', icon: 'plus' },
  { key: 'meeting', icon: 'meetings' },
  { key: 'invite', icon: 'user-plus' },
]

describe('Hızlı işlemler (E-01-08…11)', () => {
  it('başlık; "Yeni görev" 03 Görevler bağlantısı; rapor kutucuğu yalnız verilince', async () => {
    const { wrapper, router } = await mountWith(QuickActions, null, { actions: ALL })
    expect(wrapper.get('h2').text()).toBe('Hızlı işlemler')
    const create = wrapper.get('[data-quick="newTask"]')
    expect(create.element.tagName).toBe('A')
    expect(create.attributes('href')).toBe('/gorevler?yeni=1')
    expect(create.text()).toBe('Yeni görev')
    expect(wrapper.text()).not.toContain('Rapor oluştur')
    await create.trigger('click')
    await settle()
    expect(router.currentRoute.value.name).toBe('work.tasks')
    expect(router.currentRoute.value.query).toEqual({ yeni: '1' })
  })

  it('toplantı ve kullanıcı kutucukları canlı bağlantıdır: faz etiketi yok, 09/05 listelerine gider (KUSUR 3)', async () => {
    const { wrapper, router } = await mountWith(QuickActions, null, { actions: ALL })
    const meeting = wrapper.get('[data-quick="meeting"]')
    expect(meeting.element.tagName).toBe('A')
    expect(meeting.attributes('aria-disabled')).toBeUndefined()
    expect(meeting.attributes('href')).toBe('/toplantilar')
    const invite = wrapper.get('[data-quick="invite"]')
    expect(invite.element.tagName).toBe('A')
    expect(invite.attributes('aria-disabled')).toBeUndefined()
    expect(invite.attributes('href')).toBe('/kullanicilar')
    expect(wrapper.text()).not.toMatch(/F\d/)
    await meeting.trigger('click')
    await settle()
    expect(router.currentRoute.value.name).toBe('collaboration.meetings')
    await invite.trigger('click')
    await settle()
    expect(router.currentRoute.value.name).toBe('organization.users')
  })

  it('yalnız verilen kutucuklar çizilir', async () => {
    const { wrapper } = await mountWith(QuickActions, null, { actions: [ALL[0]] })
    expect(wrapper.findAll('[data-quick]')).toHaveLength(1)
  })
})
