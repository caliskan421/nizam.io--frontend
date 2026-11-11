import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { createTestRouter } from './__tests__/tracking-harness'
import { groupRows, type TrackingItem } from './model'
import TrackingTable from './TrackingTable.vue'

const TODAY = '2026-11-11'

function item(id: string, patch: Partial<TrackingItem> = {}): TrackingItem {
  return {
    work_item_id: id,
    department_id: 'd1',
    title: `Görev ${id}`,
    status: 'devam_ediyor',
    end_on: '2026-11-20',
    is_overdue: false,
    days_overdue: 0,
    ...patch,
  }
}

async function render(items: TrackingItem[], loading = false) {
  const router = createTestRouter()
  await router.push('/kullanicilar/u1')
  return mount(TrackingTable, {
    props: {
      name: 'Bahar Kılıç',
      groups: groupRows(items, 'son-tarih', TODAY),
      codes: new Map([['d1', 'MEK']]),
      today: TODAY,
      loading,
    },
    global: { plugins: [router] },
  })
}

describe('gruplu görev tablosu (E-05-59…67)', () => {
  it('başlık satırı, grup sayıları, 5 durum noktası/etiketi', async () => {
    const wrapper = await render([
      item('a', { status: 'baslanmadi' }),
      item('b', { status: 'devam_ediyor' }),
      item('c', { status: 'onaya_sunuldu' }),
      item('d', { status: 'iade_edildi' }),
      item('e', { status: 'tamamlandi' }),
    ])
    expect(wrapper.findAll('[role="columnheader"]').map((h) => h.text())).toEqual([
      'görev',
      'durum',
      'bitiş',
      'kanıt',
    ])
    expect(wrapper.find('[data-group="later"] [data-group-count]').text()).toBe('5')
    const dots = wrapper.findAll('.rp-tr--body .rp-dot').map((d) => d.classes()[1])
    expect(dots).toEqual([
      'rp-dot--todo',
      'rp-dot--doing',
      'rp-dot--review',
      'rp-dot--back',
      'rp-dot--done',
    ])
    expect(wrapper.findAll('[data-status]').map((s) => s.text())).toEqual([
      'Başlamadı',
      'Devam ediyor',
      'Onay bekliyor',
      'Geri gönderildi',
      'Tamamlandı',
    ])
    // Tamamlanmış satırda bitiş notu yok.
    expect(wrapper.find('[data-work-item="e"] [data-due-note]').exists()).toBe(false)
  })

  it('kodsuz birimde kod boş; kanıt statik "—" (stub yok)', async () => {
    const wrapper = await render([item('a'), item('b', { department_id: 'd2' })])
    expect(wrapper.find('[data-work-item="a"] [data-code]').text()).toBe('MEK')
    expect(wrapper.find('[data-work-item="b"] [data-code]').text()).toBe('')
    expect(wrapper.find('[data-evidence]').text()).toBe('—')
    expect(wrapper.find('[data-evidence]').attributes('data-design-stub')).toBeUndefined()
  })

  it('boş küme → boş durum; yükleniyor → iskelet satırlar', async () => {
    const empty = await render([])
    expect(empty.find('[data-table-empty]').text()).toBe('Bu karta uyan görev yok')
    const loading = await render([], true)
    expect(loading.findAll('[data-skeleton]')).toHaveLength(3)
    expect(loading.find('[role="table"]').attributes('aria-busy')).toBe('true')
  })
})
