import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import RecordsTable from './RecordsTable.vue'
import { fixtureRow } from '../__tests__/fixtures'

const props = {
  rows: [fixtureRow(), fixtureRow({ id: 'w2', key: 'gorev:w2', title: 'İkinci' })],
  selectedKey: 'gorev:w2',
  busy: false,
  timezone: 'Europe/Istanbul',
  now: new Date('2026-11-12T12:00:00Z'),
  canRestore: true,
  canPurge: true,
}

describe('RecordsTable (E-12-24; 01d)', () => {
  it('tablo rolü, beş sütun; seçim kutusu / kalan süre / toplu çubuk yok', () => {
    const wrapper = mount(RecordsTable, { props })
    expect(wrapper.get('[role="table"]').attributes('aria-label')).toBe('Silinen kayıtlar')
    const headers = wrapper.findAll('[role="columnheader"]').map((h) => h.text())
    expect(headers).toEqual(['tür', 'kayıt', 'silinme tarihi', 'silen', 'işlemler'])
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('kalan süre')
    expect(wrapper.find('[role="toolbar"]').exists()).toBe(false)
  })

  it('silinme tarihi başlığı yalnız varsayılan sırayı gösterir (aria-sort), ters çevirme devre dışı (BE-117)', () => {
    const wrapper = mount(RecordsTable, { props })
    const header = wrapper.get('[aria-sort="descending"]')
    expect(header.find('[data-design-stub="BE-117"]').exists()).toBe(true)
    expect(header.get('button').attributes('aria-disabled')).toBe('true')
    expect(wrapper.findAll('[aria-sort]')).toHaveLength(1)
  })

  it('satırlar sırayla; seçili satır işaretli; olaylar satırı taşır', async () => {
    const wrapper = mount(RecordsTable, { props })
    const rows = wrapper.findAll('[data-record-key]')
    expect(rows.map((r) => r.attributes('data-record-key'))).toEqual(['gorev:w1', 'gorev:w2'])
    expect(rows[1]!.attributes('aria-current')).toBe('true')
    await rows[0]!.get('[data-action="restore"]').trigger('click')
    await rows[1]!.get('[data-action="purge"]').trigger('click')
    await rows[0]!.trigger('click')
    expect(wrapper.emitted('restore')![0]![0]).toMatchObject({ id: 'w1' })
    expect(wrapper.emitted('purge')![0]![0]).toMatchObject({ id: 'w2' })
    expect(wrapper.emitted('select')![0]![0]).toMatchObject({ id: 'w1' })
  })
})
