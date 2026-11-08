import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import UiModal from './UiModal.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

async function openModal(props: Record<string, unknown> = {}) {
  const trigger = document.createElement('button')
  document.body.append(trigger)
  trigger.focus()
  const wrapper = mount(UiModal, {
    props: {
      title: 'Görevi sil',
      description: 'Bu işlem geri alınamaz.',
      open: true,
      'onUpdate:open': (v: boolean) => wrapper.setProps({ open: v }),
      ...props,
    },
    slots: {
      default: '<input id="first" />',
      footer: '<button id="cancel">Vazgeç</button><button id="ok">Sil</button>',
    },
    attachTo: document.body,
  })
  await nextTick()
  await nextTick()
  return { wrapper, trigger }
}

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')

function press(el: Element, up: Element = el) {
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  up.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

function key(target: Element, k: string, shiftKey = false) {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true, cancelable: true }),
  )
}

describe('UiModal', () => {
  it('aria-modal, başlık ve açıklama bağı; açılınca odak içeride', async () => {
    await openModal()
    const el = dialog()!
    expect(el.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(el.getAttribute('aria-labelledby')!)?.textContent).toBe(
      'Görevi sil',
    )
    expect(document.getElementById(el.getAttribute('aria-describedby')!)?.textContent).toBe(
      'Bu işlem geri alınamaz.',
    )
    expect(el.contains(document.activeElement)).toBe(true)
    expect(document.querySelector('.t-modal__foot')).not.toBeNull()
  })

  it('klavye: Tab içeride döner; Esc kapatır ve odak tetiğe döner', async () => {
    const { wrapper, trigger } = await openModal()
    const ok = document.getElementById('ok')!
    ok.focus()
    key(ok, 'Tab')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Kapat')
    key(document.activeElement!, 'Tab', true)
    expect(document.activeElement).toBe(ok)
    key(ok, 'Escape')
    await nextTick()
    await nextTick()
    expect(wrapper.props('open')).toBe(false)
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(dialog()).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('perde tıklaması kapatır; pencereden perdeye sürükleme kapatmaz', async () => {
    const { wrapper } = await openModal()
    const backdrop = document.querySelector<HTMLElement>('.t-modal-backdrop')!
    press(dialog()!, backdrop)
    await nextTick()
    expect(wrapper.props('open')).toBe(true)
    press(backdrop)
    await nextTick()
    expect(wrapper.props('open')).toBe(false)
  })

  it('kapat düğmesi kapatır', async () => {
    const { wrapper } = await openModal()
    document.querySelector<HTMLElement>('[aria-label="Kapat"]')!.click()
    await nextTick()
    expect(wrapper.props('open')).toBe(false)
  })

  it('dismissible=false (devre dışı kapanış): Esc ve perde kapatmaz, kapat düğmesi yok', async () => {
    const { wrapper } = await openModal({ dismissible: false })
    expect(document.querySelector('[aria-label="Kapat"]')).toBeNull()
    key(dialog()!, 'Escape')
    press(document.querySelector<HTMLElement>('.t-modal-backdrop')!)
    await nextTick()
    expect(wrapper.props('open')).toBe(true)
    expect(dialog()).not.toBeNull()
  })

  it('kapalıyken DOM’da yok', () => {
    mount(UiModal, { props: { title: 'x', open: false }, attachTo: document.body })
    expect(dialog()).toBeNull()
  })
})
