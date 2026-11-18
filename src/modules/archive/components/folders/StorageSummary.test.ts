import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import StorageSummary from './StorageSummary.vue'

type Props = InstanceType<typeof StorageSummary>['$props']

const mounted = (props: Partial<Props>) =>
  mount(StorageSummary, {
    props: { totalFiles: 0, totalBytes: 0, byType: [], byTag: [], loading: false, ...props },
    global: { plugins: [i18n] },
  })

const group = (w: ReturnType<typeof mounted>, axis: 'type' | 'tag') =>
  w.get(`[data-axis="${axis}"]`)
const rowKeys = (w: ReturnType<typeof mounted>, axis: 'type' | 'tag') =>
  group(w, axis)
    .findAll('li')
    .map((li) => li.attributes('data-key'))

describe('depolama özeti (E-06-22…24)', () => {
  it('bayt oranı dosya adedi değil: 3 PDF 100 B + 1 görsel 300 B ⇒ PDF %25, görsel %75; çubuk genişlikleri bayt oranı', () => {
    const w = mounted({
      totalFiles: 4,
      totalBytes: 400,
      byType: [
        { type: 'image', file_count: 1, total_bytes: 300 },
        { type: 'pdf', file_count: 3, total_bytes: 100 },
      ],
    })
    const text = group(w, 'type').text()
    expect(text).toMatch(/PDF[\s\S]*3 dosya[\s\S]*100 B[\s\S]*%25/)
    expect(text).toMatch(/Görsel[\s\S]*1 dosya[\s\S]*300 B[\s\S]*%75/)
    const widths = group(w, 'type')
      .findAll('.archive-storage__seg')
      .map((el) => el.attributes('style'))
    expect(widths[0]).toContain('width: 75%')
    expect(widths[1]).toContain('width: 25%')
    expect(group(w, 'type').get('[role="img"]').attributes('aria-label')).toMatch(
      /Görsel %75.*PDF %25/,
    )
  })

  it('iki eksen bağımsız; sunucu sırası korunur, kanonik sıraya dizilmez', () => {
    const w = mounted({
      totalFiles: 4,
      totalBytes: 400,
      byType: [
        { type: 'other', file_count: 1, total_bytes: 200 },
        { type: 'document', file_count: 3, total_bytes: 200 },
      ],
      byTag: [
        { tag: 'sonuc', file_count: 1, total_bytes: 200 },
        { tag: 'ister', file_count: 3, total_bytes: 200 },
      ],
    })
    expect(rowKeys(w, 'type')).toEqual(['other', 'document'])
    expect(rowKeys(w, 'tag')).toEqual(['sonuc', 'ister'])
    const tags = group(w, 'tag').findAll('li')
    expect(tags[0]!.text()).toContain('Sonuç')
    expect(tags[0]!.text()).toContain('1 dosya')
    expect(tags[0]!.text()).toContain('%50')
    expect(tags[1]!.text()).toContain('İster')
    expect(tags[1]!.text()).toContain('3 dosya')
    expect(tags[1]!.text()).toContain('%50')
  })

  it('pozitif adet, sıfır bayt: 0 B ve sıfır genişlik (NaN/Infinity yok), boş değil', () => {
    const w = mounted({
      totalFiles: 2,
      totalBytes: 0,
      byType: [{ type: 'pdf', file_count: 2, total_bytes: 0 }],
      byTag: [{ tag: 'plan', file_count: 2, total_bytes: 0 }],
    })
    const row = group(w, 'type').get('li')
    expect(row.text()).toContain('2 dosya')
    expect(row.text()).toContain('0 B')
    expect(row.text()).toContain('%0')
    expect(w.text()).not.toMatch(/NaN|Infinity/)
    expect(w.get('.archive-storage__seg').attributes('style')).toContain('width: 0%')
    expect(w.find('[data-field="empty"]').exists()).toBe(false)
  })

  it('gerçek boş: dosya yok ⇒ boş durum, sıfır genişlikli çubuk uydurulmaz', () => {
    const w = mounted({ totalFiles: 0, totalBytes: 0, byType: [], byTag: [] })
    expect(group(w, 'type').get('[data-field="empty"]').text()).toBe('Henüz dosya yok.')
    expect(group(w, 'tag').find('[data-field="empty"]').exists()).toBe(true)
    expect(w.find('.archive-storage__seg').exists()).toBe(false)
  })

  it('okunmadı (null), yükleniyor ve hata gerçek boştan ayrı: sahte sıfır/eski dağılım yok', async () => {
    const stale = [{ type: 'pdf' as const, file_count: 9, total_bytes: 9 }]
    const unread = mounted({ totalFiles: null, totalBytes: null, byType: null, byTag: null })
    expect(unread.get('[data-field="files"]').text()).toBe('—')
    expect(unread.get('[data-field="bytes"]').text()).toBe('—')
    expect(group(unread, 'type').get('[data-field="breakdown"]').text()).toBe('—')
    expect(unread.find('[data-field="empty"]').exists()).toBe(false)

    const loading = mounted({ totalFiles: 5, totalBytes: 9, byType: stale, loading: true })
    expect(loading.get('[data-field="files"]').text()).toBe('—')
    expect(group(loading, 'type').find('li').exists()).toBe(false)
    expect(group(loading, 'type').get('[data-field="breakdown"]').text()).toBe('—')

    const failed = mounted({ totalFiles: null, totalBytes: null, byType: null, byTag: null })
    await failed.setProps({ error: true })
    expect(failed.get('[data-field="error"]').text()).toContain('okunamadı')
    expect(failed.find('[data-field="empty"]').exists()).toBe(false)
    await failed.get('[data-action="retry"]').trigger('click')
    expect(failed.emitted('retry')).toHaveLength(1)
  })

  it('dosya sayısı ve toplam boyut canlı; klasör dağılımı iddiası yok', () => {
    const w = mounted({ totalFiles: 333, totalBytes: 701_234_567 })
    expect(w.get('[data-field="files"]').text()).toBe('333')
    expect(w.get('[data-field="bytes"]').text()).toBe('668,7 MB')
    expect(w.text()).not.toMatch(/klasör/i)
  })
})
