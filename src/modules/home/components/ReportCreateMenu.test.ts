import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { mountWith, requests, resetAll, server, settle } from '../__tests__/harness'
import ReportCreateMenu from './ReportCreateMenu.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())

const tileOf = ({ wrapper }: Awaited<ReturnType<typeof mountWith>>) =>
  wrapper.get('[data-quick="report"]')

describe('"Rapor oluştur" menüsü (E-01-12; P47)', () => {
  it('kapalıyken: menü düğmesi, menü ve aria-controls yok', async () => {
    const page = await mountWith(ReportCreateMenu, null)
    const tile = tileOf(page)
    expect(tile.text()).toBe('Rapor oluştur')
    expect(tile.attributes('aria-haspopup')).toBe('menu')
    expect(tile.attributes('aria-expanded')).toBe('false')
    expect(tile.attributes('aria-controls')).toBeUndefined()
    expect(page.wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('tıklanınca dört satırlı menü açılır; ağ isteği atılmaz', async () => {
    const page = await mountWith(ReportCreateMenu, null)
    await tileOf(page).trigger('click')
    const menu = page.wrapper.get('[role="menu"]')
    expect(menu.attributes('aria-label')).toBe('Rapor türü')
    expect(tileOf(page).attributes('aria-expanded')).toBe('true')
    expect(tileOf(page).attributes('aria-controls')).toBe(menu.attributes('id'))
    const rows = menu.findAll('[role="menuitem"]').map((r) => r.text())
    expect(rows).toEqual([
      'Dönem sonu raporu (PDF) Arşiv',
      'İş yükü raporu (PDF) Kullanıcılar',
      'Toplantı raporu toplantıyı seç',
      'Görev raporu görevi seç',
    ])
    expect(requests).toHaveLength(0)
  })

  it.each([
    ['season', 'archive.folders'],
    ['workload', 'organization.users'],
    ['meeting', 'collaboration.meetings'],
    ['task', 'work.tasks'],
  ] as const)(
    '%s satırı %s rotasına yönlendirir, menü kapanır, odak kutucuğa döner',
    async (key, name) => {
      const page = await mountWith(ReportCreateMenu, null)
      await tileOf(page).trigger('click')
      await page.wrapper.get(`[data-report="${key}"]`).trigger('click')
      await settle()
      await nextTick()
      expect(page.router.currentRoute.value.name).toBe(name)
      expect(page.wrapper.find('[role="menu"]').exists()).toBe(false)
      expect(document.activeElement).toBe(tileOf(page).element)
      expect(requests).toHaveLength(0)
    },
  )

  it('Esc menüyü kapatır ve odağı kutucuğa döndürür', async () => {
    const page = await mountWith(ReportCreateMenu, null)
    await tileOf(page).trigger('click')
    await nextTick()
    await page.wrapper.get('[role="menu"]').trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(page.wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(tileOf(page).element)
    expect(tileOf(page).attributes('aria-controls')).toBeUndefined()
  })

  it('dışarı tıklama kapatır, odağı zorla taşımaz; ↓ tuşu açar', async () => {
    const page = await mountWith(ReportCreateMenu, null)
    await tileOf(page).trigger('keydown', { key: 'ArrowDown' })
    expect(page.wrapper.find('[role="menu"]').exists()).toBe(true)
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(page.wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).not.toBe(tileOf(page).element)
  })

  it('açıkken sökülünce dinleyici kalmaz (sonradan hata yok)', async () => {
    const page = await mountWith(ReportCreateMenu, null)
    await tileOf(page).trigger('click')
    page.wrapper.unmount()
    expect(() =>
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })),
    ).not.toThrow()
  })
})
