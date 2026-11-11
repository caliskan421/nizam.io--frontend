import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import { workItem } from '../../model/__tests__/harness'
import type { ProgramDepartment, WorkItem } from '../../model/types'
import TaskTable from './TaskTable.vue'

const SubtaskBlockStub = defineComponent({
  name: 'SubtaskBlock',
  props: { item: { type: Object, required: true } },
  setup: (props) => () => h('div', { 'data-stub': (props.item as WorkItem).work_item_id }),
})

const departments = new Map<string, ProgramDepartment>([
  ['d1', { department_id: 'd1', display_name: 'Mekanik', code: 'MEK' }],
  ['d2', { department_id: 'd2', display_name: 'İdari işler' }],
])

function mountTable(props: Record<string, unknown> = {}) {
  return mount(TaskTable, {
    props: {
      items: [
        workItem({ work_item_id: 'w1', department_id: 'd1' }),
        workItem({ work_item_id: 'w2', department_id: 'd2' }),
      ] as WorkItem[],
      departments,
      selectedId: null,
      sort: null,
      today: '2026-11-09',
      loading: false,
      hrefFor: (id: string) => `/gorevler?gorev=${id}`,
      ...props,
    },
    global: { stubs: { SubtaskBlock: SubtaskBlockStub } },
    attachTo: document.body,
  })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('görev tablosu', () => {
  it('başlık: görev · durum · bitiş sıralanır, kişi sıralanmaz; tümünü seç yok (P7)', () => {
    const table = mountTable()
    const heads = table.findAll('[role="columnheader"]')
    expect(heads.map((c) => c.text())).toEqual(['', 'görev', 'durum', 'bitiş', 'kişi'])
    expect(table.findAll('.rp-sortbtn')).toHaveLength(3)
    expect(table.find('input[type="checkbox"]').exists()).toBe(false)
    expect(heads[1]!.attributes('aria-sort')).toBe('none')
  })

  it('satırlar departman adı ve kodu sözlükten (G13)', () => {
    const rows = mountTable().findAll('.rp-tr--body')
    expect(rows.map((r) => r.get('.task-row__dept').text())).toEqual(['Mekanik', 'İdari işler'])
    expect(rows.map((r) => r.get('.task-row__code').text())).toEqual(['MEK', ''])
  })

  it('etkin sıralama aria-sort; düğme sort yayar', async () => {
    const table = mountTable({ sort: { field: 'bitis', direction: 'azalan' } })
    const heads = table.findAll('[role="columnheader"]')
    expect(heads[3]!.attributes('aria-sort')).toBe('descending')
    await table.get('[data-sort="gorev"]').trigger('click')
    expect(table.emitted('sort')).toEqual([['gorev']])
  })

  it('alt görev blokları bağımsız açılır (E-03-21)', async () => {
    const table = mountTable()
    const toggles = table.findAll('.rp-subtog')
    await toggles[0]!.trigger('click')
    await toggles[1]!.trigger('click')
    expect(table.find('[data-stub="w1"]').exists()).toBe(true)
    expect(table.find('[data-stub="w2"]').exists()).toBe(true)
    await toggles[0]!.trigger('click')
    expect(table.find('[data-stub="w1"]').exists()).toBe(false)
    expect(table.find('[data-stub="w2"]').exists()).toBe(true)
  })

  it('satır açma: open(id, summary)', async () => {
    const table = mountTable({ selectedId: 'w2' })
    expect(table.findAll('.rp-tr--body')[1]!.classes()).toContain('rp-sel')
    await table.findAll('a.rp-title')[0]!.trigger('click')
    expect(table.emitted('open')).toEqual([['w1', 'summary']])
  })

  it('yükleniyor: 10 iskelet satır, aria-busy, gerçek satır yok', () => {
    const table = mountTable({ loading: true })
    expect(table.findAll('[data-skeleton]')).toHaveLength(10)
    expect(table.get('[role="table"]').attributes('aria-busy')).toBe('true')
    expect(table.find('.rp-tr--body').exists()).toBe(false)
  })
})
