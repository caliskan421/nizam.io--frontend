import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import { task } from '../../model/__tests__/gantt-fixtures'
import { buildLayout } from '../../model/rows'
import type { GanttTask } from '../../model/types'
import GanttRows from './GanttRows.vue'
import { layoutOf, NAMES, queryPlugins, windowOf } from './gantt-test-support'

const LATE = { ...task().lateness, is_overdue: true, days_overdue: 41 }
const TASKS: GanttTask[] = [
  task({
    work_item_id: 'a',
    department_id: 'd1',
    title: 'Hidrofor',
    start_on: '2026-11-04',
    end_on: '2026-11-20',
    lateness: LATE,
  }),
  task({
    work_item_id: 'b',
    department_id: 'd1',
    title: 'Arıtma',
    status: 'tamamlandi',
    start_on: '2026-11-06',
    end_on: '2026-11-09',
  }),
  task({
    work_item_id: 'c',
    department_id: 'd2',
    title: 'Boru hattı',
    start_on: '2026-11-03',
    end_on: '2026-11-05',
  }),
]

type Props = Record<string, unknown>
function mountRows(over: Props = {}, collapsed: string[] = [], tasks = TASKS) {
  const links = [{ dependency_id: 'l', source: 'a', target: 'b', cross_department: false }]
  const layout = layoutOf(tasks, links, collapsed)
  return mount(GanttRows, {
    props: {
      tasks,
      departmentNames: NAMES,
      selectedId: null,
      layout,
      window: windowOf(layout),
      pageSize: 3,
      ...over,
    },
    attachTo: document.body,
    global: { plugins: queryPlugins().plugins },
  })
}
const row = (w: ReturnType<typeof mountRows>, key: string) => w.get(`[data-row-key="${key}"]`)

afterEach(() => {
  document.body.innerHTML = ''
})

describe('sol sütun treegrid (E-03C-21, 28, 30…32, 35)', () => {
  it('treegrid / row / rowheader / gridcell ve aria nitelikleri', () => {
    const rows = mountRows({ selectedId: 'a' })
    const grid = rows.get('[role="treegrid"]')
    expect(grid.attributes('aria-label')).toBe('Zaman çizelgesi')
    expect(grid.attributes('aria-rowcount')).toBe('5')
    const group = row(rows, 'g:d1')
    expect(group.attributes('role')).toBe('row')
    expect(group.attributes('aria-level')).toBe('1')
    expect(group.attributes('aria-expanded')).toBe('true')
    expect(group.attributes('aria-label')).toBe('Mekanik sistemler, 1 / 2 görev bitti')
    const task = row(rows, 'a')
    expect(task.attributes('aria-level')).toBe('2')
    expect(task.attributes('aria-selected')).toBe('true')
    expect(task.attributes('aria-rowindex')).toBe('4')
    expect(task.find('[role="rowheader"]').exists()).toBe(true)
    expect(row(rows, 'b').attributes('aria-selected')).toBe('false')
  })

  it('grup başlığı: ad + "bitti / toplam"; kapalıysa aria-expanded=false', () => {
    const rows = mountRows({}, ['g:d1'])
    const group = row(rows, 'g:d1')
    expect(group.get('.gantt-row__name').text()).toBe('Mekanik sistemler')
    expect(group.get('.gantt-row__count').text()).toBe('1 / 2')
    expect(group.attributes('aria-expanded')).toBe('false')
    expect(rows.find('[data-row-key="a"]').exists()).toBe(false)
  })

  it('adı çözülemeyen grup nötr etikettir', () => {
    const layout = buildLayout({
      tasks: TASKS,
      links: [],
      departmentNames: new Map(),
      collapsed: new Set(),
    })
    const rows = mountRows({ departmentNames: new Map(), layout, window: windowOf(layout) })
    expect(rows.findAll('.gantt-row__name').map((n) => n.text())).toEqual([
      'Koordinatörlük',
      'Koordinatörlük',
    ])
  })

  it('durum rengi tek başına değil: noktada title, görünmez hücrede tam özet', () => {
    const rows = mountRows()
    const a = row(rows, 'a')
    expect(a.get('.gantt-dot').attributes('title')).toBe('Devam ediyor · 41 gün gecikmede')
    expect(a.get('.gantt-dot').classes()).toEqual(
      expect.arrayContaining(['gantt-dot--doing', 'gantt-dot--late']),
    )
    expect(a.get('.gantt-dot').attributes('aria-hidden')).toBe('true')
    expect(a.attributes('aria-label')).toBe(
      'Hidrofor, Devam ediyor, 4 Kas – 20 Kas, 41 gün gecikmede',
    )
    expect(a.get('[role="gridcell"]').text()).toBe(
      'Hidrofor, Devam ediyor, 4 Kas – 20 Kas, 41 gün gecikmede',
    )
    expect(row(rows, 'b').get('[role="gridcell"]').text()).toBe(
      'Arıtma, Tamamlandı, 6 Kas – 9 Kas, Bağımlılığı var',
    )
    expect(row(rows, 'b').get('.gantt-dot').classes()).not.toContain('gantt-dot--late')
  })

  it('kod sütunu: kodlu birimde "KOD-—" (statik sıra), kodsuzda ve diğer yüzlerde boş', () => {
    const withCodes = mountRows({ departmentCodes: new Map([['d1', 'MEK']]) })
    expect(row(withCodes, 'a').get('.gantt-row__code').text()).toBe('MEK-—')
    expect(row(withCodes, 'c').get('.gantt-row__code').text()).toBe('')
    expect(row(mountRows(), 'a').get('.gantt-row__code').text()).toBe('')
  })

  it('başlık tek satır, satır konumu ofsetten', () => {
    const rows = mountRows()
    expect((row(rows, 'a').element as HTMLElement).style.top).toBe('124px')
    expect((row(rows, 'a').element as HTMLElement).style.height).toBe('44px')
    expect(row(rows, 'a').get('.gantt-row__title').text()).toBe('Hidrofor')
  })
})

