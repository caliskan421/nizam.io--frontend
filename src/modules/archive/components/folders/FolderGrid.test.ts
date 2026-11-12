import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18n } from '@/shared/i18n'

import FolderGrid from './FolderGrid.vue'

const cards = (n: number, counts = true) =>
  Array.from({ length: n }, (_, i) => ({
    folderId: `d${i}`,
    name: `Birim ${String(i).padStart(2, '0')}`,
    fileCount: counts ? i : null,
    virtual: false,
  }))

function grid(props: Record<string, unknown> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/arsiv/:klasorId', name: 'archive.folder', component: { template: '<i />' } },
    ],
  })
  const wrapper = mount(FolderGrid, {
    props: {
      cards: cards(3),
      sortField: 'ad',
      sortDirection: 'artan',
      loading: false,
      error: false,
      ...props,
    },
    global: { plugins: [i18n, router, createPinia()] },
    attachTo: document.body,
  })
  wrappers.push(wrapper)
  return wrapper
}

const wrappers: Array<{ unmount: () => void }> = []
afterEach(() => {
  for (const w of wrappers.splice(0)) w.unmount()
  document.body.innerHTML = ''
})

describe('koordinatörlük ızgarası (E-06-08/16)', () => {
  it('başlıkta kart sayısı; 12 veya daha azında "daha" bağlantısı yok', () => {
    const w = grid({ cards: cards(12) })
    expect(w.get('h2').text()).toContain('Koordinatörlükler')
    expect(w.get('.archive-coords__count').text()).toBe('12')
    expect(w.findAll('.rp-folder')).toHaveLength(12)
    expect(w.find('.archive-more').exists()).toBe(false)
  })

  it('ilk 12 kart + "N koordinatörlük daha"; tık yerinde genişletir, aynı düğme odakta kalır', async () => {
    const w = grid({ cards: cards(21) })
    expect(w.findAll('.rp-folder')).toHaveLength(12)
    const more = w.get('.archive-more')
    expect(more.text()).toBe('9 koordinatörlük daha')
    expect(w.get('.archive-coords__count').text()).toBe('21')
    ;(more.element as HTMLElement).focus()
    await more.trigger('click')
    expect(w.findAll('.rp-folder')).toHaveLength(21)
    expect(w.get('.archive-more').text()).toBe('Daha az göster')
    expect(document.activeElement).toBe(w.get('.archive-more').element)
    await w.get('.archive-more').trigger('click')
    expect(w.findAll('.rp-folder')).toHaveLength(12)
  })

  it('kart tıklaması open yayar', async () => {
    const w = grid()
    await w.findAll('.rp-folder')[1]!.trigger('click')
    expect(w.emitted('open')).toEqual([['d1']])
  })
})

describe('durumlar', () => {
  it('yükleniyor: kart yok, sayaç yok', () => {
    const w = grid({ loading: true, cards: [] })
    expect(w.find('[role="status"]').text()).toBe('Koordinatörlükler yükleniyor')
    expect(w.find('.archive-coords__count').exists()).toBe(false)
  })

  it('hata: ortak hata durumu + Yeniden dene → retry', async () => {
    const w = grid({ error: true, cards: [] })
    expect(w.text()).toContain('Koordinatörlükler yüklenemedi')
    await w
      .findAll('button')
      .find((b) => b.text() === 'Yeniden dene')!
      .trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
  })

  it('boş: ortak boş durum', () => {
    const w = grid({ cards: [] })
    expect(w.text()).toContain('Gösterilecek koordinatörlük yok')
    expect(w.find('.archive-more').exists()).toBe(false)
  })
})

describe('sıra düğmesi (E-06-09)', () => {
  const open = async (w: ReturnType<typeof grid>) => {
    await w.get('.archive-sort__btn').trigger('click')
    await flushPromises()
  }

  it('düğme geçerli sırayı söyler; menüde ad/dosya seçenekleri, "Son yükleme" devre dışı + BE-025', async () => {
    const w = grid()
    expect(w.get('.archive-sort__btn').text()).toBe('Sırala: Ada göre')
    expect(w.get('.archive-sort__btn').attributes('aria-expanded')).toBe('false')
    expect(w.get('.archive-sort__btn').attributes('aria-controls')).toBeUndefined()
    await open(w)
    expect(w.get('.archive-sort__btn').attributes('aria-controls')).toBe('archive-sort-menu')
    const items = w.findAll('[role="menuitemradio"]')
    expect(items.map((i) => i.text())).toEqual([
      'Ada göre (A → Z)',
      'Ada göre (Z → A)',
      'Dosya sayısı (çoktan aza)',
      'Dosya sayısı (azdan çoğa)',
      'Son yükleme',
    ])
    const last = w.get('[data-design-stub="BE-025"] [data-sort="sonYukleme"]')
    expect(last.attributes('disabled')).toBeDefined()
    expect(w.get('[data-sort="adArtan"]').attributes('aria-checked')).toBe('true')
  })

  it('seçim update:sort yayar, menüyü kapatır ve odağı düğmeye döndürür', async () => {
    const w = grid()
    await open(w)
    await w.get('[data-sort="dosyaAzalan"]').trigger('click')
    await flushPromises()
    expect(w.emitted('update:sort')).toEqual([['dosya', 'azalan']])
    expect(w.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(w.get('.archive-sort__btn').element)
  })

  it('aynı sıra seçilirse olay yok', async () => {
    const w = grid()
    await open(w)
    await w.get('[data-sort="adArtan"]').trigger('click')
    expect(w.emitted('update:sort')).toBeUndefined()
  })

  it('Esc menüyü kapatır ve odak düğmeye döner (gövdeye düşmez)', async () => {
    const w = grid()
    await open(w)
    await w.get('[role="menu"]').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(w.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(w.get('.archive-sort__btn').element)
  })

  it('Tab menüyü kapatır; odak zorla çekilmez', async () => {
    const w = grid()
    await open(w)
    await w.get('[role="menu"]').trigger('keydown', { key: 'Tab' })
    await flushPromises()
    expect(w.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).not.toBe(w.get('.archive-sort__btn').element)
  })

  it('düğmeye yeniden tık menüyü kapatır ve odak düğmede kalır; dışarı tık kapatır', async () => {
    const w = grid()
    await open(w)
    await w.get('.archive-sort__btn').trigger('click')
    await flushPromises()
    expect(w.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(w.get('.archive-sort__btn').element)
    await open(w)
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(w.find('[role="menu"]').exists()).toBe(false)
  })

  it('yönetici ızgarası (sayılar null): dosya sayısı seçenekleri devre dışı', async () => {
    const w = grid({ cards: cards(3, false) })
    await open(w)
    expect(w.get('[data-sort="dosyaAzalan"]').attributes('disabled')).toBeDefined()
    expect(w.get('[data-sort="dosyaArtan"]').attributes('disabled')).toBeDefined()
    expect(w.get('[data-sort="adAzalan"]').attributes('disabled')).toBeUndefined()
  })
})
