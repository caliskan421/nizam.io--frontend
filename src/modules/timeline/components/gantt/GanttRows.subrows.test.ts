// CX-F3-Ö-03: açık alt görev satırları ana satırların MANTIKSAL sırasında ve mutlak
// `aria-rowindex` ile çizilir (iki açık blok; pencerenin ortasından başlayan sanallaştırma).
import { VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { http, harness, json, ORIGIN, resetHarness, server } from '../../__tests__/harness'
import { task } from '../../model/__tests__/gantt-fixtures'
import { buildLayout, type RowWindow } from '../../model/rows'
import { subtask } from '../subtasks/__tests__/subtask-harness'
import GanttRows from './GanttRows.vue'
import { NAMES } from './gantt-test-support'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetHarness()
  document.body.innerHTML = ''
})
afterAll(() => server.close())

const mk = (id: string, dept: string) =>
  task({ work_item_id: id, department_id: dept, program_id: 'p1', title: id.toUpperCase() })
const TASKS = [mk('a', 'd1'), mk('b', 'd1'), mk('c', 'd1'), mk('d', 'd2')]
const COUNTS = new Map([
  ['a', 2],
  ['c', 3],
])

function serve(): void {
  for (const [id, count] of COUNTS) {
    const rows = Array.from({ length: count }, (_, i) => subtask({ subtask_id: `${id}${i}` }))
    server.use(
      http.get(`${ORIGIN}/v1/work-items/${id}/subtasks`, () =>
        json({ subtasks: rows, total: rows.length }),
      ),
    )
  }
}

async function render(window: (last: number) => RowWindow) {
  serve()
  const h = harness({ programId: 'p1', lens: 'admin', departmentId: null })
  const layout = buildLayout({
    tasks: TASKS,
    links: [],
    departmentNames: NAMES,
    collapsed: new Set(),
    subtaskRows: COUNTS,
  })
  const wrapper = mount(GanttRows, {
    props: {
      tasks: TASKS,
      departmentNames: NAMES,
      selectedId: null,
      layout,
      window: window(layout.rows.length - 1),
      pageSize: 3,
      openSubtasks: new Set(['a', 'c']),
    },
    attachTo: document.body,
    global: { plugins: [getActivePinia()!, [VueQueryPlugin, { queryClient: h.queryClient }]] },
  })
  await vi.waitFor(() =>
    expect(wrapper.findAll('[data-testid="subtask-row"]').length).toBeGreaterThan(0),
  )
  await flushPromises()
  return wrapper
}

/** Render edilmiş TÜM satırlar, DOM sırasıyla: [anahtar/etiket, aria-rowindex]. */
function measured(root: Element): Array<[string, number]> {
  return [...root.querySelectorAll<HTMLElement>('[role="row"]')].map((el) => [
    el.dataset.rowKey ?? el.querySelector('.tl-sub__title')?.textContent?.trim() ?? '?',
    Number(el.getAttribute('aria-rowindex')),
  ])
}

describe('açık alt görev satırları: sıra ve mutlak aria-rowindex (CX-F3-Ö-03)', () => {
  // Gruplar ada göre sıralı: Altyapı (d2: d) → Mekanik (d1: a, b, c).
  it('iki açık blok: satırlar mantıksal sırada, indeksler 1…N ardışık ve rowcount ile uyumlu', async () => {
    const wrapper = await render((last) => ({ first: 0, last }))
    const rows = measured(wrapper.element)
    expect(rows.map(([k]) => k)).toEqual([
      'g:d2',
      'd',
      'g:d1',
      'a',
      'Taslak',
      'Taslak',
      'b',
      'c',
      'Taslak',
      'Taslak',
      'Taslak',
    ])
    expect(rows.map(([, i]) => i)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    expect(wrapper.attributes('aria-rowcount')).toBe('11')
  })

  it('pencerenin ortasından başlayan sanallaştırma: görünen her satır MUTLAK indeksini korur', async () => {
    const wrapper = await render((last) => ({ first: 4, last })) // b, c (+ c bloğu)
    const rows = measured(wrapper.element)
    expect(rows.map(([k]) => k)).toEqual(['b', 'c', 'Taslak', 'Taslak', 'Taslak'])
    expect(rows.map(([, i]) => i)).toEqual([7, 8, 9, 10, 11])
    // sahibi pencere dışı olan blok (a) hiç çizilmez; sahipsiz alt satır kalmaz
    expect(wrapper.findAll('[data-testid="subtask-row"]')).toHaveLength(3)
    expect(wrapper.attributes('aria-rowcount')).toBe('11')
  })
})
