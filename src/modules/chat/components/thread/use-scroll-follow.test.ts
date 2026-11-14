import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue'

import { msg } from '../../__tests__/fixtures'
import type { ChatMessage } from '../../model/types'
import { useScrollFollow } from './use-scroll-follow'

/** Ölçülebilir sahte kaydırma kabı (jsdom'da yerleşim yok): yükseklik mesaj sayısından türer. */
function fakeList(count: () => number, row = 100) {
  const el = document.createElement('div')
  let top = 0
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: 500 })
  Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => count() * row })
  Object.defineProperty(el, 'scrollTop', {
    configurable: true,
    get: () => top,
    set: (v: number) => (top = v),
  })
  return el
}

async function setup(initial: ChatMessage[]) {
  const items = shallowRef<readonly ChatMessage[]>([])
  const el = fakeList(() => items.value.length)
  const list = ref<HTMLElement | null>(el)
  const Host = defineComponent({
    setup() {
      useScrollFollow({
        list,
        items: () => items.value,
        chatId: () => 'c1',
        ready: () => true,
        initialTarget: () => null,
        hasOlder: () => false,
        hasNewer: () => false,
        loadOlder: () => Promise.resolve(),
        loadNewer: () => Promise.resolve(),
      })
      return () => h('div')
    },
  })
  mount(Host)
  // İlk pencere yüklenir (ilk iniş: en alt).
  items.value = initial
  await nextTick()
  await flushPromises()
  return { items, el }
}

const range = (to: number) => Array.from({ length: to }, (_, i) => msg(i + 1))

describe('yeni mesajda alta kayma (KUSUR 12: SSE ile gelen mesaj en alttaki okuyucuyu alta indirir)', () => {
  it('en alttayken yeni mesaj eklenince (önceki liste ile karşılaştırılır) alta iner', async () => {
    const { items, el } = await setup(range(10))
    expect(el.scrollTop).toBe(10 * 100) // ilk iniş: en alt
    items.value = range(11)
    await nextTick()
    await flushPromises()
    expect(el.scrollTop).toBe(11 * 100)
  })

  it('yukarıda okurken yeni mesaj konumu bozmaz', async () => {
    const { items, el } = await setup(range(10))
    el.scrollTop = 100
    items.value = range(11)
    await nextTick()
    await flushPromises()
    expect(el.scrollTop).toBe(100)
  })
})
