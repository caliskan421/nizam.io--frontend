import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import FolderCard from './FolderCard.vue'

function card(over: Record<string, unknown> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/arsiv/:klasorId', name: 'archive.folder', component: { template: '<i />' } },
    ],
  })
  return mount(FolderCard, {
    props: {
      card: { folderId: 'd1', name: 'Mekanik sistemler', fileCount: 78, virtual: false, ...over },
    },
    global: { plugins: [i18n, router] },
  })
}

describe('klasör kartı (E-06-10…15)', () => {
  it('ad ve dosya sayısı canlı; bağlantı /arsiv/:klasorId', () => {
    const w = card()
    expect(w.get('.archive-folder__name').text()).toBe('Mekanik sistemler')
    expect(w.get('[data-field="meta"]').text()).toBe('78 dosya')
    expect(w.get('a').attributes('href')).toBe('/arsiv/d1')
  })

  it('görev sayısı, boyut ve son yükleme uydurulmaz: boyut/son yükleme statik —, görev sayısı yok', () => {
    const w = card()
    expect(w.get('[data-field="size"]').text()).toBe('—')
    expect(w.get('[data-field="last"]').text()).toBe('—')
    expect(w.text()).not.toMatch(/görev|MB|KB|\bgün\b/)
  })

  it('yönetici (sayı null): meta statik —, sahte sayı yok', () => {
    const w = card({ fileCount: null })
    expect(w.get('[data-field="meta"]').text()).toBe('—')
    expect(w.classes()).not.toContain('archive-folder--empty')
  })

  it('boş klasör (0): "Henüz dosya yok", soluk ama bağlantı', () => {
    const w = card({ fileCount: 0 })
    expect(w.get('[data-field="meta"]').text()).toBe('Henüz dosya yok')
    expect(w.classes()).toContain('archive-folder--empty')
  })

  it('"grup" / "çalışma grubu" rozeti DOM’da yok (P39)', () => {
    const w = card({ name: 'Elektrik ve enerji' })
    expect(w.text()).not.toMatch(/grup/i)
    expect(w.find('.rp-kicker[data-field="group"]').exists()).toBe(false)
  })

  it('düz sol tık open yayar ve gezinmeyi bırakır; değiştirici tuşlu tık yayamaz', async () => {
    const w = card()
    await w.get('a').trigger('click')
    expect(w.emitted('open')).toEqual([['d1']])
    // jsdom gerçek gezinmeyi uygulamaz: varsayılan eylemi susturur.
    w.element.addEventListener('click', (e: Event) => e.preventDefault())
    await w.get('a').trigger('click', { ctrlKey: true })
    await w.get('a').trigger('click', { metaKey: true })
    await w.get('a').trigger('click', { button: 1 })
    expect(w.emitted('open')).toHaveLength(1)
  })
})
