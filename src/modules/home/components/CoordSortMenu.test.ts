import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { mountWith, resetAll } from '../__tests__/harness'
import CoordSortMenu from './CoordSortMenu.vue'

afterEach(resetAll)

const mountMenu = (props: { sortKey?: string; reversed?: boolean } = {}) =>
  mountWith(CoordSortMenu, null, { sortKey: 'late', reversed: false, ...props })

const button = (page: Awaited<ReturnType<typeof mountMenu>>) => page.wrapper.get('.home-sort__btn')

describe('sıralama menüsü (E-01-25/26)', () => {
  it('düğme etiketi "Sırala: ‹ölçüt› ↓"; ters sırada ↑', async () => {
    const down = await mountMenu()
    expect(button(down).text()).toBe('Sırala: Gecikme ↓')
    const up = await mountMenu({ sortKey: 'name', reversed: true })
    expect(button(up).text()).toBe('Sırala: Ad ↑')
  })

  it('kapalıyken menü ve aria-controls yok; açılınca altı ölçüt + ters çevir', async () => {
    const page = await mountMenu()
    expect(button(page).attributes('aria-controls')).toBeUndefined()
    expect(button(page).attributes('aria-expanded')).toBe('false')
    await button(page).trigger('click')
    const menu = page.wrapper.get('[role="menu"]')
    expect(menu.attributes('aria-label')).toBe('Sıralama')
    expect(button(page).attributes('aria-controls')).toBe(menu.attributes('id'))
    const radios = menu.findAll('[role="menuitemradio"]')
    expect(radios.map((r) => r.attributes('data-sort'))).toEqual([
      'late',
      'open',
      'completion',
      'members',
      'last_upload',
      'name',
    ])
    expect(radios.map((r) => r.attributes('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
      'false',
      'false',
      'false',
    ])
    expect(radios[0]!.text()).toContain('En çok gecikmesi olandan aza')
    expect(menu.get('[data-sort="flip"]').text()).toBe('Sırayı ters çevir')
  })

  it('ölçüt seçimi: pick yayar, menü kapanır, odak düğmeye döner', async () => {
    const page = await mountMenu()
    await button(page).trigger('click')
    await page.wrapper.get('[data-sort="open"]').trigger('click')
    await nextTick()
    expect(page.wrapper.findComponent(CoordSortMenu).emitted('pick')).toEqual([['open']])
    expect(page.wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(button(page).element)
  })

  it('"Sırayı ters çevir": flip yayar, menü kapanır, odak düğmeye döner', async () => {
    const page = await mountMenu()
    await button(page).trigger('click')
    await page.wrapper.get('[data-sort="flip"]').trigger('click')
    await nextTick()
    expect(page.wrapper.findComponent(CoordSortMenu).emitted('flip')).toHaveLength(1)
    expect(page.wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(button(page).element)
  })

  it('"Son yükleme" devre dışı: tıklanınca olay yok, menü açık kalır (BE-025)', async () => {
    const page = await mountMenu()
    await button(page).trigger('click')
    const off = page.wrapper.get('[data-sort="last_upload"]')
    expect(off.attributes('disabled')).toBeDefined()
    expect(page.wrapper.get('[data-design-stub="BE-025"]').text()).toContain(
      'Son yükleme bu sürümde yok',
    )
    await off.trigger('click')
    expect(page.wrapper.findComponent(CoordSortMenu).emitted('pick')).toBeUndefined()
    expect(page.wrapper.find('[role="menu"]').exists()).toBe(true)
  })

  it('Esc kapatır ve odağı döndürür; dışarı tıklama kapatır, odak taşınmaz', async () => {
    const page = await mountMenu()
    await button(page).trigger('click')
    await nextTick()
    await page.wrapper.get('[role="menu"]').trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(page.wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(button(page).element)
    ;(document.activeElement as HTMLElement).blur()
    await button(page).trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(page.wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).not.toBe(button(page).element)
  })
})
