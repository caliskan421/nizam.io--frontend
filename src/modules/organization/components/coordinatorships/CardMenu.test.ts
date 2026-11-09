import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { requests, resetHarness, server } from '../../__tests__/harness'
import { view } from './__tests__/fixtures'
import { ADMIN, mountWith, settle, standingHandlers, unmountAll } from './__tests__/mount'
import CardMenu from './CardMenu.vue'
import CoordinatorshipCard from './CoordinatorshipCard.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

const PROPS = { departmentId: 'd1', name: 'Mekanik', canEdit: true, canCreateTask: true }

async function menu(props: Record<string, unknown> = PROPS) {
  server.use(...standingHandlers(ADMIN))
  const ctx = await mountWith(CardMenu, { props })
  const trigger = ctx.wrapper.get('.coords-menu__btn')
  await trigger.trigger('click')
  return { ...ctx, trigger }
}

const labels = (w: Awaited<ReturnType<typeof menu>>['wrapper']) =>
  w.findAll('[role="menuitem"]').map((i) => i.text())

describe('kart işlem menüsü (E-08-38)', () => {
  it('tetik: erişim adı + aria-expanded; menü öğeleri tasarım sırasıyla', async () => {
    const { wrapper, trigger } = await menu()
    expect(trigger.attributes('aria-label')).toBe('Mekanik işlemleri')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(labels(wrapper)).toEqual([
      'Sayfasını aç',
      'Ayarları düzenle',
      'Görev ata',
      'Üst birimi değiştir',
      'Pasifleştir',
    ])
    expect(wrapper.find('.rp-menudiv').exists()).toBe(true)
  })

  it('"Üst birimi değiştir" BE-016, "Pasifleştir" BE-017: devre dışı + stub, istek yok', async () => {
    const { wrapper } = await menu()
    const before = requests.length
    for (const [id, text] of [
      ['BE-016', 'Üst birimi değiştir'],
      ['BE-017', 'Pasifleştir'],
    ]) {
      const stub = wrapper.get(`[data-design-stub="${id}"]`)
      const item = stub.get('[role="menuitem"]')
      expect(item.text()).toBe(text)
      expect(item.attributes('disabled')).toBeDefined()
      await item.trigger('click')
    }
    expect(requests.length).toBe(before)
  })

  it('"Sayfasını aç" → 08b; "Ayarları düzenle" → sekme=ayarlar; menü kapanır', async () => {
    const first = await menu()
    await first.wrapper.findAll('[role="menuitem"]')[0]!.trigger('click')
    await settle()
    expect(first.router.currentRoute.value.fullPath).toBe('/koordinatorlukler/d1')
    expect(first.wrapper.find('[role="menu"]').exists()).toBe(false)
    unmountAll()

    const second = await menu()
    await second.wrapper.findAll('[role="menuitem"]')[1]!.trigger('click')
    await settle()
    expect(second.router.currentRoute.value.fullPath).toBe('/koordinatorlukler/d1?sekme=ayarlar')
  })

  it('"Görev ata" → createTask(id), gezinme yok', async () => {
    const { wrapper, router } = await menu()
    await wrapper.findAll('[role="menuitem"]')[2]!.trigger('click')
    expect(wrapper.emitted('createTask')).toEqual([['d1']])
    expect(router.currentRoute.value.fullPath).toBe('/koordinatorlukler')
  })

  it('yetki yoksa "Ayarları düzenle" ve "Görev ata" gizli', async () => {
    const { wrapper } = await menu({ ...PROPS, canEdit: false, canCreateTask: false })
    expect(labels(wrapper)).toEqual(['Sayfasını aç', 'Üst birimi değiştir', 'Pasifleştir'])
  })

  it('klavye: açılınca ilk öğe odakta, ↓ sonraki etkin öğe, Esc kapatır ve odak tetiğe döner', async () => {
    const { wrapper, trigger } = await menu()
    const items = wrapper.findAll('[role="menuitem"]')
    expect(document.activeElement).toBe(items[0]!.element)
    await wrapper.get('[role="menu"]').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items[1]!.element)
    await wrapper.get('[role="menu"]').trigger('keydown', { key: 'Escape' })
    await settle()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
    expect(trigger.attributes('aria-expanded')).toBe('false')
  })

  it('dışarı tık menüyü kapatır', async () => {
    const { wrapper } = await menu()
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await settle()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('kartta: "Görev ata" kart olayına dönüşür', async () => {
    server.use(...standingHandlers(ADMIN))
    const { wrapper } = await mountWith(CoordinatorshipCard, {
      props: { item: view('d1', 'Mekanik', 'MEK') },
    })
    await wrapper.get('.coords-menu__btn').trigger('click')
    const task = wrapper.findAll('[role="menuitem"]').find((i) => i.text() === 'Görev ata')!
    await task.trigger('click')
    expect(wrapper.emitted('createTask')).toEqual([['d1']])
  })
})
