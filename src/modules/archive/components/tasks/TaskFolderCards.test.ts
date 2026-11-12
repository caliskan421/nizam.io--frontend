import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import type { TaskFolderCardsProps } from '../index'
import TaskFolderCards from './TaskFolderCards.vue'

const TASKS = [
  { work_item_id: 'w1', title: 'Gölgelendirme çalışmaları (kamelya)', file_count: 2 },
  { work_item_id: 'w2', title: 'İklimlendirme hesaplarının yapılması', file_count: 1 },
]

const mounted: ReturnType<typeof mount>[] = []
function mountCards(over: Partial<TaskFolderCardsProps> = {}) {
  const wrapper = mount(TaskFolderCards, {
    props: { tasks: TASKS, selectedTaskId: null, truncated: false, loading: false, ...over },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  return wrapper
}
afterEach(() => {
  for (const w of mounted.splice(0)) w.unmount()
})

describe('TaskFolderCards (E-06-36/37)', () => {
  it('başlık, açıklama ve kartlar: tam görev adı + "‹N› dosya"', () => {
    const w = mountCards()
    expect(w.find('h2').text()).toBe('Görev klasörleri')
    expect(w.text()).toContain('Her görev kendi klasörü')
    const cards = w.findAll('button.arch-task')
    expect(cards.map((c) => c.text())).toEqual([
      'Gölgelendirme çalışmaları (kamelya)2 dosya',
      'İklimlendirme hesaplarının yapılması1 dosya',
    ])
  })

  it('seçili kart aria-pressed; tıklama select(id), seçiliye tıklama select(null)', async () => {
    const w = mountCards({ selectedTaskId: 'w1' })
    expect(w.find('[data-task-id="w1"]').attributes('aria-pressed')).toBe('true')
    expect(w.find('[data-task-id="w2"]').attributes('aria-pressed')).toBe('false')
    await w.find('[data-task-id="w2"]').trigger('click')
    await w.find('[data-task-id="w1"]').trigger('click')
    expect(w.emitted('select')).toEqual([['w2'], [null]])
  })

  it('yükleniyor iskeleti, boş durum ve kesilme uyarısı', async () => {
    const w = mountCards({ loading: true, tasks: [] })
    expect(w.find('[aria-busy="true"]').exists()).toBe(true)
    expect(w.find('button.arch-task').exists()).toBe(false)
    await w.setProps({ loading: false })
    expect(w.find('[data-testid="tasks-empty"]').text()).toBe('Bu klasörde dosyalı görev yok')
    await w.setProps({ truncated: true })
    expect(w.text()).toContain('Görev listesi kesildi')
  })
})
