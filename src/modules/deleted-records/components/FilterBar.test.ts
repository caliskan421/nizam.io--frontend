import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useScopeStore } from '@/shared/scope/store'

import type { DeletedFilters } from '../model/filters'
import type { DeletedRow } from '../model/types'
import FilterBar from './FilterBar.vue'
import { fixtureRow } from '../__tests__/fixtures'

const FILTERS: DeletedFilters = {
  kind: 'toplanti',
  q: '',
  department: null,
  range: 'tumu',
  actor: null,
  selected: null,
}
const ROWS: DeletedRow[] = [
  fixtureRow({
    kind: 'toplanti',
    actor: { accountId: 'a7', name: 'Reha Koçak' },
    departmentIds: ['d1'],
  }),
  fixtureRow({
    id: 'w2',
    key: 'toplanti:w2',
    kind: 'toplanti',
    actor: { accountId: null, name: '' },
    departmentIds: ['d2', 'dx'],
  }),
]
const names = (id: string) => ({ d1: 'Mekanik', d2: 'Yazılım' })[id] ?? null

function mountBar(filters: Partial<DeletedFilters> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
  return mount(FilterBar, {
    props: { filters: { ...FILTERS, ...filters }, rows: ROWS, departmentName: names },
    global: { plugins: [pinia] },
    attachTo: document.body,
  })
}

beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }))
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('FilterBar (E-12-17…20)', () => {
  it('arama gecikmeli yayılır; art arda yazımda yalnız sonuncusu', async () => {
    const wrapper = mountBar()
    const input = wrapper.get('[data-testid="dr-search"]')
    await input.setValue('fu')
    await input.setValue(' fuar ')
    vi.advanceTimersByTime(100)
    expect(wrapper.emitted('update')).toBeUndefined()
    vi.advanceTimersByTime(200)
    expect(wrapper.emitted('update')).toEqual([[{ q: 'fuar' }]])
    expect(input.attributes('placeholder')).toBe('Yüklenen kayıtlarda ara')
    wrapper.unmount()
  })

  it('bekleyen yazım sahip sökülünce iptal edilir (istek/URL güncellemesi gitmez)', async () => {
    const wrapper = mountBar()
    await wrapper.get('[data-testid="dr-search"]').setValue('fuar')
    wrapper.unmount()
    vi.advanceTimersByTime(1000)
    expect(wrapper.emitted('update')).toBeUndefined()
  })

  it('bekleyen yazım kapsam değişiminde iptal edilir', async () => {
    const wrapper = mountBar()
    await wrapper.get('[data-testid="dr-search"]').setValue('fuar')
    useScopeStore().commit({ programId: 'p2', lens: 'admin', departmentId: null })
    vi.advanceTimersByTime(1000)
    expect(wrapper.emitted('update')).toBeUndefined()
    wrapper.unmount()
  })

  it('dışarıdan q değişince (Filtreleri temizle) giriş taslağı eşlenir', async () => {
    const wrapper = mountBar({ q: 'eski' })
    expect((wrapper.get('[data-testid="dr-search"]').element as HTMLInputElement).value).toBe(
      'eski',
    )
    await wrapper.setProps({ filters: { ...FILTERS, q: '' } })
    expect((wrapper.get('[data-testid="dr-search"]').element as HTMLInputElement).value).toBe('')
    wrapper.unmount()
  })

  it('silen adayları yüklenen satırlardan; koordinatörlük adayları ad sırasıyla, adı olmayan "Bilinmeyen"', async () => {
    const wrapper = mountBar()
    await wrapper.get('[data-testid="dr-actor"] button').trigger('click')
    expect(wrapper.findAll('[role="menuitemradio"]').map((i) => i.text())).toEqual([
      'Tümü',
      'Reha Koçak',
      'Bilinmiyor',
    ])
    await wrapper.findAll('[role="menuitemradio"]')[1]!.trigger('click')
    expect(wrapper.emitted('update')![0]).toEqual([{ actor: 'a7' }])
    await wrapper.get('[data-testid="dr-department"] button').trigger('click')
    expect(wrapper.findAll('[role="menuitemradio"]').map((i) => i.text())).toEqual([
      'Tümü',
      'Bilinmeyen koordinatörlük',
      'Mekanik',
      'Yazılım',
    ])
    wrapper.unmount()
  })

  it('aralık seçenekleri tasarım sırasıyla; menü öğesi sayıları yok', async () => {
    const wrapper = mountBar()
    await wrapper.get('[data-testid="dr-range"] button').trigger('click')
    expect(wrapper.findAll('[role="menuitemradio"]').map((i) => i.text())).toEqual([
      'Bugün',
      'Son 7 gün',
      'Tümü',
    ])
    expect(wrapper.find('[role="menu"] .rp-count').exists()).toBe(false)
    await wrapper.findAll('[role="menuitemradio"]')[0]!.trigger('click')
    expect(wrapper.emitted('update')![0]).toEqual([{ range: 'bugun' }])
    wrapper.unmount()
  })

  it('tür desteklemiyorsa ilgili menü devre dışı', () => {
    const task = mountBar({ kind: 'gorev' })
    expect(task.get('[data-testid="dr-actor"] button').attributes('disabled')).toBeDefined()
    expect(task.get('[data-testid="dr-department"] button').attributes('disabled')).toBeUndefined()
    const account = mountBar({ kind: 'kullanici' })
    for (const id of ['dr-range', 'dr-actor', 'dr-department']) {
      expect(account.get(`[data-testid="${id}"] button`).attributes('disabled'), id).toBeDefined()
    }
    task.unmount()
    account.unmount()
  })
})
