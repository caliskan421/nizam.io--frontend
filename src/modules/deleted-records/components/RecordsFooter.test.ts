import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import RecordsFooter from './RecordsFooter.vue'

const base = { loaded: 12, shown: 12, filtered: false, hasMore: false, loadingMore: false }

describe('RecordsFooter (E-12-38/39)', () => {
  it('"n kayıt yüklendi"; imleç sürüyorsa "daha var" ve Daha fazla yükle', async () => {
    const done = mount(RecordsFooter, { props: base })
    expect(done.get('[data-testid="dr-count"]').text()).toBe('12 kayıt yüklendi')
    expect(done.find('[data-testid="dr-more"]').exists()).toBe(false)
    const more = mount(RecordsFooter, { props: { ...base, hasMore: true } })
    expect(more.get('[data-testid="dr-count"]').text()).toBe('12 kayıt yüklendi, daha var')
    await more.get('[data-testid="dr-more"]').trigger('click')
    expect(more.emitted('more')).toHaveLength(1)
    expect(more.get('[data-testid="dr-more"]').text()).toBe('Daha fazla yükle')
  })

  it('süzgeçliyse "m kayıt gösteriliyor (yüklenen n içinde)"; "x / y" biçimi yok', () => {
    const wrapper = mount(RecordsFooter, { props: { ...base, shown: 3, filtered: true } })
    expect(wrapper.get('[data-testid="dr-count"]').text()).toBe(
      '3 kayıt gösteriliyor (yüklenen 12 içinde)',
    )
    expect(wrapper.text()).not.toContain('/')
  })

  it('yükleniyorken düğme aria-disabled ve tıklama yayılmaz', async () => {
    const wrapper = mount(RecordsFooter, { props: { ...base, hasMore: true, loadingMore: true } })
    const button = wrapper.get('[data-testid="dr-more"]')
    expect(button.attributes('aria-disabled')).toBe('true')
    expect(button.text()).toBe('Yükleniyor')
    await button.trigger('click')
    expect(wrapper.emitted('more')).toBeUndefined()
  })
})
