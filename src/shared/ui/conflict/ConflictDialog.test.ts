import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import type { ConflictField } from './conflict'
import ConflictDialog from './ConflictDialog.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

const fields: ConflictField[] = [
  { field: 'title', label: 'Başlık', mine: 'Benim başlık', theirs: 'Güncel başlık' },
  { field: 'description', label: 'Açıklama', mine: '', theirs: 'Yeni açıklama' },
]

async function open(props: Record<string, unknown> = {}) {
  const trigger = document.createElement('button')
  document.body.append(trigger)
  trigger.focus()
  const wrapper = mount(ConflictDialog, {
    props: {
      fields,
      open: true,
      'onUpdate:open': (v: boolean) => wrapper.setProps({ open: v }),
      ...props,
    },
    attachTo: document.body,
  })
  await nextTick()
  await nextTick()
  return { wrapper, trigger }
}

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')!
const submit = () => document.querySelector<HTMLButtonElement>('[data-testid="conflict-submit"]')!
const groups = () => [...document.querySelectorAll<HTMLElement>('.rp-seg')]
const segButtons = (i: number) => [...groups()[i]!.querySelectorAll<HTMLButtonElement>('button')]

function key(target: Element, k: string, shiftKey = false) {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true, cancelable: true }),
  )
}

describe('ConflictDialog', () => {
  it('her alan: etiket, iki değer (boş → "(boş)"), adlandırılmış seçim grubu', async () => {
    await open()
    expect(dialog().getAttribute('aria-modal')).toBe('true')
    expect(document.querySelectorAll('[data-testid="conflict-mine"]')[1]!.textContent).toBe('(boş)')
    expect(document.querySelector('[data-testid="conflict-theirs"]')!.textContent).toBe(
      'Güncel başlık',
    )
    expect(groups().map((g) => g.getAttribute('aria-label'))).toEqual([
      'Başlık: kalacak değer',
      'Açıklama: kalacak değer',
    ])
    expect(dialog().contains(document.activeElement)).toBe(true)
  })

  it('varsayılan seçim yok: her alan seçilene dek kaydet kapalı; seçim emit edilir', async () => {
    const { wrapper } = await open()
    expect(submit().disabled).toBe(true)
    segButtons(0)[0]!.click()
    await nextTick()
    expect(submit().disabled).toBe(true)
    segButtons(1)[1]!.click()
    await nextTick()
    expect(segButtons(1)[1]!.getAttribute('aria-pressed')).toBe('true')
    expect(submit().disabled).toBe(false)
    submit().click()
    expect(wrapper.emitted('resolve')?.[0]).toEqual([{ title: 'mine', description: 'theirs' }])
  })

  it('klavye: ←/→ seçenekler arasında odak; Tab içeride döner; Esc vazgeçer ve odak tetiğe döner', async () => {
    const { wrapper, trigger } = await open()
    const [mine, theirs] = segButtons(0)
    mine!.focus()
    key(mine!, 'ArrowRight')
    expect(document.activeElement).toBe(theirs)
    key(theirs!, 'ArrowRight')
    expect(document.activeElement).toBe(mine)
    key(mine!, 'End')
    expect(document.activeElement).toBe(theirs)

    // Odak tuzağı: son öğeden Tab başa döner.
    const focusables = [...dialog().querySelectorAll<HTMLElement>('button:not([disabled])')]
    focusables.at(-1)!.focus()
    key(focusables.at(-1)!, 'Tab')
    expect(document.activeElement).toBe(focusables[0])

    key(dialog(), 'Escape')
    await nextTick()
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
    await nextTick()
    expect(document.activeElement).toBe(trigger)
  })

  it('istek sürerken (busy): seçim ve düğmeler kapalı, Esc kapatmaz', async () => {
    const { wrapper } = await open({ busy: true })
    expect(segButtons(0).every((b) => b.disabled)).toBe(true)
    expect(submit().disabled).toBe(true)
    key(dialog(), 'Escape')
    await nextTick()
    expect(wrapper.emitted('cancel')).toBeUndefined()
    expect(dialog()).not.toBeNull()
  })

  it('"Vazgeç" düğmesi cancel yayar', async () => {
    const { wrapper } = await open()
    const cancel = [...dialog().querySelectorAll<HTMLButtonElement>('.t-modal__foot button')][0]!
    cancel.click()
    await nextTick()
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})
