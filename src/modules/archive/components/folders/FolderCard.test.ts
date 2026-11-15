import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
      card: {
        folderId: 'd1',
        name: 'Mekanik sistemler',
        fileCount: 78,
        taskCount: 8,
        totalBytes: 701_234_567,
        lastUploadedAt: '2026-10-24T10:00:00Z',
        virtual: false,
        ...over,
      },
    },
    global: { plugins: [i18n, router, createPinia()] },
  })
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-16T10:00:00Z'))
})
afterEach(() => vi.useRealTimers())

describe('klasör kartı (E-06-10…15)', () => {
  it('ad, "‹N› dosya · ‹M› görev", boyut ve son yükleme canlı; bağlantı /arsiv/:klasorId', () => {
    const w = card()
    expect(w.get('.archive-folder__name').text()).toBe('Mekanik sistemler')
    expect(w.get('[data-field="meta"]').text()).toBe('78 dosya · 8 görev')
    expect(w.get('[data-field="size"]').text()).toBe('668,7 MB')
    // 24 Eki → 16 Kas (kurulum saat diliminin takvim günleri): 23 gün.
    expect(w.get('[data-field="last"]').text()).toBe('23 gün')
    expect(w.get('a').attributes('href')).toBe('/arsiv/d1')
  })

  it('son yükleme göreli: bugün / dün / n gün; yükleme yoksa —', () => {
    expect(card({ lastUploadedAt: '2026-11-16T08:00:00Z' }).get('[data-field="last"]').text()).toBe(
      'bugün',
    )
    expect(card({ lastUploadedAt: '2026-11-15T08:00:00Z' }).get('[data-field="last"]').text()).toBe(
      'dün',
    )
    expect(card({ lastUploadedAt: null }).get('[data-field="last"]').text()).toBe('—')
  })

  it('boş klasör (0): "Henüz dosya yok", soluk ama bağlantı', () => {
    const w = card({ fileCount: 0, taskCount: 0, totalBytes: 0, lastUploadedAt: null })
    expect(w.get('[data-field="meta"]').text()).toBe('Henüz dosya yok')
    expect(w.get('[data-field="size"]').text()).toBe('0 B')
    expect(w.get('[data-field="last"]').text()).toBe('—')
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
