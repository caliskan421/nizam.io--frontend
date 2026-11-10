import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { link, manyTasks, task } from '../../model/__tests__/gantt-fixtures'
import type { GanttLink, GanttTask } from '../../model/types'
import GanttView from './GanttView.vue'
import { NAMES, TODAY } from './gantt-test-support'

const TASKS: GanttTask[] = [
  task({
    work_item_id: 'a',
    department_id: 'd1',
    title: 'Hidrofor',
    start_on: '2026-11-04',
    end_on: '2026-11-20',
  }),
  task({
    work_item_id: 'b',
    department_id: 'd1',
    title: 'Arıtma',
    start_on: '2026-11-09',
    end_on: '2026-11-14',
  }),
  task({
    work_item_id: 'c',
    department_id: 'd2',
    title: 'Boru hattı',
    start_on: '2026-11-03',
    end_on: '2026-11-05',
  }),
]

function mountView(
  over: Record<string, unknown> = {},
  tasks: GanttTask[] = TASKS,
  links: GanttLink[] = [],
) {
  return mount(GanttView, {
    props: {
      tasks,
      links,
      scale: 'hafta',
      today: TODAY,
      departmentNames: NAMES,
      selectedId: null,
      draggableIds: new Set<string>(),
      ...over,
    },
    attachTo: document.body,
  })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Gantt kabı (E-03C-21…43)', () => {
  it('başlık "görev", eksen, bugün çizgisi, sol sütun treegrid ve çubuk katmanı birlikte', () => {
    const view = mountView()
    expect(view.get('.gantt__corner').text()).toBe('görev')
    expect(view.find('.gantt-axis').exists()).toBe(true)
    expect(view.find('[data-gantt="today-line"]').exists()).toBe(true)
    expect(view.get('[role="treegrid"]').attributes('aria-rowcount')).toBe('5')
    expect(view.findAll('.gantt-bar')).toHaveLength(3)
    expect(view.attributes('data-scale')).toBe('hafta')
  })

  it('eksen ve çubuk geometrisi aynı aralık ve ölçekle hizalı', () => {
    const view = mountView()
    const axisW = Number(view.get('.gantt-axis').attributes('width'))
    expect(Number(view.get('.gantt__layer--bars').attributes('width'))).toBe(axisW)
    expect(Number(view.get('.gantt__layer--links').attributes('width'))).toBe(axisW)
    expect(axisW % 6).toBe(0)
  })

  it('çubuk katmanı yüksekliği = satırların toplamı (40 + 44)', () => {
    const view = mountView()
    expect(view.get('.gantt__layer--bars').attributes('height')).toBe(String(2 * 40 + 3 * 44))
  })

  it('görev seçimi yukarı çıkar ve canlı bölgede duyurulur', async () => {
    const view = mountView()
    await view.get('[data-row-key="a"]').trigger('click')
    await view.get('[data-work-item="b"]').trigger('click')
    expect(view.emitted('select')).toEqual([['a'], ['b']])
    expect(view.get('[role="status"]').text()).toBe('Arıtma seçildi')
  })

  it('grup aç/kapa: görev satırları ve çubukları kalkar, aria-expanded ve duyuru güncellenir', async () => {
    const view = mountView()
    await view.get('[data-row-key="g:d1"]').trigger('click')
    expect(view.get('[data-row-key="g:d1"]').attributes('aria-expanded')).toBe('false')
    expect(view.find('[data-row-key="a"]').exists()).toBe(false)
    expect(view.find('[data-work-item="a"]').exists()).toBe(false)
    expect(view.find('[data-work-item="c"]').exists()).toBe(true)
    expect(view.get('[role="status"]').text()).toBe('Mekanik sistemler kapatıldı')
    expect(view.get('.gantt__layer--bars').attributes('height')).toBe(String(2 * 40 + 44))
    await view.get('[data-row-key="g:d1"]').trigger('keydown', { key: 'ArrowRight' })
    expect(view.find('[data-row-key="a"]').exists()).toBe(true)
    expect(view.get('[role="status"]').text()).toBe('Mekanik sistemler açıldı')
  })

  it('kapalı grup uçlu bağa ok çizilmez (P19)', async () => {
    const view = mountView({}, TASKS, [link({ dependency_id: 'l1', source: 'c', target: 'a' })])
    expect(view.findAll('[data-link]')).toHaveLength(1)
    await view.get('[data-row-key="g:d1"]').trigger('click')
    expect(view.findAll('[data-link]')).toHaveLength(0)
  })

  it('seçili ve sürüklenebilir görevde iki tutamaç, seçili satır aria-selected', () => {
    const view = mountView({ selectedId: 'a', draggableIds: new Set(['a']) })
    expect(view.findAll('[data-handle]')).toHaveLength(2)
    expect(view.findAll('[data-row-key="a"][aria-selected="true"]')).toHaveLength(1)
  })

  it('üye yüzü: sürüklenebilir kimlik yok → tutamaç yok', () => {
    const view = mountView({ selectedId: 'a' })
    expect(view.find('[data-handle]').exists()).toBe(false)
  })

  it('açılışta görünen aralık yayılır (şerit için)', () => {
    const view = mountView()
    const [[first]] = view.emitted('scroll') as [[{ start: string; end: string }]]
    expect(first.start >= '2026-10-01').toBe(true)
    expect(first.end > first.start).toBe(true)
  })

  it('ölçek değişince yeniden çizilir (gün ölçeğinde hafta sonu gölgesi)', async () => {
    const view = mountView()
    expect(view.findAll('.gantt-grid__weekend')).toHaveLength(0)
    await view.setProps({ scale: 'gun' })
    await nextTick()
    expect(view.attributes('data-scale')).toBe('gun')
    expect(view.findAll('.gantt-grid__weekend').length).toBeGreaterThan(0)
    expect(view.get('.gantt-axis__tick').text()).toMatch(/^\d+ [A-ZÇĞİÖŞÜ][a-zçğıöşü]{2}$/)
  })

  it('klavye: End son satıra gider ve pencere o satırı kapsar; Home başa döner', async () => {
    const view = mountView({}, manyTasks(250))
    const first = view.get('[role="row"][tabindex="0"]')
    ;(first.element as HTMLElement).focus()
    await first.trigger('keydown', { key: 'End' })
    await nextTick()
    const rows = view.findAll('[role="row"]')
    expect(rows.at(-1)!.attributes('aria-rowindex')).toBe(
      view.get('[role="treegrid"]').attributes('aria-rowcount'),
    )
    expect(document.activeElement).toBe(rows.at(-1)!.element)
    await rows.at(-1)!.trigger('keydown', { key: 'Home' })
    await nextTick()
    expect(document.activeElement).toBe(view.findAll('[role="row"]')[0]!.element)
  })

  it('tarih kısayolu işleyicisi çağırana iletilir (W95 uzantı noktası)', async () => {
    const seen: unknown[] = []
    const view = mountView({ dateKeyHandler: (r: unknown) => void seen.push(r) })
    await view.get('[data-row-key="a"]').trigger('keydown', { key: 'ArrowRight', shiftKey: true })
    expect(seen).toEqual([{ workItemId: 'a', edge: 'end', days: 1 }])
  })
})

