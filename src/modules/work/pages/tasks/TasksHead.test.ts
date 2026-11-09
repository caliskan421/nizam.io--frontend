import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TasksHead from './TasksHead.vue'

const summary = { tasks: 200, departments: 21, people: 185 }

describe('sayfa başlığı (E-03-03…06)', () => {
  it('küme tamsa kesin sayılar, etiket yok', () => {
    const head = mount(TasksHead, { props: { summary, complete: true, canCreate: true } })
    expect(head.get('h1').text()).toBe('Görevler')
    expect(head.get('[data-testid="tasks-summary"]').text()).toBe(
      '200 görev · 21 koordinatörlük · 185 kişi',
    )
  })

  it('imleç bitmediyse "n+" ve "yüklenen kayıtlar içinde" (E-03-04, P4)', () => {
    const head = mount(TasksHead, { props: { summary, complete: false, canCreate: false } })
    expect(head.get('[data-testid="tasks-summary"]').text()).toBe(
      '200+ görev · 21 koordinatörlük · 185 kişi · yüklenen kayıtlar içinde',
    )
  })

  it('görünüm seçici: Liste basılı, Zaman çizelgesi devre dışı + F3 notu (E-03-05)', () => {
    const head = mount(TasksHead, { props: { summary, complete: true, canCreate: false } })
    const [list, timeline] = head.get('[role="group"][aria-label="Görünüm"]').findAll('button')
    expect(list!.attributes('aria-pressed')).toBe('true')
    expect(timeline!.attributes('disabled')).toBeDefined()
    expect(timeline!.attributes('title')).toBe('Zaman çizelgesi — F3’te açılacak')
    expect(head.find('[data-design-stub]').exists()).toBe(false)
  })

  it('Yeni görev yalnız capability ile; tık create yayar (E-03-06)', async () => {
    const hidden = mount(TasksHead, { props: { summary, complete: true, canCreate: false } })
    expect(hidden.text()).not.toContain('Yeni görev')
    const head = mount(TasksHead, { props: { summary, complete: true, canCreate: true } })
    const button = head.findAll('button').find((b) => b.text() === 'Yeni görev')!
    await button.trigger('click')
    expect(head.emitted('create')).toHaveLength(1)
  })
})
