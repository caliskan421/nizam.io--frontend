import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import {
  ADMIN_SCOPE,
  dashboard,
  mountWith,
  resetAll,
  stat,
  type Mounted,
} from '../__tests__/harness'
import { COORD_SEARCH_DEBOUNCE_MS } from '../model/use-coord-controls'
import CoordinatorshipsSection from './CoordinatorshipsSection.vue'

afterEach(() => {
  vi.useRealTimers()
  resetAll()
})

const STATS = [
  stat('a', 'İdari işler', { overdue_tasks: 4, coordinators: [], total_tasks: 11 }),
  stat('b', 'Altyapı ve tesisat', { overdue_tasks: 3, total_tasks: 14 }),
  stat('c', 'Ulaşım planlama', { overdue_tasks: 3, total_tasks: 4 }),
  stat('d', 'Çevre', { overdue_tasks: 0 }),
]
const REPORT = dashboard({ coordinatorship_stats: STATS })

const mountSection = (props: Record<string, unknown> = { report: REPORT }) =>
  mountWith(CoordinatorshipsSection, ADMIN_SCOPE, props)
const names = ({ wrapper }: Mounted) => wrapper.findAll('a.rp-title').map((a) => a.text())
const filterButtons = ({ wrapper }: Mounted) =>
  wrapper.get('[aria-label="Durum filtresi"]').findAll('button')

describe('Koordinatörlükler bölgesi (E-01-21…28)', () => {
  it('başlık, ipucu (ölçüt açıklaması · kart sayısı), "Tümünü gör" → 08; varsayılan sıra Gecikme', async () => {
    const page = await mountSection()
    expect(page.wrapper.get('h2').text()).toBe('Koordinatörlükler')
    expect(page.wrapper.get('[data-testid="coords-hint"]').text()).toBe(
      'En çok gecikmesi olandan aza · 4 koordinatörlük',
    )
    expect(page.wrapper.get('[data-coords-all]').attributes('href')).toBe('/koordinatorlukler')
    // gecikme 4 > 3,3 (eşitte ad: Altyapı < Ulaşım) > 0
    expect(names(page)).toEqual(['İdari işler', 'Altyapı ve tesisat', 'Ulaşım planlama', 'Çevre'])
  })

  it('kart sayısı = coordinatorship_stats uzunluğu (kesme/200 uyarısı yok)', async () => {
    const many = Array.from({ length: 30 }, (_, i) => stat(`x${i}`, `Birim ${i}`))
    const page = await mountSection({ report: dashboard({ coordinatorship_stats: many }) })
    expect(page.wrapper.findAll('article')).toHaveLength(30)
    expect(page.wrapper.text()).not.toMatch(/kesil|200/)
  })

  it('durum süzgeci: kart kümesi ve ipucu sayısı değişir; sayılar sabit kalır', async () => {
    const page = await mountSection()
    expect(filterButtons(page).map((b) => b.text())).toEqual([
      'Tümü 4',
      'Gecikmesi olan 3',
      'Yolunda 1',
      'Koordinatörsüz 1',
    ])
    await filterButtons(page)[1]!.trigger('click')
    expect(names(page)).toEqual(['İdari işler', 'Altyapı ve tesisat', 'Ulaşım planlama'])
    expect(page.wrapper.get('[data-testid="coords-hint"]').text()).toContain('· 3 koordinatörlük')
    expect(filterButtons(page).map((b) => b.text())[0]).toBe('Tümü 4')
  })

  it('arama gecikmeli ve Türkçe katlamalı (İ/ı); süzgeç sayıları aramadan bağımsız', async () => {
    const page = await mountSection()
    vi.useFakeTimers()
    await page.wrapper.get('input[type="search"]').setValue('IDARI')
    expect(names(page)).toHaveLength(4)
    vi.advanceTimersByTime(COORD_SEARCH_DEBOUNCE_MS)
    await nextTick()
    expect(names(page)).toEqual(['İdari işler'])
    expect(page.wrapper.get('[data-testid="coords-hint"]').text()).toContain('· 1 koordinatörlük')
    expect(filterButtons(page)[0]!.text()).toBe('Tümü 4')
  })

  it('süzgeç sonucu 0 → boş kutu (E-01-27)', async () => {
    const page = await mountSection()
    vi.useFakeTimers()
    await page.wrapper.get('input[type="search"]').setValue('yokboyle')
    vi.advanceTimersByTime(COORD_SEARCH_DEBOUNCE_MS)
    await nextTick()
    expect(page.wrapper.get('[data-testid="coords-empty"]').text()).toBe(
      'Bu filtreyle eşleşen koordinatörlük yok.',
    )
    expect(page.wrapper.find('article').exists()).toBe(false)
  })

  it('sıralama: ölçüt seçimi ve ters çevirme kart sırasını değiştirir', async () => {
    const page = await mountSection()
    await page.wrapper.get('.home-sort__btn').trigger('click')
    await page.wrapper.get('[data-sort="name"]').trigger('click')
    expect(names(page)).toEqual(['Altyapı ve tesisat', 'Çevre', 'İdari işler', 'Ulaşım planlama'])
    await page.wrapper.get('.home-sort__btn').trigger('click')
    await page.wrapper.get('[data-sort="flip"]').trigger('click')
    expect(names(page)).toEqual(['Ulaşım planlama', 'İdari işler', 'Çevre', 'Altyapı ve tesisat'])
    expect(page.wrapper.get('.home-sort__btn').text()).toBe('Sırala: Ad ↑')
  })

  it('kapsam (mercek) değişince arama, süzgeç ve sıralama sıfırlanır (K2)', async () => {
    const page = await mountSection()
    await filterButtons(page)[3]!.trigger('click')
    await page.wrapper.get('.home-sort__btn').trigger('click')
    await page.wrapper.get('[data-sort="name"]').trigger('click')
    expect(names(page)).toEqual(['İdari işler'])
    page.store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    await nextTick()
    await nextTick()
    expect(names(page)).toHaveLength(4)
    expect(page.wrapper.get('.home-sort__btn').text()).toBe('Sırala: Gecikme ↓')
    expect(filterButtons(page)[0]!.attributes('aria-pressed')).toBe('true')
  })

  it('yükleniyor: iskelet kartlar, araç çubuğu yok; hata: bölge içi hata + yeniden dene', async () => {
    const loading = await mountSection({ report: null })
    expect(loading.wrapper.findAll('[data-ccard-skeleton]')).toHaveLength(3)
    expect(loading.wrapper.find('.rp-toolbar').exists()).toBe(false)
    expect(loading.wrapper.find('[data-testid="coords-hint"]').exists()).toBe(false)
    const failed = await mountSection({
      report: null,
      error: { messageKey: 'errors.unknown', requestId: 'req-1' },
    })
    expect(failed.wrapper.get('[role="alert"]').text()).toContain('Koordinatörlükler yüklenemedi')
    await failed.wrapper.get('[role="alert"] button').trigger('click')
    expect(failed.wrapper.findComponent(CoordinatorshipsSection).emitted('retry')).toHaveLength(1)
  })

  it('hiç koordinatörlük yok: "Programa departman katılmamış"', async () => {
    const page = await mountSection({ report: dashboard({ coordinatorship_stats: [] }) })
    expect(page.wrapper.get('[data-testid="coords-none"]').text()).toBe(
      'Programa departman katılmamış',
    )
    expect(page.wrapper.find('.rp-toolbar').exists()).toBe(false)
  })
})
