import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

  it('does not restore focus twice after close and unmount', async () => {
    const { wrapper, trigger } = await openModal()
    const focus = vi.spyOn(trigger, 'focus')
    key(dialog()!, 'Escape')
    await nextTick()
    await nextTick()
    expect(focus).toHaveBeenCalledTimes(1)
    wrapper.unmount()
    expect(focus).toHaveBeenCalledTimes(1)
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

describe('conditionally unmounted modal', () => {
  async function host() {
    const wrapper = mount(
      {
        components: { UiModal },
        data: () => ({ shown: false, inner: false }),
        template: `<button id="opener" @click="shown = true">Aç</button>
        <UiModal v-if="shown" :open="true" title="Dış" @close="shown = false">
          <button id="inner-opener" @click="inner = true">İç aç</button>
          <button id="action" @click="shown = false">Bitir</button>
          <UiModal v-if="inner" :open="true" title="İç" @close="inner = false" />
        </UiModal>`,
      },
      { attachTo: document.body },
    )
    const opener = wrapper.get('#opener').element as HTMLButtonElement
    opener.focus()
    opener.click()
    await nextTick()
    await nextTick()
    return { wrapper, opener }
  }

  it.each(['Escape', 'close', 'action'])(
    'restores the opener after %s unmounts the owner',
    async (way) => {
      const { wrapper, opener } = await host()
      if (way === 'Escape') key(dialog()!, 'Escape')
      else if (way === 'close') document.querySelector<HTMLElement>('[aria-label="Kapat"]')!.click()
      else document.querySelector<HTMLElement>('#action')!.click()
      await nextTick()
      await nextTick()
      expect(dialog()).toBeNull()
      expect(document.activeElement).toBe(opener)
      wrapper.unmount()
    },
  )

  it('returns focus through nested conditional modals', async () => {
    const { wrapper, opener } = await host()
    const innerOpener = document.querySelector<HTMLElement>('#inner-opener')!
    innerOpener.focus()
    innerOpener.click()
    await nextTick()
    await nextTick()
    const dialogs = document.querySelectorAll('[role="dialog"]')
    key(dialogs[1]!, 'Escape')
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(innerOpener)
    key(dialog()!, 'Escape')
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(opener)
    wrapper.unmount()
  })

  it('does not focus an opener removed before unmount', async () => {
    const { wrapper, opener } = await host()
    opener.remove()
    const focus = vi.spyOn(opener, 'focus')
    key(dialog()!, 'Escape')
    await nextTick()
    expect(focus).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
