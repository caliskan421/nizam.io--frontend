import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import NoteComposer from './NoteComposer.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

function mountComposer(props: Record<string, unknown> = {}) {
  const wrapper = mount(NoteComposer, {
    props: {
      modelValue: '',
      'onUpdate:modelValue': (v: string) => wrapper.setProps({ modelValue: v }),
      label: 'Not yaz',
      submitLabel: 'Not ekle',
      ...props,
    },
  })
  return wrapper
}

const submitButton = (w: ReturnType<typeof mountComposer>) => w.find('[data-testid="note-submit"]')

describe('NoteComposer', () => {
  it('boş / yalnız boşluk içerik gönderilmez; kırpılmış içerik yayılır', async () => {
    const w = mountComposer()
    expect(submitButton(w).attributes('disabled')).toBeDefined()
    await w.find('textarea').setValue('   ')
    await w.find('form').trigger('submit')
    expect(w.emitted('submit')).toBeUndefined()
    await w.find('textarea').setValue('  Not  ')
    expect(submitButton(w).attributes('disabled')).toBeUndefined()
    await w.find('form').trigger('submit')
    expect(w.emitted('submit')).toEqual([['Not']])
  })

  it('Ctrl/⌘+Enter gönderir; yalnız Enter göndermez (çok satır)', async () => {
    const w = mountComposer({ modelValue: 'a' })
    await w.find('textarea').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('submit')).toBeUndefined()
    await w.find('textarea').trigger('keydown', { key: 'Enter', ctrlKey: true })
    await w.find('textarea').trigger('keydown', { key: 'Enter', metaKey: true })
    expect(w.emitted('submit')).toEqual([['a'], ['a']])
  })

  it('uzunluk sınırı uydurulmaz (maxlength yok); işlem sürerken kapalı', () => {
    const w = mountComposer({ modelValue: 'a', busy: true })
    expect(w.find('textarea').attributes('maxlength')).toBeUndefined()
    expect(w.find('textarea').attributes('disabled')).toBeDefined()
    expect(submitButton(w).attributes('disabled')).toBeDefined()
  })

  it('sonuç bilinmiyor: aynı taslak kilitli, taslak değişince yeni eylem serbest', async () => {
    const notice = { kind: 'unknown_outcome', reason: 'network', draft: {}, retry: null }
    const w = mountComposer({ modelValue: 'Taslak', notice, noticeDraft: 'Taslak' })
    expect(w.find('[data-testid="outcome-notice"]').exists()).toBe(true)
    expect(submitButton(w).attributes('disabled')).toBeDefined()
    await w.find('textarea').setValue('Taslak düzeltildi')
    expect(submitButton(w).attributes('disabled')).toBeUndefined()
  })

  it('düzenleyici: Vazgeç yalnız cancelable iken', async () => {
    expect(mountComposer().text()).not.toContain('Vazgeç')
    const w = mountComposer({ cancelable: true })
    const cancel = w.findAll('button').find((b) => b.text() === 'Vazgeç')!
    await cancel.trigger('click')
    expect(w.emitted('cancel')).toHaveLength(1)
  })
})