describe('tıklama ve klavye', () => {
  it('görev satırı tıklaması seçer; grup tıklaması aç/kapa ister', async () => {
    const rows = mountRows()
    await row(rows, 'a').trigger('click')
    await row(rows, 'g:d1').trigger('click')
    expect(rows.emitted('select')).toEqual([['a']])
    expect(rows.emitted('toggle')).toEqual([['g:d1', false]])
  })

  it('dolaşan tabindex: tek sekme durağı (seçili satır, yoksa ilk satır)', () => {
    const rows = mountRows()
    expect(
      rows.findAll('[role="row"][tabindex="0"]').map((n) => n.attributes('data-row-key')),
    ).toEqual(['g:d2'])
    const selected = mountRows({ selectedId: 'b' })
    expect(
      selected.findAll('[role="row"][tabindex="0"]').map((n) => n.attributes('data-row-key')),
    ).toEqual(['b'])
    expect(selected.findAll('[role="row"][tabindex="-1"]')).toHaveLength(4)
  })

  it('↓ odağı alttaki satıra taşır ve görünür alanı ister; sekme durağı odağı izler', async () => {
    const rows = mountRows()
    const first = row(rows, 'g:d2')
    ;(first.element as HTMLElement).focus()
    await first.trigger('keydown', { key: 'ArrowDown' })
    await rows.vm.$nextTick()
    expect(document.activeElement).toBe(row(rows, 'c').element)
    expect(rows.emitted('reveal')).toEqual([[1]])
    expect(
      rows.findAll('[role="row"][tabindex="0"]').map((n) => n.attributes('data-row-key')),
    ).toEqual(['c'])
  })

  it('End/Home uç satırlara; PageDown sayfa adımı', async () => {
    const rows = mountRows()
    await row(rows, 'g:d2').trigger('keydown', { key: 'End' })
    await rows.vm.$nextTick()
    expect(document.activeElement).toBe(row(rows, 'b').element)
    await row(rows, 'b').trigger('keydown', { key: 'Home' })
    await rows.vm.$nextTick()
    expect(document.activeElement).toBe(row(rows, 'g:d2').element)
    await row(rows, 'g:d2').trigger('keydown', { key: 'PageDown' })
    await rows.vm.$nextTick()
    expect(document.activeElement).toBe(row(rows, 'a').element)
  })

  it('→ / ← grubu açar kapar, Enter görevi seçer (aç/kapa sonrası odak aynı satırda)', async () => {
    const rows = mountRows()
    await row(rows, 'g:d1').trigger('keydown', { key: 'ArrowLeft' })
    expect(rows.emitted('toggle')).toEqual([['g:d1', false]])
    await row(rows, 'a').trigger('keydown', { key: 'Enter' })
    expect(rows.emitted('select')).toEqual([['a']])
    const closed = mountRows({}, ['g:d1'])
    await row(closed, 'g:d1').trigger('keydown', { key: 'ArrowRight' })
    expect(closed.emitted('toggle')).toEqual([['g:d1', true]])
  })

  it('Shift+→ tarih kısayolu: işleyici yoksa işlenmez; verilirse ona iletilir', async () => {
    const plain = mountRows()
    const probe = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      shiftKey: true,
      cancelable: true,
      bubbles: true,
    })
    row(plain, 'a').element.dispatchEvent(probe)
    expect(probe.defaultPrevented).toBe(false)
    expect(plain.emitted('select')).toBeUndefined()
    const seen: unknown[] = []
    const wired = mountRows({ dateKeyHandler: (r: unknown) => void seen.push(r) })
    await row(wired, 'a').trigger('keydown', { key: 'ArrowLeft', shiftKey: true, altKey: true })
    expect(seen).toEqual([{ workItemId: 'a', edge: 'start', days: -1 }])
  })

  it('üzerine gelme: satır hover sınıfı alır', async () => {
    const rows = mountRows()
    await row(rows, 'a').trigger('pointerenter')
    expect(row(rows, 'a').classes()).toContain('is-hover')
    await row(rows, 'a').trigger('pointerleave')
    expect(row(rows, 'a').classes()).not.toContain('is-hover')
  })
})
