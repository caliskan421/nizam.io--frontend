import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import RecordsFooter from './RecordsFooter.vue'

const base = { loaded: 12, total: 12, hasMore: false, loadingMore: false }

describe('RecordsFooter (E-12-38/39)', () => {
  it('hepsi yüklendiyse "n kayıt"; daha varsa "m / toplam kayıt gösteriliyor" ve Daha fazla yükle', async () => {
    const done = mount(RecordsFooter, { props: base })
    expect(done.get('[data-testid="dr-count"]').text()).toBe('12 kayıt')
    expect(done.find('[data-testid="dr-more"]').exists()).toBe(false)
    const more = mount(RecordsFooter, { props: { ...base, total: 127, hasMore: true } })
    expect(more.get('[data-testid="dr-count"]').text()).toBe('12 / 127 kayıt gösteriliyor')
    await more.get('[data-testid="dr-more"]').trigger('click')
    expect(more.emitted('more')).toHaveLength(1)
    expect(more.get('[data-testid="dr-more"]').text()).toBe('Daha fazla yükle')
  })

  it('toplam yoksa yüklenen sayı yazılır; "yüklenen içinde" / "n+" ifadesi yok', () => {
    const wrapper = mount(RecordsFooter, { props: { ...base, total: null, hasMore: true } })
    expect(wrapper.get('[data-testid="dr-count"]').text()).toBe('12 kayıt')
    expect(wrapper.text()).not.toMatch(/içinde|\+/)
  })

  it('yükleniyorken düğme aria-disabled ve tıklama yayılmaz', async () => {
    const wrapper = mount(RecordsFooter, {
      props: { ...base, total: 20, hasMore: true, loadingMore: true },
    })
    const button = wrapper.get('[data-testid="dr-more"]')
    expect(button.attributes('aria-disabled')).toBe('true')
    expect(button.text()).toBe('Yükleniyor')
    await button.trigger('click')
    expect(wrapper.emitted('more')).toBeUndefined()
  })
})
