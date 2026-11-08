import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { focusableIn, useFocusTrap } from './focus-trap'

function setup(html: string) {
  document.body.innerHTML = `<button id="trigger">aç</button><div id="root" tabindex="-1">${html}</div>`
  const trigger = document.getElementById('trigger')!
  trigger.focus()
  const root = document.getElementById('root')!
  return { trigger, root, trap: useFocusTrap(ref(root)) }
}

const tab = (shiftKey = false) =>
  new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true })

describe('focus-trap', () => {
  it('odaklanabilirler: devre dışı, tabindex=-1 ve inert altı hariç', () => {
    const { root } = setup(
      '<button id="a">a</button><button disabled>x</button><span tabindex="-1">y</span>' +
        '<div inert><button>z</button></div><input id="b" /><a href="#" id="c">c</a>',
    )
    expect(focusableIn(root).map((el) => el.id)).toEqual(['a', 'b', 'c'])
  })

  it('etkinleşince data-autofocus, yoksa ilk öğe; kapanınca tetiğe döner', () => {
    const { trigger, trap } = setup(
      '<button id="a">a</button><button id="b" data-autofocus>b</button>',
    )
    trap.activate()
    expect(document.activeElement?.id).toBe('b')
    trap.deactivate()
    expect(document.activeElement).toBe(trigger)
  })

  it('Tab sondan başa, Shift+Tab baştan sona döner', () => {
    const { trap } = setup('<button id="a">a</button><button id="b">b</button>')
    trap.activate()
    expect(document.activeElement?.id).toBe('a')
    const back = tab(true)
    trap.onKeydown(back)
    expect(back.defaultPrevented).toBe(true)
    expect(document.activeElement?.id).toBe('b')
    trap.onKeydown(tab())
    expect(document.activeElement?.id).toBe('a')
  })

  it('odaklanabilir yoksa odak kapsayıcıda kalır', () => {
    const { root, trap } = setup('<p>metin</p>')
    trap.activate()
    expect(document.activeElement).toBe(root)
    const event = tab()
    trap.onKeydown(event)
    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(root)
  })
})
