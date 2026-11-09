import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

import { focusFirstInvalid, openLayerCount } from './modal-layer'
import UiModal from './UiModal.vue'

enableAutoUnmount(afterEach)
afterEach(() => {
  document.body.innerHTML = ''
})

/** Gönderimde düğmesi kilitlenen, doğrulaması başarısız olan en sade form. */
const Form = defineComponent({
  props: { dismissible: { type: Boolean, default: true } },
  emits: ['update:open'],
  setup(props) {
    const open = ref(true)
    const busy = ref(false)
    const invalid = ref(false)
    return () =>
      h(
        UiModal,
        {
          title: 'Form',
          open: open.value,
          dismissible: props.dismissible && !busy.value,
          'onUpdate:open': (v: boolean) => (open.value = v),
        },
        {
          default: () => [
            h('input', { id: 'name' }),
            h('input', { id: 'code', 'aria-invalid': invalid.value ? 'true' : undefined }),
          ],
          footer: () =>
            h('button', {
              id: 'submit',
              disabled: busy.value,
              onClick: () => {
                busy.value = true
              },
            }),
        },
      )
  },
})

async function mountForm(props: Record<string, unknown> = {}) {
  const trigger = document.createElement('button')
  trigger.id = 'trigger'
  document.body.append(trigger)
  const outside = document.createElement('button')
  outside.id = 'outside'
  document.body.append(outside)
  trigger.focus()
  const wrapper = mount(Form, { props, attachTo: document.body })
  await nextTick()
  await nextTick()
  return { wrapper, trigger }
}

function keyOnBody(key: string, shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true })
  document.body.dispatchEvent(event)
  return event
}

const flush = async () => {
  await nextTick()
  await new Promise<void>((resolve) => queueMicrotask(resolve))
  await nextTick()
}

describe('modal-layer (odak BODY’ye düştüğünde pencere bağlamı; K-2)', () => {
  it('odak gövdedeyken Esc en üst pencereyi kapatır ve odak tetiğe döner', async () => {
    const { trigger } = await mountForm()
    expect(openLayerCount()).toBe(1)
    ;(document.activeElement as HTMLElement).blur()
    expect(document.activeElement).toBe(document.body)
    const event = keyOnBody('Escape')
    await flush()
    expect(event.defaultPrevented).toBe(true)
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(openLayerCount()).toBe(0)
    expect(document.activeElement).toBe(trigger)
  })

  it('kapatılamayan pencere (işlem sürüyor) Esc ile kapanmaz', async () => {
    await mountForm({ dismissible: false })
    ;(document.activeElement as HTMLElement).blur()
    keyOnBody('Escape')
    await flush()
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
  })

  it('odak gövdedeyken Tab arka plana değil pencereye; Shift+Tab son öğeye', async () => {
    await mountForm()
    ;(document.activeElement as HTMLElement).blur()
    const event = keyOnBody('Tab')
    expect(event.defaultPrevented).toBe(true)
    const dialog = document.querySelector('[role="dialog"]')!
    expect(dialog.contains(document.activeElement)).toBe(true)
    ;(document.activeElement as HTMLElement).blur()
    keyOnBody('Tab', true)
    expect(document.activeElement?.id).toBe('submit')
  })

  it('odak pencere içindeyken belge dinleyicisi karışmaz', async () => {
    await mountForm()
    const name = document.getElementById('name')!
    name.focus()
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    name.dispatchEvent(event)
    // Pencerenin kendi tuzağı ilk öğede Tab'ı tarayıcıya bırakır (son öğe değil).
    expect(event.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(name)
  })

  it('kurtarma: kilit kalkınca odak kayıpsa ilk hatalı alana gider', async () => {
    await mountForm()
    const submit = document.getElementById('submit')!
    submit.focus()
    // Tarayıcı devre dışı kalan düğmeden odağı düşürür (jsdom düşürmez; elle benzetilir).
    submit.blur()
    submit.click() // busy → düğme devre dışı
    await flush()
    expect(submit.hasAttribute('disabled')).toBe(true)
    // Kilitlenince odak pencerede bekler (klavye bağlamı korunur).
    expect(document.activeElement).toBe(document.querySelector('.t-modal'))
    // Doğrulama başarısız: alan hatalı, kilit kalkar.
    const code = document.getElementById('code')!
    code.setAttribute('aria-invalid', 'true')
    await flush()
    expect(document.activeElement).toBe(code)
  })

  it('kurtarma: hatalı alan yoksa son odaklanan öğe ya da pencere', async () => {
    await mountForm()
    const name = document.getElementById('name')!
    name.focus()
    name.blur()
    document.getElementById('submit')!.setAttribute('disabled', '')
    await flush()
    expect(document.activeElement).toBe(name)
  })

  it('focusFirstInvalid: en üst penceredeki ilk hatalı alan; yoksa false', async () => {
    await mountForm()
    expect(focusFirstInvalid()).toBe(false)
    document.getElementById('code')!.setAttribute('aria-invalid', 'true')
    expect(focusFirstInvalid()).toBe(true)
    expect(document.activeElement?.id).toBe('code')
  })

  it('pencere yokken focusFirstInvalid hiçbir şey yapmaz', () => {
    expect(openLayerCount()).toBe(0)
    expect(focusFirstInvalid()).toBe(false)
  })
})
