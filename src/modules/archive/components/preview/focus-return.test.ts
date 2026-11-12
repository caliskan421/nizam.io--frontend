import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import { useReturnFocus } from './focus-return'

afterEach(() => {
  document.body.innerHTML = ''
})

function setup(fileId = 'f1') {
  let restore!: () => Promise<void>
  const Panel = defineComponent({
    setup() {
      restore = useReturnFocus(() => fileId).restore
      return () => h('aside', 'panel')
    },
  })
  return { mountPanel: () => mount(Panel, { attachTo: document.body }), restore: () => restore() }
}

describe('useReturnFocus (KESİN 27)', () => {
  it('tetikleyici (kart) belgedeyse odak ona döner', async () => {
    document.body.innerHTML = '<main><button id="card" data-file-id="f1">kart</button></main>'
    const card = document.getElementById('card')!
    card.focus()
    const { mountPanel, restore } = setup()
    mountPanel()
    ;(document.activeElement as HTMLElement).blur()
    await restore()
    expect(document.activeElement).toBe(card)
  })

  it('tetikleyici gittiyse aynı dosyanın kartına, o da yoksa komşu karta döner', async () => {
    document.body.innerHTML = '<main><button id="old">eski</button></main>'
    document.getElementById('old')!.focus()
    const { mountPanel, restore } = setup('f2')
    mountPanel()
    document.getElementById('old')!.remove()
    document.querySelector('main')!.innerHTML =
      '<button id="a" data-file-id="f1">a</button><button id="b" data-file-id="f2">b</button>'
    await restore()
    expect(document.activeElement?.id).toBe('b')

    document.getElementById('b')!.remove()
    await restore()
    expect(document.activeElement?.id).toBe('a')
  })

  it('kart kalmadıysa ana bölgeye düşer, gövdeye değil', async () => {
    document.body.innerHTML = '<main><button id="old">eski</button></main>'
    document.getElementById('old')!.focus()
    const { mountPanel, restore } = setup()
    mountPanel()
    document.getElementById('old')!.remove()
    await restore()
    expect(document.activeElement).toBe(document.querySelector('main'))
    expect(document.activeElement).not.toBe(document.body)
  })
})
