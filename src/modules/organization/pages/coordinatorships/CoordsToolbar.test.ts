import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import CoordsToolbar from './CoordsToolbar.vue'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

function toolbar(props: Record<string, unknown> = {}) {
  return mount(CoordsToolbar, {
    props: { search: '', direction: 'artan', ...props },
    attachTo: document.body,
  })
}

describe('görünüm seçici (E-08-12)', () => {
  it('"Liste" basılı; "Yapı" devre dışı + BE-016 stub', () => {
    const w = toolbar()
    expect(w.get('[data-view="liste"]').attributes('aria-pressed')).toBe('true')
    const tree = w.get('[data-design-stub="BE-016"] [data-view="yapi"]')
    expect(tree.attributes('disabled')).toBeDefined()
    expect(tree.attributes('aria-pressed')).toBe('false')
  })
})

describe('gizli öğeler (E-08-14, E-08-15)', () => {
  it('durum seçici ve üst birim süzgeci DOM’da yok', () => {
    const w = toolbar()
    expect(w.text()).not.toMatch(/Aktif|Pasif|Üst birim/)
  })
})

describe('arama (E-08-13)', () => {
  it('yer tutucu; ~300 ms gecikmeyle tek yazım', async () => {
    const w = toolbar()
    const input = w.get('input[type="search"]')
    expect(input.attributes('placeholder')).toBe('Koordinatörlük, kod veya koordinatör ara…')
    await input.setValue('me')
    await input.setValue('mek')
    vi.advanceTimersByTime(299)
    expect(w.emitted('update:search')).toBeUndefined()
    vi.advanceTimersByTime(1)
    expect(w.emitted('update:search')).toEqual([['mek']])
  })

  it('dışarıdan değişim bekleyen yazımı düşürür ve kutuyu eşitler', async () => {
    const w = toolbar({ search: 'eski' })
    await w.get('input').setValue('yeni')
    await w.setProps({ search: '' })
    vi.advanceTimersByTime(400)
    expect(w.emitted('update:search')).toBeUndefined()
    expect((w.get('input').element as HTMLInputElement).value).toBe('')
  })
})

describe('sıralama (E-08-16)', () => {
  it('"Sırala: Ada göre" → iki yön; seçim yön yayar, menü kapanır', async () => {
    const w = toolbar()
    const btn = w.get('.coords-sort__btn')
    expect(btn.text()).toBe('Sırala: Ada göre')
    await btn.trigger('click')
    const items = w.findAll('[role="menuitemradio"]')
    expect(items.map((i) => [i.text(), i.attributes('aria-checked')])).toEqual([
      ['Ada göre (A → Z)', 'true'],
      ['Ada göre (Z → A)', 'false'],
    ])
    await items[1]!.trigger('click')
    await flushPromises()
    expect(w.emitted('update:direction')).toEqual([['azalan']])
    expect(w.find('[role="menu"]').exists()).toBe(false)
  })

  it('aynı yön seçilirse olay yok', async () => {
    const w = toolbar()
    await w.get('.coords-sort__btn').trigger('click')
    await w.findAll('[role="menuitemradio"]')[0]!.trigger('click')
    expect(w.emitted('update:direction')).toBeUndefined()
  })
})
