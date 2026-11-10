import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import TasksFilterBar from './TasksFilterBar.vue'

const departments = [
  { department_id: 'd1', display_name: 'Mekanik' },
  { department_id: 'd2', display_name: 'İdari işler', code: 'IDA' },
]

function mountBar(props: Record<string, unknown> = {}) {
  return mount(TasksFilterBar, {
    props: {
      search: '',
      department: null,
      departments,
      showDepartment: true,
      people: [],
      candidates: [],
      personLocked: false,
      ...props,
    },
    attachTo: document.body,
  })
}

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('arama ve süzgeç satırı (E-03-10…12)', () => {
  it('arama ~300 ms gecikmeyle tek kez yazılır (E-03-10)', async () => {
    const bar = mountBar()
    const input = bar.get('input[type="search"]')
    expect(input.attributes('aria-label')).toBe('Görev ara')
    expect(input.attributes('placeholder')).toBe('Başlık, kimlik veya kişi…')
    await input.setValue('ra')
    vi.advanceTimersByTime(200)
    await input.setValue('rapor')
    vi.advanceTimersByTime(299)
    expect(bar.emitted('update:search')).toBeUndefined()
    vi.advanceTimersByTime(1)
    expect(bar.emitted('update:search')).toEqual([['rapor']])
  })

  it('dışarıdan değişim kutuyu eşitler, bekleyen yazımı düşürür', async () => {
    const bar = mountBar({ search: 'eski' })
    const input = bar.get<HTMLInputElement>('input[type="search"]')
    expect(input.element.value).toBe('eski')
    await input.setValue('yeni')
    await bar.setProps({ search: '' })
    vi.advanceTimersByTime(500)
    expect(input.element.value).toBe('')
    expect(bar.emitted('update:search')).toBeUndefined()
  })

  it('kişi süzgeci canlı: stub işareti yok, yayılan seçim üst bileşene gider (E-03-11, BE-038)', async () => {
    const bar = mountBar({ candidates: [{ assignees: [{ account_id: 'a1', full_name: 'Ayşe' }] }] })
    expect(bar.find('[data-design-stub]').exists()).toBe(false)
    await bar.get('[data-testid="person-filter"]').trigger('click')
    const items = bar.findAll('[role="menuitemcheckbox"]')
    await items[0]!.trigger('click')
    expect(bar.emitted('update:people')).toEqual([[['a1']]])
  })

  it('koordinatörlük süzgeci yalnız istendiğinde (Admin merceği)', () => {
    expect(
      mountBar({ showDepartment: false }).find('[data-testid="department-filter"]').exists(),
    ).toBe(false)
    expect(mountBar().find('[data-testid="department-filter"]').exists()).toBe(true)
  })
})
