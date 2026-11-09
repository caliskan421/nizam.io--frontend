import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { note } from '../../model/__tests__/harness'
import type { WorkItemNote } from '../../model/types'
import NoteItem from './NoteItem.vue'
import type { SettleResult } from './use-note-actions'

afterEach(() => {
  document.body.innerHTML = ''
})

function mountItem(over: Partial<WorkItemNote> = {}, props: Record<string, unknown> = {}) {
  const save = vi.fn<(b: WorkItemNote, c: string) => Promise<SettleResult>>(() =>
    Promise.resolve({ done: true, notice: null }),
  )
  const remove = vi.fn(() => Promise.resolve(true))
  const wrapper = mount(NoteItem, {
    props: {
      note: note(over),
      canEdit: true,
      timeZone: 'Europe/Istanbul',
      busy: false,
      save,
      remove,
      refetch: () => Promise.resolve(),
      ...props,
    },
  })
  return { wrapper, save, remove }
}

describe('NoteItem', () => {
  it('yazar, kurulum saat dilimiyle zaman, gövde; ad yoksa nötr metin', () => {
    const { wrapper } = mountItem({ author_full_name: null })
    expect(wrapper.find('.wk-note__author').text()).toBe('Adı bilinmeyen kişi')
    expect(wrapper.find('time').text()).toBe('1 Kas 2026 11:00')
    expect(wrapper.find('time').attributes('datetime')).toBe('2026-11-01T08:00:00Z')
    expect(wrapper.text()).not.toContain('düzenlendi')
  })

  it('"düzenlendi" yalnız güncellenmiş notta', () => {
    const { wrapper } = mountItem({ updated_at: '2026-11-02T08:00:00Z' })
    expect(wrapper.text()).toContain('düzenlendi')
  })

  it('canEdit false → Düzenle/Sil gizli', () => {
    const { wrapper } = mountItem({}, { canEdit: false })
    expect(wrapper.find('[data-testid="note-edit"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="note-delete"]').exists()).toBe(false)
  })

  it('düzenle: taban açılıştaki not; başarıda düzenleyici kapanır', async () => {
    const { wrapper, save } = mountItem()
    await wrapper.find('[data-testid="note-edit"]').trigger('click')
    const input = wrapper.find('textarea')
    expect((input.element as HTMLTextAreaElement).value).toBe('İlk')
    await input.setValue('Yeni')
    await wrapper.find('form').trigger('submit')
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ note_id: 'n1' }), 'Yeni')
    await vi.waitFor(() => expect(wrapper.find('textarea').exists()).toBe(false))
  })

  it('düzenle: başarısızsa düzenleyici açık kalır; Vazgeç kapatır', async () => {
    const { wrapper, save } = mountItem()
    save.mockResolvedValueOnce({ done: false, notice: null })
    await wrapper.find('[data-testid="note-edit"]').trigger('click')
    await wrapper.find('textarea').setValue('Yeni')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(save).toHaveBeenCalled())
    expect(wrapper.find('textarea').exists()).toBe(true)
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Vazgeç')!
      .trigger('click')
    expect(wrapper.find('textarea').exists()).toBe(false)
  })

  it('sil → çağıranın silme akışı (onay orada)', async () => {
    const { wrapper, remove } = mountItem()
    await wrapper.find('[data-testid="note-delete"]').trigger('click')
    expect(remove).toHaveBeenCalledWith(expect.objectContaining({ note_id: 'n1' }))
  })
})
