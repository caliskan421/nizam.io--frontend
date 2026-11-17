import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import RecordsTable from './RecordsTable.vue'
import { fixtureRow } from '../__tests__/fixtures'

const props = {
  rows: [fixtureRow(), fixtureRow({ id: 'w2', key: 'tasks:w2', title: 'İkinci' })],
  selectedKey: 'tasks:w2',
  checkedIds: new Set<string>(),
  allChecked: false,
  someChecked: false,
  sort: { key: 'deleted_at' as const, order: 'desc' as const },
  busy: false,
  timezone: 'Europe/Istanbul',
  now: new Date('2026-11-12T12:00:00Z'),
  canRestore: true,
  canPurge: true,
}

describe('RecordsTable (E-12-24; 01d)', () => {
  it('tablo rolü, seçim + beş sütun; kalan süre sütunu yok', () => {
    const wrapper = mount(RecordsTable, { props })
    expect(wrapper.get('[role="table"]').attributes('aria-label')).toBe('Silinen kayıtlar')
    const headers = wrapper.findAll('[role="columnheader"]').map((h) => h.text())
    expect(headers.map((h) => h.replace(/\s+/g, ' ').trim())).toEqual([
      '',
      'tür',
      'kayıt',
      'silinme tarihi',
      'silen',
      'işlemler',
    ])
    expect(wrapper.text()).not.toContain('kalan süre')
    // Başlıkta "tümünü seç" + her satırda bir kutu (BE-114).
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(3)
    expect(wrapper.get('[data-testid="dr-select-all"]').attributes('aria-label')).toBe('Tümünü seç')
  })

  it('seçim: işaretli satır kutusu, tümünü seç tri-state ve olaylar (BE-114)', async () => {
    const wrapper = mount(RecordsTable, {
      props: { ...props, checkedIds: new Set(['tasks:w2']), someChecked: true },
    })
    const boxes = wrapper.findAll('[data-testid="dr-row-check"]')
    expect(boxes.map((b) => (b.element as HTMLInputElement).checked)).toEqual([false, true])
    expect(
      (wrapper.get('[data-testid="dr-select-all"]').element as HTMLInputElement).indeterminate,
    ).toBe(true)
    await wrapper.get('[data-testid="dr-select-all"]').setValue(true)
    expect(wrapper.emitted('toggleAll')).toHaveLength(1)
    await boxes[0]!.setValue(true)
    expect(wrapper.emitted('toggle')![0]![0]).toMatchObject({ id: 'w1' })
    await wrapper.setProps({
      checkedIds: new Set(['tasks:w1', 'tasks:w2']),
      allChecked: true,
      someChecked: false,
    })
    expect((wrapper.get('[data-testid="dr-select-all"]').element as HTMLInputElement).checked).toBe(
      true,
    )
  })

  it('sıralama başlıkları tıklanır: etkin eksen aria-sort taşır, olay ekseni yayar (BE-117)', async () => {
    const wrapper = mount(RecordsTable, { props })
    const active = wrapper.get('[aria-sort]')
    expect(active.attributes('aria-sort')).toBe('descending')
    expect(active.get('button').attributes('data-sort')).toBe('deleted_at')
    expect(wrapper.findAll('[aria-sort]')).toHaveLength(1)
    expect(wrapper.find('[data-design-stub="BE-117"]').exists()).toBe(false)
    await wrapper.get('[data-sort="name"]').trigger('click')
    await active.get('button').trigger('click')
    expect(wrapper.emitted('sort')).toEqual([['name'], ['deleted_at']])
    await wrapper.setProps({ sort: { key: 'name', order: 'asc' } })
    expect(wrapper.get('[aria-sort]').attributes('aria-sort')).toBe('ascending')
    expect(wrapper.get('[aria-sort] button').attributes('data-sort')).toBe('name')
  })

  it('birleşik görünümde sıra kilitli: başlıklar düğme değil, aria-sort yok', () => {
    const wrapper = mount(RecordsTable, { props: { ...props, sortLocked: true } })
    expect(wrapper.find('[data-sort]').exists()).toBe(false)
    expect(wrapper.find('[aria-sort]').exists()).toBe(false)
    expect(wrapper.text()).toContain('kayıt')
    expect(wrapper.text()).toContain('silinme tarihi')
  })

  it('satırlar sırayla; seçili satır işaretli; olaylar satırı taşır', async () => {
    const wrapper = mount(RecordsTable, { props })
    const rows = wrapper.findAll('[data-record-key]')
    expect(rows.map((r) => r.attributes('data-record-key'))).toEqual(['tasks:w1', 'tasks:w2'])
    expect(rows[1]!.attributes('aria-current')).toBe('true')
    await rows[0]!.get('[data-action="restore"]').trigger('click')
    await rows[1]!.get('[data-action="purge"]').trigger('click')
    await rows[0]!.trigger('click')
    expect(wrapper.emitted('restore')![0]![0]).toMatchObject({ id: 'w1' })
    expect(wrapper.emitted('purge')![0]![0]).toMatchObject({ id: 'w2' })
    expect(wrapper.emitted('select')![0]![0]).toMatchObject({ id: 'w1' })
  })
})
