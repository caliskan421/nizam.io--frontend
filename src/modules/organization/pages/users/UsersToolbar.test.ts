import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import UsersToolbar from './UsersToolbar.vue'

afterEach(() => vi.useRealTimers())

const props = {
  tab: 'tumu' as const,
  counts: { tumu: 5, admin: 0, koordinator: 2, uye: 3 },
  search: '',
  department: null,
  departments: [],
  departmentsTruncated: true,
  programReady: true,
}

describe('UsersToolbar (E-05-06…08)', () => {
  it('Admin sekmesi canlı (BE-042); sunucu sayaçları, kısmi etiketi yok; arama 300 ms gecikmeli tek yazım', async () => {
    vi.useFakeTimers()
    const w = mount(UsersToolbar, { props })
    const tabs = w.findAll('.rp-seg button')
    expect(tabs[1]!.attributes('disabled')).toBeUndefined()
    expect(w.find('[data-testid="tabs-partial"]').exists()).toBe(false)
    expect(w.text()).toContain('Koordinatörlük listesi sınıra ulaşmış olabilir.')
    await tabs[1]!.trigger('click')
    await tabs[3]!.trigger('click')
    expect(w.emitted('update:tab')).toEqual([['admin'], ['uye']])

    await w.get('input').setValue('a')
    vi.advanceTimersByTime(200)
    await w.get('input').setValue('ay')
    vi.advanceTimersByTime(299)
    expect(w.emitted('update:search')).toBeUndefined()
    vi.advanceTimersByTime(1)
    expect(w.emitted('update:search')).toEqual([['ay']])
  })
})
