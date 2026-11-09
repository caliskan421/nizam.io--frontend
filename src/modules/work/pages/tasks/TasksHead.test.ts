import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import TasksHead from './TasksHead.vue'

const empty = { render: () => null }
const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/gorevler', name: 'work.tasks', component: empty },
      { path: '/zaman-cizelgesi', name: 'work.timeline', component: empty },
    ],
  })

function mountHead(props: Record<string, unknown>): VueWrapper {
  return mount(TasksHead, { props, global: { plugins: [makeRouter()] } })
}

const summary = { tasks: 200, departments: 21, people: 185 }

describe('sayfa başlığı (E-03-03…06)', () => {
  it('küme tamsa kesin sayılar, etiket yok', () => {
    const head = mountHead({ summary, complete: true, canCreate: true })
    expect(head.get('h1').text()).toBe('Görevler')
    expect(head.get('[data-testid="tasks-summary"]').text()).toBe(
      '200 görev · 21 koordinatörlük · 185 kişi',
    )
  })

  it('imleç bitmediyse "n+" ve "yüklenen kayıtlar içinde" (E-03-04, P4)', () => {
    const head = mountHead({ summary, complete: false, canCreate: false })
    expect(head.get('[data-testid="tasks-summary"]').text()).toBe(
      '200+ görev · 21 koordinatörlük · 185 kişi · yüklenen kayıtlar içinde',
    )
  })

  it('veri yokken (yükleniyor / hata) alt satır ve sayı yok', () => {
    const head = mountHead({ summary: null, complete: false, canCreate: true })
    expect(head.find('[data-testid="tasks-summary"]').exists()).toBe(false)
    expect(head.text()).not.toMatch(/\d/)
    expect(head.text()).not.toContain('yüklenen kayıtlar içinde')
  })

  it('görünüm seçici: Liste basılı, Zaman çizelgesi canlı (E-03-05, F3)', () => {
    const head = mountHead({ summary, complete: true, canCreate: false })
    const [list, timeline] = head.get('[role="group"][aria-label="Görünüm"]').findAll('button')
    expect(list!.attributes('aria-pressed')).toBe('true')
    expect(timeline!.attributes('aria-pressed')).toBe('false')
    expect(timeline!.attributes('disabled')).toBeUndefined()
    expect(timeline!.attributes('title')).toBeUndefined()
    expect(timeline!.attributes('data-phase')).toBeUndefined()
    expect(head.find('[data-design-stub]').exists()).toBe(false)
  })

  it('Zaman çizelgesi tıklaması /zaman-cizelgesi’ne geçer; süzgeç taşınmaz (E-03C-03)', async () => {
    const router = makeRouter()
    await router.push('/gorevler?durum=geciken&ara=x')
    const head = mount(TasksHead, {
      props: { summary, complete: true, canCreate: false },
      global: { plugins: [router] },
    })
    await head.get('[data-testid="tasks-view-timeline"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/zaman-cizelgesi')
  })

  it('Yeni görev yalnız capability ile; tık create yayar (E-03-06)', async () => {
    const hidden = mountHead({ summary, complete: true, canCreate: false })
    expect(hidden.text()).not.toContain('Yeni görev')
    const head = mountHead({ summary, complete: true, canCreate: true })
    const button = head.findAll('button').find((b) => b.text() === 'Yeni görev')!
    await button.trigger('click')
    expect(head.emitted('create')).toHaveLength(1)
  })
})
