import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TimelineHead from './TimelineHead.vue'

const base = {
  taskCount: 263,
  doneCount: 158,
  overdueCount: 91,
  approximate: false,
  canCreateTask: true,
}

describe('zaman çizelgesi başlığı (E-03C-02…04)', () => {
  it('başlık ve sayaçlar yüklü yanıttan, kesin sayılar', () => {
    const head = mount(TimelineHead, { props: base })
    expect(head.get('h1').text()).toBe('Görevler')
    expect(head.get('[data-testid="timeline-summary"]').text()).toBe(
      '263 görev · 158 bitti · 91 gecikmede',
    )
    expect(head.get('[data-part="overdue"]').classes()).toContain('tl-head__danger')
  })

  it('sunucu kesilme bildirince (approximate) "N+" ve "yüklenen kayıtlar içinde" (E-03C-02, 82)', () => {
    const head = mount(TimelineHead, {
      props: { ...base, taskCount: 200, doneCount: 120, overdueCount: 30, approximate: true },
    })
    expect(head.get('[data-testid="timeline-summary"]').text()).toBe(
      '200+ görev · 120+ bitti · 30+ gecikmede · yüklenen kayıtlar içinde',
    )
  })

  it('veri yokken (pending) sayaç satırı yok: "0 görev" yanıltıcı olmaz', () => {
    const head = mount(TimelineHead, { props: { ...base, taskCount: 0, pending: true } })
    expect(head.find('[data-testid="timeline-summary"]').exists()).toBe(false)
    expect(head.text()).not.toMatch(/\d/)
  })

  it('görünüm segmenti: Zaman çizelgesi basılı, Liste basılı değil (E-03C-03)', () => {
    const head = mount(TimelineHead, { props: base })
    const [list, timeline] = head.get('[role="group"][aria-label="Görünüm"]').findAll('button')
    expect(list!.text()).toBe('Liste')
    expect(list!.attributes('aria-pressed')).toBe('false')
    expect(timeline!.text()).toBe('Zaman çizelgesi')
    expect(timeline!.attributes('aria-pressed')).toBe('true')
    expect(timeline!.attributes('disabled')).toBeUndefined()
  })

  it('Liste tıklaması showList yayar; basılı Zaman çizelgesi yayınlamaz', async () => {
    const head = mount(TimelineHead, { props: base })
    const [list, timeline] = head.get('[role="group"]').findAll('button')
    await timeline!.trigger('click')
    expect(head.emitted('showList')).toBeUndefined()
    await list!.trigger('click')
    expect(head.emitted('showList')).toHaveLength(1)
    // Segment kendi seçimini tutmaz: sayfa rota değiştirir, basılı olan hep Zaman çizelgesi.
    expect(timeline!.attributes('aria-pressed')).toBe('true')
  })

  it('Yeni görev yalnız canCreateTask ile; tık newTask yayar (E-03C-04)', async () => {
    const hidden = mount(TimelineHead, { props: { ...base, canCreateTask: false } })
    expect(hidden.text()).not.toContain('Yeni görev')
    const head = mount(TimelineHead, { props: base })
    await head
      .findAll('button')
      .find((b) => b.text() === 'Yeni görev')!
      .trigger('click')
    expect(head.emitted('newTask')).toHaveLength(1)
  })
})
