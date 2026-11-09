import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import CoordsHead from './CoordsHead.vue'

interface HeadProps {
  count: number | null
  truncated: boolean
  people: number | null
  year: number | null
  canCreate: boolean
  canMore: boolean
}

const BASE: HeadProps = {
  count: 5,
  truncated: false,
  people: 12,
  year: 2026,
  canCreate: true,
  canMore: true,
}

const wrappers: ReturnType<typeof mount>[] = []
function head(props: Partial<HeadProps> = {}) {
  const wrapper = mount(CoordsHead, { props: { ...BASE, ...props }, attachTo: document.body })
  wrappers.push(wrapper)
  return wrapper
}
afterEach(() => {
  for (const w of wrappers.splice(0)) w.unmount()
  document.body.innerHTML = ''
})

const parts = (w: ReturnType<typeof head>) =>
  w.findAll('[data-part]').map((p) => [p.attributes('data-part'), p.text()])

describe('başlık ve alt satır (E-08-02, E-08-03)', () => {
  it('sabit başlık; "N koordinatörlük · N kişi · YYYY sezonu", üst birim parçası yok', () => {
    const w = head()
    expect(w.get('h1').text()).toBe('Koordinatörlükler')
    expect(parts(w)).toEqual([
      ['count', '5 koordinatörlük'],
      ['people', '12 kişi'],
      ['season', '2026 sezonu'],
    ])
    expect(w.get('[data-part="people"]').attributes('title')).toMatch(/yöneticileri dahil/)
    expect(w.text()).not.toMatch(/üst birim/i)
  })

  it('kesilmede "sınıra ulaşmış olabilir"; rapor/yıl yoksa parça yok', () => {
    const w = head({ truncated: true, people: null, year: null })
    expect(parts(w)).toEqual([['count', '5 koordinatörlük (sınıra ulaşmış olabilir)']])
  })
})

describe('eylemler (E-08-04…06)', () => {
  it('"Yapıyı düzenle" devre dışı + BE-016 stub', () => {
    const w = head()
    const stub = w.get('[data-design-stub="BE-016"]')
    expect(stub.get('button').attributes('disabled')).toBeDefined()
    expect(stub.text()).toContain('Yapıyı düzenle')
  })

  it('"Yeni koordinatörlük" yetkide create yayar; yetkisizde gizli', async () => {
    const w = head()
    const create = w.findAll('button').find((b) => b.text() === 'Yeni koordinatörlük')!
    await create.trigger('click')
    expect(w.emitted('create')).toHaveLength(1)
    const hidden = head({ canCreate: false, canMore: false })
    expect(hidden.text()).not.toContain('Yeni koordinatörlük')
    expect(hidden.find('.coords-more__btn').exists()).toBe(false)
  })

  it('"Diğer işlemler": yalnız devre dışı "Sezona kopyala" + açıklama; "Roller" yok; Esc kapatır', async () => {
    const w = head()
    const btn = w.get('.coords-more__btn')
    expect(btn.attributes('aria-label')).toBe('Diğer işlemler')
    await btn.trigger('click')
    expect(btn.attributes('aria-expanded')).toBe('true')
    const items = w.findAll('[role="menuitem"]')
    expect(items.map((i) => i.text())).toEqual(['Sezona kopyala'])
    expect(items[0]!.attributes('disabled')).toBeDefined()
    expect(w.text()).toContain('görev aktarımı Teknofest ve sezon ekranında')
    expect(w.text()).not.toMatch(/Roller/)
    await btn.trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(w.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(btn.element)
  })
})
