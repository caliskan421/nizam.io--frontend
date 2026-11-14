import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

import { useScopeStore } from '@/shared/scope/store'

import { usePanelDismiss } from './use-panel-dismiss'

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
  document.documentElement.className = ''
})

let listeners: Array<() => void> = []
let narrowNow = false
beforeEach(() => {
  listeners = []
  narrowNow = false
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      get matches() {
        return narrowNow
      },
      addEventListener: (_: string, fn: () => void) => listeners.push(fn),
      removeEventListener: (_: string, fn: () => void) => {
        listeners = listeners.filter((l) => l !== fn)
      },
    })),
  )
})

function host() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const open = ref(false)
  const close = vi.fn(() => (open.value = false))
  let api!: ReturnType<typeof usePanelDismiss>
  const wrapper = mount(
    defineComponent({
      setup() {
        const root = ref<HTMLElement | null>(null)
        api = usePanelDismiss({ open: () => open.value, root, close })
        return () => (open.value ? h('div', { ref: root, tabindex: -1 }, [h('button', 'a')]) : null)
      },
    }),
    { global: { plugins: [pinia] }, attachTo: document.body },
  )
  return { wrapper, open, close, api: () => api }
}

describe('usePanelDismiss', () => {
  it('açılışta odak içeri; kapanışta zil yoksa önceki odağa döner', async () => {
    const previous = document.createElement('button')
    document.body.append(previous)
    previous.focus()
    const h1 = host()
    h1.open.value = true
    await flushPromises()
    expect(document.activeElement?.tagName).toBe('BUTTON')
    expect(document.activeElement).not.toBe(previous)
    h1.open.value = false
    await flushPromises()
    expect(document.activeElement).toBe(previous)
  })

  it('medya sorgusu değişince dar ekran kipi ve kaydırma kilidi canlı güncellenir', async () => {
    const h1 = host()
    h1.open.value = true
    await flushPromises()
    expect(h1.api().narrow.value).toBe(false)
    expect(document.documentElement.classList.contains('rp-scroll-lock')).toBe(false)
    narrowNow = true
    listeners.forEach((l) => l())
    await nextTick()
    expect(h1.api().narrow.value).toBe(true)
    expect(document.documentElement.classList.contains('rp-scroll-lock')).toBe(true)
    narrowNow = false
    listeners.forEach((l) => l())
    expect(document.documentElement.classList.contains('rp-scroll-lock')).toBe(false)
  })

  it('kapanınca medya dinleyicisi sökülür', async () => {
    const h1 = host()
    h1.open.value = true
    await flushPromises()
    expect(listeners).toHaveLength(1)
    h1.open.value = false
    await flushPromises()
    expect(listeners).toHaveLength(0)
  })

  it('kapsam değişimi açıkken kapanış ister; kapalıyken istemez', async () => {
    const h1 = host()
    const scope = useScopeStore()
    scope.commit({ programId: 'p1', lens: 'admin', departmentId: null })
    await nextTick()
    scope.setProgram('p2')
    await nextTick()
    expect(h1.close).not.toHaveBeenCalled()
    h1.open.value = true
    await flushPromises()
    scope.setProgram('p3')
    await nextTick()
    expect(h1.close).toHaveBeenCalledTimes(1)
  })

  it('matchMedia olmayan ortamda dar ekran sayılmaz (hata yok)', async () => {
    vi.stubGlobal('matchMedia', undefined)
    const h1 = host()
    h1.open.value = true
    await flushPromises()
    expect(h1.api().narrow.value).toBe(false)
  })

  it('dış tık kapatır; panelin ÜSTÜNDEKİ pencerenin (aria-modal) içindeki basış kapatmaz', async () => {
    const h1 = host()
    h1.open.value = true
    await flushPromises()
    const modal = document.createElement('div')
    modal.setAttribute('aria-modal', 'true')
    const inside = document.createElement('button')
    modal.append(inside)
    const outside = document.createElement('button')
    document.body.append(modal, outside)
    inside.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    expect(h1.close).not.toHaveBeenCalled()
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    expect(h1.close).toHaveBeenCalledTimes(1)
  })
})
