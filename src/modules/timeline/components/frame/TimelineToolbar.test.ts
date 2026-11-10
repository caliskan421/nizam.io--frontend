import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import TimelineToolbar from './TimelineToolbar.vue'

const departments = [
  { departmentId: 'd1', displayName: 'Mekanik' },
  { departmentId: 'd2', displayName: 'İdari işler' },
]
const base = {
  status: 'tumu' as const,
  scale: 'hafta' as const,
  departments,
  departmentId: null,
  showDepartmentFilter: true,
  fullscreen: false,
  exportReady: false,
}
const mountBar = (props: Record<string, unknown> = {}) =>
  mount(TimelineToolbar, { props: { ...base, ...props }, attachTo: document.body })

afterEach(() => {
  document.body.innerHTML = ''
})

describe('koordinatörlük süzgeci (E-03C-05; Admin yüzü, tek seçim)', () => {
  it('Admin yüzünde canlı; K/Ü yüzünde DOM’da yok', () => {
    expect(mountBar().find('[data-testid="timeline-department-filter"]').exists()).toBe(true)
    expect(
      mountBar({ showDepartmentFilter: false })
        .find('[data-testid="timeline-department-filter"]')
        .exists(),
    ).toBe(false)
  })

  it('rozet yalnız 0/1 (sayı yok)', () => {
    expect(mountBar().get('[data-testid="timeline-department-filter"]').text()).toBe(
      'Koordinatörlük',
    )
    const set = mountBar({ departmentId: 'd2' }).get('[data-testid="timeline-department-filter"]')
    expect(set.text()).toBe('Koordinatörlük 1')
    expect(set.attributes('title')).toBe('İdari işler')
  })

  it('menü Tümü + departmanlar; seçim update:departmentId yayar, kapanır, odak tetiğe döner', async () => {
    const bar = mountBar({ departmentId: 'd1' })
    const trigger = bar.get('[data-testid="timeline-department-filter"]')
    await trigger.trigger('click')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    const items = bar.findAll('[role="menuitemradio"]')
    expect(items.map((i) => i.text())).toEqual(['Tüm koordinatörlükler', 'Mekanik', 'İdari işler'])
    expect(items[1]!.attributes('aria-checked')).toBe('true')
    await items[2]!.trigger('click')
    expect(bar.emitted('update:departmentId')).toEqual([['d2']])
    expect(bar.find('[role="menu"]').exists()).toBe(false)
    await flushPromises()
    expect(document.activeElement).toBe(trigger.element)
  })

  it('Tümü null yayar; Esc kapatır ve odağı tetiğe döndürür; dış tıklama kapatır', async () => {
    const bar = mountBar({ departmentId: 'd1' })
    const trigger = bar.get('[data-testid="timeline-department-filter"]')
    await trigger.trigger('click')
    await bar.findAll('[role="menuitemradio"]')[0]!.trigger('click')
    expect(bar.emitted('update:departmentId')).toEqual([[null]])

    await trigger.trigger('click')
    await bar.get('[role="menu"]').trigger('keydown', { key: 'Escape' })
    expect(bar.find('[role="menu"]').exists()).toBe(false)
    await flushPromises()
    expect(document.activeElement).toBe(trigger.element)

    await trigger.trigger('click')
    expect(bar.find('[role="menu"]').exists()).toBe(true)
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(bar.find('[role="menu"]').exists()).toBe(false)
  })
})

describe('durum süzgeci (E-03C-06)', () => {
  it('dört değer, sayaçsız; basılı olan geçerli durum', () => {
    const bar = mountBar({ status: 'geciken' })
    const buttons = bar.get('[role="group"][aria-label="Durum"]').findAll('button')
    expect(buttons.map((b) => b.text())).toEqual(['Tümü', 'Açık', 'Geciken', 'Biten'])
    expect(buttons.map((b) => b.attributes('aria-pressed'))).toEqual([
      'false',
      'false',
      'true',
      'false',
    ])
  })

  it('seçim update:status yayar', async () => {
    const bar = mountBar()
    const buttons = bar.get('[role="group"][aria-label="Durum"]').findAll('button')
    await buttons[3]!.trigger('click')
    await buttons[1]!.trigger('click')
    expect(bar.emitted('update:status')).toEqual([['biten'], ['acik']])
  })
})

