import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import { subtask, workItem } from '../../model/__tests__/harness'
import SubtaskRow from './SubtaskRow.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

function setup(props: Record<string, unknown> = {}) {
  return mount(SubtaskRow, {
    props: {
      item: workItem(),
      subtask: subtask(),
      variant: 'block',
      canManage: true,
      canToggle: true,
      pending: false,
      pop: null,
      ...props,
    },
    attachTo: document.body,
    global: { stubs: { SubtaskFileSlot: true } },
  })
}

describe('SubtaskRow', () => {
  it('blok: kutu · başlık bağlantısı · kişi · tarih · kanıt yuvası (W46) · menü', () => {
    const w = setup()
    expect(w.classes()).toContain('rp-stask')
    expect(w.get('[data-testid="subtask-title"]').attributes('title')).toBe('Görev detayında aç')
    expect(w.findComponent({ name: 'SubtaskFileSlot' }).exists()).toBe(true)
    expect(w.get('[data-testid="subtask-done"]').attributes('aria-label')).toBe('Taslak tamamlandı')
  })

  it('kutu tıklaması iyimser değil: işaret değişmez, toggle yayılır; beklemede devre dışı', async () => {
    const w = setup()
    const box = w.get<HTMLInputElement>('[data-testid="subtask-done"]')
    box.element.click()
    expect(box.element.checked).toBe(false)
    expect(w.emitted('toggle')).toHaveLength(1)
    await w.setProps({ pending: true })
    expect(box.element.disabled).toBe(true)
    expect(w.get('.sub-check').attributes('data-pending')).toBe('true')
  })

  it('tamamlanmış: data-done + üstü çizili başlık', () => {
    const w = setup({ subtask: subtask({ done: true }) })
    expect(w.attributes('data-done')).toBe('true')
    expect(w.get<HTMLInputElement>('[data-testid="subtask-done"]').element.checked).toBe(true)
  })

  it('başlığı düzenle: Enter kırpılmış başlığı yazar; değişmeyen / boş başlık yazmaz; Esc vazgeçer', async () => {
    const w = setup({ pop: 'menu' })
    await w.get('[data-testid="subtask-rename"]').trigger('click')
    const input = w.get('[data-testid="subtask-title-input"]')
    await input.setValue('  Yeni ad ')
    await input.trigger('keydown', { key: 'Enter' })
    expect(w.emitted('patch')).toEqual([[{ title: 'Yeni ad' }]])
    expect(w.find('[data-testid="subtask-title-input"]').exists()).toBe(false)
    await w.get('[data-testid="subtask-rename"]').trigger('click')
    await w.get('[data-testid="subtask-title-input"]').setValue('   ')
    await w.get('[data-testid="subtask-title-input"]').trigger('keydown', { key: 'Enter' })
    await w.get('[data-testid="subtask-rename"]').trigger('click')
    await w.get('[data-testid="subtask-title-input"]').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('patch')).toHaveLength(1)
  })

  it('panel: başlık bağlantı değil, kanıt yuvası yok; yetkisizde kutu ve menü yok', () => {
    const w = setup({ variant: 'panel', canManage: false, canToggle: false })
    expect(w.classes()).toContain('rp-dsub')
    expect(w.get('[data-testid="subtask-title"]').element.tagName).toBe('SPAN')
    expect(w.findComponent({ name: 'SubtaskFileSlot' }).exists()).toBe(false)
    expect(w.find('[data-testid="subtask-done"]').exists()).toBe(false)
    expect(w.find('[data-testid="subtask-menu"]').exists()).toBe(false)
  })
})
