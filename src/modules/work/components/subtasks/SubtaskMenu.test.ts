import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import SubtaskMenu from './SubtaskMenu.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

function setup(open = true) {
  return mount(SubtaskMenu, {
    props: { title: 'Çizim', open, busy: false },
    attachTo: document.body,
  })
}

describe('SubtaskMenu (E-03-36)', () => {
  it('tetik: erişim adı + aria-expanded; tık açar', async () => {
    const w = setup(false)
    const trigger = w.get('[data-testid="subtask-menu"]')
    expect(trigger.attributes('aria-label')).toBe('Çizim seçenekleri')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    await trigger.trigger('click')
    expect(w.emitted('open')).toEqual([[true]])
  })

  it('"zorunlu alanlar" üç kutusu statik: BE-006 işaretli, devre dışı, işaretsiz; tık bir şey yaymaz', async () => {
    const w = setup()
    expect(w.get('.rp-thpop__title').text()).toBe('zorunlu alanlar')
    const stub = w.get('[data-design-stub="BE-006"]')
    expect(stub.text()).toContain('Kişi ataması')
    expect(stub.text()).toContain('Tarih aralığı')
    expect(stub.text()).toContain('Kanıt dosyası (arşiv)')
    const boxes = stub.findAll<HTMLInputElement>('input')
    expect(boxes.map((b) => [b.element.disabled, b.element.checked])).toEqual([
      [true, false],
      [true, false],
      [true, false],
    ])
    await stub.trigger('click')
    expect(w.emitted('rename')).toBeUndefined()
  })

  it('başlığı düzenle / sil yayılır ve menü kapanır; Esc kapatır', async () => {
    const w = setup()
    await w.get('[data-testid="subtask-rename"]').trigger('click')
    await w.get('[data-testid="subtask-remove"]').trigger('click')
    expect(w.emitted('rename')).toHaveLength(1)
    expect(w.emitted('remove')).toHaveLength(1)
    await w.get('[role="menu"]').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('open')).toEqual([[false], [false], [false]])
  })
})
