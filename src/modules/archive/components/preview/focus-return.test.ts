import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { defineComponent, h, ref } from 'vue'

import { useReturnFocus } from './focus-return'

afterEach(() => {
  document.body.innerHTML = ''
})

function setup(fileId = 'f1') {
  let restore!: () => Promise<void>
  const root = ref<HTMLElement | null>(null)
  const Panel = defineComponent({
    setup() {
      restore = useReturnFocus(() => fileId, root).restore
      return () => h('aside', { ref: root, tabindex: -1 }, h('button', { id: 'inside' }, 'x'))
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

  it('panel dışarıdan sökülünce odak panelin içindeyse karta taşınır (silme sonrası liste yenilemesi)', async () => {
    document.body.innerHTML = '<main><button id="card" data-file-id="f1">kart</button></main>'
    document.getElementById('card')!.focus()
    const { mountPanel } = setup()
    const wrapper = mountPanel()
    document.getElementById('inside')!.focus()
    document.getElementById('card')!.remove()
    document.querySelector('main')!.innerHTML = '<button id="next" data-file-id="f2">komşu</button>'
    wrapper.unmount()
    await nextTick()
    expect(document.activeElement?.id).toBe('next')
  })

  it('panel dışarıdan sökülürken odak panelin dışındaysa dokunulmaz', async () => {
    document.body.innerHTML =
      '<main><button id="card" data-file-id="f1">kart</button><input id="q" /></main>'
    document.getElementById('card')!.focus()
    const { mountPanel } = setup()
    const wrapper = mountPanel()
    document.getElementById('q')!.focus()
    wrapper.unmount()
    await nextTick()
    expect(document.activeElement?.id).toBe('q')
  })
})
