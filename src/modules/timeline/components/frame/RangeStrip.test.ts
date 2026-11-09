import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import RangeStrip from './RangeStrip.vue'

const range = { start: '2026-06-01', end: '2026-06-30' }
const base = {
  range,
  histogram: [1, 0, 3, 2, 1],
  view: { start: '2026-06-08', end: '2026-06-14' },
  today: '2026-06-16',
  year: null,
}
const mountStrip = (props: Record<string, unknown> = {}) =>
  mount(RangeStrip, { props: { ...base, ...props }, attachTo: document.body })

describe('görev aralığı şeridi (E-03C-14…18)', () => {
  it('etiket "görev aralığı" + aralık; "sezon" sözcüğü yok; aria-label aralığı söyler', () => {
    const strip = mountStrip()
    expect(strip.get('[data-testid="timeline-strip-kicker"]').text()).toBe('görev aralığı')
    expect(strip.text()).toContain('1 Haz – 30 Haz')
    expect(strip.text().toLowerCase()).not.toContain('sezon')
    expect(strip.get('[data-testid="timeline-strip-track"]').attributes('aria-label')).toBe(
      'Görev aralığı genel bakışı: 1 Haz – 30 Haz; görünen aralık 8 Haz – 14 Haz',
    )
  })

  it('Program.year varsa ayrıca yıl', () => {
    expect(mountStrip({ year: 2026 }).get('[data-testid="timeline-strip-kicker"]').text()).toBe(
      'görev aralığı 2026',
    )
  })

  it('aralık yoksa (tarihli görev yok) şerit çizilmez', () => {
    const strip = mountStrip({ range: null, histogram: [], view: null })
    expect(strip.find('[data-testid="timeline-strip"]').exists()).toBe(false)
  })

  it('histogram: hafta başına çubuk, boş hafta iz; son çubuk kısmi orantılı', () => {
    const strip = mountStrip()
    const bars = strip.findAll('[data-bar]')
    expect(bars).toHaveLength(5)
    expect(bars[1]!.classes()).toContain('tl-strip__bar--empty')
    const grows = bars.map((b) => (b.element as HTMLElement).style.flexGrow)
    expect(grows).toEqual(['7', '7', '7', '7', '2'])
    expect((bars[2]!.element as HTMLElement).style.height).toBe('100%')
  })

  it('görünen aralık çerçevesi ve bugün / baktığın yer işaretleri aralığa göre konumlanır', () => {
    const strip = mountStrip()
    const frame = strip.get('[data-testid="timeline-strip-frame"]').element as HTMLElement
    expect(parseFloat(frame.style.left)).toBeCloseTo((7 / 30) * 100, 5)
    expect(parseFloat(frame.style.width)).toBeCloseTo((7 / 30) * 100, 5)
    const today = strip.get('[data-testid="timeline-strip-today"]').element as HTMLElement
    expect(parseFloat(today.style.left)).toBeCloseTo((15 / 30) * 100, 5)
    const here = strip.get('[data-testid="timeline-strip-here"]').element as HTMLElement
    expect(parseFloat(here.style.left)).toBeCloseTo((10 / 30) * 100, 5)
  })

  it('bugün aralık dışındaysa işaret yok; görünen aralık yoksa çerçeve ve baktığın yer yok', () => {
    const outside = mountStrip({ today: '2026-08-01' })
    expect(outside.find('[data-testid="timeline-strip-today"]').exists()).toBe(false)
    const noView = mountStrip({ view: null })
    expect(noView.find('[data-testid="timeline-strip-frame"]').exists()).toBe(false)
    expect(noView.find('[data-testid="timeline-strip-here"]').exists()).toBe(false)
  })

  it('tık, konumdan günü seek olarak yayar (sürükleme yok)', async () => {
    const strip = mountStrip()
    const track = strip.get('[data-testid="timeline-strip-track"]')
    track.element.getBoundingClientRect = () =>
      ({ left: 100, width: 300, top: 0, height: 32 }) as DOMRect
    track.element.dispatchEvent(new MouseEvent('click', { clientX: 250, detail: 1, bubbles: true }))
    await nextTick()
    expect(strip.emitted('seek')).toEqual([['2026-06-16']])
  })

  it('klavye: Enter görünen aralığın başına; ←/→ bir hafta kaydırır', async () => {
    const strip = mountStrip()
    const track = strip.get('[data-testid="timeline-strip-track"]')
    track.element.dispatchEvent(new MouseEvent('click', { detail: 0, bubbles: true }))
    await nextTick()
    await track.trigger('keydown', { key: 'ArrowRight' })
    await track.trigger('keydown', { key: 'ArrowLeft' })
    await track.trigger('keydown', { key: 'a' })
    expect(strip.emitted('seek')).toEqual([['2026-06-08'], ['2026-06-15'], ['2026-06-01']])
  })
})
