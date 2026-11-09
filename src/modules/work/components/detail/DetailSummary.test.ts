import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { workItem } from '../../model/__tests__/harness'
import type { WorkItemFile } from '../../model/types'
import DetailSummary from './DetailSummary.vue'

const TZ = 'Europe/Istanbul'

function file(name: string): WorkItemFile {
  return {
    file_id: name,
    work_item_id: 'w1',
    display_name: name,
    content_type: 'application/pdf',
    size_bytes: 10,
    tag: 'plan',
    uploaded_by_account_id: 'acc-1',
    uploaded_by_full_name: 'Ayşe',
  }
}

function mountSummary(files: WorkItemFile[] | null, over = {}) {
  return mount(DetailSummary, { props: { item: workItem(over), files, timeZone: TZ } })
}

describe('Özet sekmesi (E-03-46…50)', () => {
  it('atanan LİSTESİ; null ad → "Bilinmeyen kişi" (E-03-46)', () => {
    const wrapper = mountSummary([], {
      assignees: [
        { account_id: 'a', full_name: 'Ayşe Yılmaz' },
        { account_id: 'b', full_name: null },
      ],
    })
    const items = wrapper.get('[data-testid="detail-assignees"]').findAll('li')
    expect(items.map((li) => li.text())).toEqual(['Ayşe Yılmaz', 'Bilinmeyen kişi'])
  })

  it('oluşturan, tanımlandı (kurulum günü), tarih aralığı (E-03-47…49)', () => {
    const wrapper = mountSummary([], {
      created_by_full_name: null,
      created_at: '2026-06-09T22:30:00Z',
      start_on: '2026-07-20',
      end_on: '2026-07-25',
    })
    expect(wrapper.get('[data-testid="detail-creator"]').text()).toBe('Bilinmeyen kişi')
    expect(wrapper.get('[data-testid="detail-created"]').text()).toBe('10.06.2026')
    expect(wrapper.get('[data-testid="detail-range"]').text()).toBe('20.07 → 25.07.2026')
  })

  it('kanıt dosyası: boş → "Yok", dolu → son dosya adı; bağlantı devre dışı "F5" notu, stub yok (E-03-50)', () => {
    const empty = mountSummary([]).get('[data-testid="detail-evidence"]')
    expect(empty.text()).toBe('Yok')
    expect(empty.attributes('disabled')).toBeDefined()
    expect(empty.attributes('title')).toContain('F5')
    expect(empty.attributes('data-design-stub')).toBeUndefined()

    const filled = mountSummary([file('ilk.pdf'), file('rapor.pdf')])
    expect(filled.get('[data-testid="detail-evidence"]').text()).toBe('rapor.pdf')
    expect(mountSummary(null).get('[data-testid="detail-evidence"]').text()).toBe('—')
  })

  it('ilerleme çizgisi Özet içinde', () => {
    expect(mountSummary([]).find('.rp-timeline').exists()).toBe(true)
  })
})
