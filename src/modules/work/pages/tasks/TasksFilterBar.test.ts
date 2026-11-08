import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import TasksFilterBar from './TasksFilterBar.vue'

const departments = [
  { department_id: 'd1', display_name: 'Mekanik' },
  { department_id: 'd2', display_name: 'İdari işler', code: 'IDA' },
]

function mountBar(props: Record<string, unknown> = {}) {
  return mount(TasksFilterBar, {
    props: { search: '', department: null, departments, showDepartment: true, ...props },
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

  it('kişi süzgeci statik: BE-038 işareti, devre dışı, açılmaz (E-03-11)', async () => {
    const bar = mountBar()
    const stub = bar.get('[data-design-stub="BE-038"]')
    const button = stub.get('[data-testid="person-filter"]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('title')).toBe('Kişi süzgeci henüz kullanılamıyor')
    await button.trigger('click')
    expect(bar.find('[role="menu"]').exists()).toBe(false)
  })

  it('koordinatörlük süzgeci yalnız istendiğinde (Admin merceği)', () => {
    expect(
      mountBar({ showDepartment: false }).find('[data-testid="department-filter"]').exists(),
    ).toBe(false)
    expect(mountBar().find('[data-testid="department-filter"]').exists()).toBe(true)
  })
})
