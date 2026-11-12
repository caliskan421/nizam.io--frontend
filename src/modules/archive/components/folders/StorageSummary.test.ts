import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import StorageSummary from './StorageSummary.vue'

const mounted = (props: { totalFiles: number | null; loading: boolean }) =>
  mount(StorageSummary, { props, global: { plugins: [i18n] } })

describe('depolama özeti (E-06-22…24)', () => {
  it('dosya adedi canlı; bayt toplamı ve dağılım statik —', () => {
    const w = mounted({ totalFiles: 333, loading: false })
    expect(w.get('[data-field="files"]').text()).toBe('333')
    expect(w.text()).toContain('dosya')
    expect(w.get('[data-field="bytes"]').text()).toBe('—')
    expect(w.get('[data-field="breakdown"]').text()).toBe('—')
  })

  it('sahte boyut/dağılım üretilmez: MB/KB, yüzde, “Diğer N klasör” yok; çubuk boş iz', () => {
    const w = mounted({ totalFiles: 12, loading: false })
    expect(w.text()).not.toMatch(/\d\s?(MB|KB|GB)|%|Diğer/)
    const bar = w.get('[role="img"]')
    expect(bar.element.children).toHaveLength(0)
    expect(bar.attributes('aria-label')).toBe('Depolama dağılımı bilinmiyor')
  })

  it('yönetici (null) ve yükleniyor: dosya adedi —', () => {
    expect(mounted({ totalFiles: null, loading: false }).get('[data-field="files"]').text()).toBe(
      '—',
    )
    const loading = mounted({ totalFiles: 5, loading: true })
    expect(loading.get('[data-field="files"]').text()).toBe('—')
  })
})