describe('ölçek (E-03C-07…09)', () => {
  it.each([
    ['gun', 'Gün ölçeği'],
    ['hafta', 'Hafta ölçeği'],
    ['ay', 'Ay ölçeği'],
  ] as const)('%s ölçeği etiketi', (scale, text) => {
    expect(mountBar({ scale }).get('[data-testid="timeline-scale"]').text()).toBe(text)
  })

  it('uzaklaştır gün → hafta → ay; yakınlaştır tersi', async () => {
    const wide = mountBar({ scale: 'gun' })
    await wide.get('[data-action="zoom-out"]').trigger('click')
    expect(wide.emitted('update:scale')).toEqual([['hafta']])
    const zoomed = mountBar({ scale: 'ay' })
    await zoomed.get('[data-action="zoom-in"]').trigger('click')
    expect(zoomed.emitted('update:scale')).toEqual([['hafta']])
  })

  it('en geniş ölçekte (ay) Uzaklaştır, en dar ölçekte (gün) Yakınlaştır aria-disabled ve etkisiz', async () => {
    const month = mountBar({ scale: 'ay' })
    const out = month.get('[data-action="zoom-out"]')
    expect(out.attributes('aria-disabled')).toBe('true')
    expect(month.get('[data-action="zoom-in"]').attributes('aria-disabled')).toBeUndefined()
    await out.trigger('click')
    expect(month.emitted('update:scale')).toBeUndefined()

    const day = mountBar({ scale: 'gun' })
    const zoomIn = day.get('[data-action="zoom-in"]')
    expect(zoomIn.attributes('aria-disabled')).toBe('true')
    await zoomIn.trigger('click')
    expect(day.emitted('update:scale')).toBeUndefined()
  })
})

describe('dışa aktarım ve tam ekran (E-03C-10…12)', () => {
  it('hazır değilse (pilot doğrulanmadı) devre dışı "yakında"; tık hiçbir şey yayınlamaz', async () => {
    const bar = mountBar()
    for (const action of ['export-pdf', 'export-image']) {
      const button = bar.get(`[data-action="${action}"]`)
      expect(button.attributes('aria-disabled')).toBe('true')
      expect(button.attributes('title')).toContain('yakında')
      await button.trigger('click')
    }
    expect(bar.emitted('exportPdf')).toBeUndefined()
    expect(bar.emitted('exportImage')).toBeUndefined()
  })

  it('hazırsa canlı ve olay yayar', async () => {
    const bar = mountBar({ exportReady: true })
    const pdf = bar.get('[data-action="export-pdf"]')
    expect(pdf.attributes('aria-disabled')).toBeUndefined()
    expect(pdf.attributes('title')).toBe('PDF olarak dışa aktar')
    await pdf.trigger('click')
    await bar.get('[data-action="export-image"]').trigger('click')
    expect(bar.emitted('exportPdf')).toHaveLength(1)
    expect(bar.emitted('exportImage')).toHaveLength(1)
  })

  it('tam ekran aria-pressed; tık tersini yayar', async () => {
    const off = mountBar()
    const button = off.get('[data-action="fullscreen"]')
    expect(button.attributes('aria-pressed')).toBe('false')
    expect(button.attributes('aria-label')).toBe('Tam ekran')
    await button.trigger('click')
    expect(off.emitted('update:fullscreen')).toEqual([[true]])

    const on = mountBar({ fullscreen: true })
    const pressed = on.get('[data-action="fullscreen"]')
    expect(pressed.attributes('aria-pressed')).toBe('true')
    expect(pressed.attributes('aria-label')).toBe('Tam ekrandan çık')
    await pressed.trigger('click')
    expect(on.emitted('update:fullscreen')).toEqual([[false]])
  })
})
