import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import StorageSummary from './StorageSummary.vue'

const mounted = (props: {
  totalFiles: number | null
  loading: boolean
  totalBytes?: number | null
}) => mount(StorageSummary, { props: { totalBytes: null, ...props }, global: { plugins: [i18n] } })

describe('depolama özeti (E-06-22…24)', () => {
  it("dosya adedi ve toplam boyut `totals`'tan canlı; dağılım statik — (BE-025 kısmi)", () => {
    const w = mounted({ totalFiles: 333, totalBytes: 701_234_567, loading: false })
    expect(w.get('[data-field="files"]').text()).toBe('333')
    expect(w.text()).toContain('dosya')
    expect(w.get('[data-field="bytes"]').text()).toBe('668,7 MB')
    expect(w.get('[data-field="breakdown"]').text()).toBe('—')
  })

  it('sahte dağılım üretilmez: yüzde, “Diğer N klasör” yok; çubuk boş iz', () => {
    const w = mounted({ totalFiles: 12, totalBytes: 0, loading: false })
    expect(w.get('[data-field="bytes"]').text()).toBe('0 B')
    expect(w.text()).not.toMatch(/%|Diğer/)
    const bar = w.get('[role="img"]')
    expect(bar.element.children).toHaveLength(0)
    expect(bar.attributes('aria-label')).toBe('Depolama dağılımı bilinmiyor')
  })

  it('okunmadı (null) ve yükleniyor: dosya adedi ve boyut —', () => {
    const unread = mounted({ totalFiles: null, loading: false })
    expect(unread.get('[data-field="files"]').text()).toBe('—')
    expect(unread.get('[data-field="bytes"]').text()).toBe('—')
    const loading = mounted({ totalFiles: 5, totalBytes: 9, loading: true })
    expect(loading.get('[data-field="files"]').text()).toBe('—')
    expect(loading.get('[data-field="bytes"]').text()).toBe('—')
  })
})
