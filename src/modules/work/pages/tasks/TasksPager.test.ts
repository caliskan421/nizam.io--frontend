import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TasksPager from './TasksPager.vue'

describe('sayfalayıcı satırı (E-03-38…40, P4)', () => {
  it('imleç sürüyor: yüklenen sayı + etiket, "Daha fazla yükle"', async () => {
    const pager = mount(TasksPager, { props: { loaded: 200, hasMore: true, loadingMore: false } })
    expect(pager.get('[data-testid="pager-caption"]').text()).toBe(
      '200 görev yüklendi · daha fazlası var · yüklenen kayıtlar içinde',
    )
    await pager.get('[data-testid="load-more"]').trigger('click')
    expect(pager.emitted('more')).toHaveLength(1)
  })

  it('imleç sürüyor + sunucu toplamı biliniyor: "‹n› / ‹toplam› görev yüklendi", etiket yok (BE-003)', () => {
    const pager = mount(TasksPager, {
      props: { loaded: 200, hasMore: true, loadingMore: false, total: 263 },
    })
    const caption = pager.get('[data-testid="pager-caption"]').text()
    expect(caption).toBe('200 / 263 görev yüklendi')
    expect(caption).not.toContain('yüklenen kayıtlar içinde')
    expect(pager.find('[data-design-stub]').exists()).toBe(false)
  })

  it('imleç bitti: kesin toplam, düğme gizli', () => {
    const pager = mount(TasksPager, { props: { loaded: 263, hasMore: false, loadingMore: false } })
    expect(pager.get('[data-testid="pager-caption"]').text()).toBe('263 görev')
    expect(pager.find('[data-testid="load-more"]').exists()).toBe(false)
  })

  it('"‹ilk›–‹son› / ‹toplam›", numaralı sayfalayıcı ve "sayfa başına" yok', () => {
    const pager = mount(TasksPager, { props: { loaded: 10, hasMore: true, loadingMore: true } })
    expect(pager.text()).not.toMatch(/\d+–\d+ \//)
    expect(pager.text()).not.toContain('Sayfa başına')
    expect(pager.find('.t-pages').exists()).toBe(false)
    const more = pager.get('[data-testid="load-more"]')
    expect(more.attributes('disabled')).toBeDefined()
    expect(more.text()).toBe('Yükleniyor…')
  })
})
