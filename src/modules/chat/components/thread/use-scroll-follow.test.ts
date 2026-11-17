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

async function setup(initial: ChatMessage[], selector: string | null = null) {
  const items = shallowRef<readonly ChatMessage[]>([])
  const el = fakeList(() => items.value.length)
  const target = document.createElement('div')
  target.className = 'chat-sep--new'
  const calls: ScrollIntoViewOptions[] = []
  target.scrollIntoView = (options?: boolean | ScrollIntoViewOptions) =>
    void calls.push(options as ScrollIntoViewOptions)
  el.append(target)
  const list = ref<HTMLElement | null>(el)
  const Host = defineComponent({
    setup() {
      useScrollFollow({
        list,
        items: () => items.value,
        chatId: () => 'c1',
        ready: () => true,
        initialTarget: () => selector,
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
  return { items, el, calls }
}

describe('ilk iniş: okunmamış ayırıcı', () => {
  it('ayırıcı ortalanır (üste hizalanmaz): yapışkan gün etiketinin altında kalmaz', async () => {
    const { calls } = await setup(range(10), '.chat-sep--new')
    expect(calls).toEqual([{ block: 'center' }])
  })

  it('ayırıcı yoksa en alta iner, scrollIntoView çağrılmaz', async () => {
    const { calls, el } = await setup(range(10))
    expect(calls).toEqual([])
    expect(el.scrollTop).toBe(10 * 100)
  })
})

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