describe('scrollToDay (şerit tıklaması)', () => {
  it('dışa açılır, görünen aralığı günü içerecek biçimde yayar', () => {
    const view = mountView({ scale: 'gun' })
    const vm = view.vm as unknown as { scrollToDay: (d: string) => void }
    expect(typeof vm.scrollToDay).toBe('function')
    vm.scrollToDay('2026-11-20')
    expect(view.get('.gantt__scroller').element.scrollLeft).toBeGreaterThanOrEqual(0)
    vm.scrollToDay('bozuk')
  })

  it('oklar çubuk katmanının altında çizilir (metni kesmez)', () => {
    const view = mountView({}, TASKS, [link({ dependency_id: 'l1', source: 'c', target: 'a' })])
    const layers = [...view.element.querySelectorAll('.gantt__layer')].map((n) => n.classList[1])
    expect(layers.indexOf('gantt__layer--links')).toBeLessThan(layers.indexOf('gantt__layer--bars'))
  })

  it('tutamaç dokunmatik kaydırmayı yakalamaz (css)', async () => {
    const { readFileSync } = await import('node:fs')
    const css = readFileSync('src/modules/timeline/components/gantt/gantt.css', 'utf8')
    expect(css).toMatch(/\.gantt-handle \{[^}]*touch-action: none/)
    expect(css).toMatch(/\.gantt-handle__hit \{[^}]*touch-action: none/)
  })
})

describe('250 görev + 60 bağ (sanallaştırma)', () => {
  const tasks = manyTasks(250)
  const links = Array.from({ length: 60 }, (_, i) =>
    link({ dependency_id: `l${i}`, source: `t${i}`, target: `t${i + 100}` }),
  )

  it('yalnız görünür dilim çizilir: satır, çubuk ve ok sayısı sınırlı', () => {
    const view = mountView({ scale: 'gun' }, tasks, links)
    const total = Number(view.get('[role="treegrid"]').attributes('aria-rowcount'))
    expect(total).toBe(255)
    expect(view.findAll('[role="row"]').length).toBeLessThan(40)
    expect(view.findAll('.gantt-bar').length).toBeLessThan(40)
    expect(view.element.querySelectorAll('*').length).toBeLessThan(2500)
  })

  it('bileşen kendi <style> öğesi eklemez (üretim CSP: satır içi stil yok)', () => {
    mountView({ scale: 'gun' }, tasks, links)
    expect(document.body.querySelectorAll('style')).toHaveLength(0)
  })
})
