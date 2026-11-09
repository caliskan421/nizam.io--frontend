import { afterEach, describe, expect, it } from 'vitest'

import { mountWith, resetAll, settle } from '../__tests__/harness'
import type { QuickAction } from '../model/quick-actions'
import QuickActions from './QuickActions.vue'

afterEach(resetAll)

const ALL: QuickAction[] = [
  { key: 'newTask', icon: 'plus', phase: null },
  { key: 'meeting', icon: 'meetings', phase: 'F4' },
  { key: 'invite', icon: 'user-plus', phase: 'F2' },
]

describe('Hızlı işlemler (E-01-08…11)', () => {
  it('başlık; "Yeni görev" 03 Görevler bağlantısı; "Rapor oluştur" yok', async () => {
    const { wrapper, router } = await mountWith(QuickActions, null, { actions: ALL })
    expect(wrapper.get('h2').text()).toBe('Hızlı işlemler')
    const create = wrapper.get('[data-quick="newTask"]')
    expect(create.element.tagName).toBe('A')
    expect(create.attributes('href')).toBe('/gorevler')
    expect(create.text()).toBe('Yeni görev')
    expect(wrapper.text()).not.toContain('Rapor oluştur')
    await create.trigger('click')
    await settle()
    expect(router.currentRoute.value.name).toBe('work.tasks')
  })

  it('faz dışı: aria-disabled + faz notu; tıklama gezinmez', async () => {
    const { wrapper, router } = await mountWith(QuickActions, null, { actions: ALL })
    const meeting = wrapper.get('[data-quick="meeting"]')
    expect(meeting.attributes('aria-disabled')).toBe('true')
    expect(meeting.attributes('title')).toBe('Toplantı oluştur — F4’te açılacak')
    expect(meeting.text()).toContain('F4’te')
    const invite = wrapper.get('[data-quick="invite"]')
    expect(invite.attributes('title')).toBe('Kullanıcı davet et — F2’de açılacak')
    await meeting.trigger('click')
    await invite.trigger('click')
    await settle()
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('yalnız verilen kutucuklar çizilir', async () => {
    const { wrapper } = await mountWith(QuickActions, null, { actions: [ALL[0]] })
    expect(wrapper.findAll('[data-quick]')).toHaveLength(1)
  })
})
