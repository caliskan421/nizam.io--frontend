import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, type Ref, type VNode } from 'vue'

import {
  narrowMediaQuery,
  SCROLL_LOCK_CLASS,
  useNarrowMedia,
  useNarrowNav,
  type NarrowNav,
} from './narrow-nav'

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

/** Bileşen bağlamında `run` çalıştırır; dönen işlev çizimdir. */
const Host = defineComponent({
  props: { run: { type: Function, required: true } },
  setup(props) {
    const render = (props.run as () => (() => VNode | null) | void)()
    return render ?? (() => null)
  },
})
const host = (run: () => (() => VNode | null) | void) =>
  mount(Host, { props: { run }, attachTo: document.body })

describe('dar ekran kenar menüsü durumu', () => {
  it('varsayılan kapalı; aç/kapat, reveal açar', () => {
    const nav = useNarrowNav(() => '/')
    expect(nav.open.value).toBe(false)
    nav.toggle()
    expect(nav.open.value).toBe(true)
    nav.toggle()
    expect(nav.open.value).toBe(false)
    nav.reveal()
    expect(nav.open.value).toBe(true)
    nav.close()
    expect(nav.open.value).toBe(false)
  })

  it('rota değişince kapanır', async () => {
    const path = ref('/')
    const nav = useNarrowNav(() => path.value)
    nav.toggle()
    path.value = '/gorevler'
    await nextTick()
    expect(nav.open.value).toBe(false)
  })
})

describe('medya koşulu tek kaynaktan', () => {
  it('eşik --rp-narrow-max token değeri', () => {
    expect(narrowMediaQuery()).toBe('(max-width: 900px)')
  })

  it('matchMedia eşleşmesi ve değişimi izlenir; yoksa geniş', () => {
    const listeners: Array<(e: { matches: boolean }) => void> = []
    const matchMedia = vi.fn(() => ({
      matches: true,
      addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => listeners.push(fn),
      removeEventListener: vi.fn(),
    }))
    vi.stubGlobal('matchMedia', matchMedia)
    let narrow!: Ref<boolean>
    const wrapper = host(() => {
      narrow = useNarrowMedia()
    })
    expect(matchMedia).toHaveBeenCalledWith('(max-width: 900px)')
    expect(narrow.value).toBe(true)
    listeners[0]!({ matches: false })
    expect(narrow.value).toBe(false)
    wrapper.unmount()
    vi.unstubAllGlobals()
    vi.stubGlobal('matchMedia', undefined)
    const off = host(() => {
      narrow = useNarrowMedia()
    })
    expect(narrow.value).toBe(false)
    off.unmount()
  })
})

/** Kabuğun dar menü düzeni: tetikleyici + arka içerik (`main inert`) + kenar menüsü. */
function mountShell(narrow: Ref<boolean>, path: Ref<string> = ref('/')) {
  let nav!: NarrowNav
  const wrapper = host(() => {
    nav = useNarrowNav(() => path.value, {
      side: () => document.getElementById('app-side'),
      trigger: () => document.querySelector<HTMLElement>('[aria-controls="app-side"]'),
      narrow,
    })
    return () =>
      h('div', [
        h('aside', { id: 'app-side' }, [
          h('button', { 'data-testid': 'first' }, 'Daralt'),
          h('a', { href: '/gorevler' }, 'Görevler'),
        ]),
        h('main', { inert: nav.overlay.value || undefined }, [
          h('button', { 'aria-controls': 'app-side', onClick: () => nav.toggle() }, 'Menü'),
          h('button', { 'data-testid': 'content' }, 'İçerik'),
        ]),
      ])
  })
  return { wrapper, nav: () => nav }
}

const trigger = () => document.querySelector<HTMLElement>('[aria-controls="app-side"]')!
const main = () => document.querySelector('main')!
const pressEscape = (target: EventTarget = document.activeElement ?? document.body) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

describe('dar ekran kaplaması (Codex CX-F1-Ö-05)', () => {
  it('açılınca odak menüye girer, arka içerik inert, kaydırma kilitli; Esc kapatır, odak tetikleyiciye döner', async () => {
    const { wrapper, nav } = mountShell(ref(true))
    trigger().focus()
    trigger().click()
    await flushPromises()
    expect(nav().overlay.value).toBe(true)
    expect(document.activeElement).toBe(document.querySelector('[data-testid="first"]'))
    expect(main().hasAttribute('inert')).toBe(true)
    expect(document.documentElement.classList.contains(SCROLL_LOCK_CLASS)).toBe(true)

    pressEscape()
    await flushPromises()
    expect(nav().open.value).toBe(false)
    expect(main().hasAttribute('inert')).toBe(false)
    expect(document.documentElement.classList.contains(SCROLL_LOCK_CLASS)).toBe(false)
    expect(document.activeElement).toBe(trigger())
    wrapper.unmount()
  })

  it('Esc odak belgedeyken de kapatır; iç öğe işlediyse (defaultPrevented) dokunmaz', async () => {
    const { wrapper, nav } = mountShell(ref(true))
    nav().reveal()
    await flushPromises()
    const handled = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    handled.preventDefault()
    document.querySelector('[data-testid="first"]')!.dispatchEvent(handled)
    expect(nav().open.value).toBe(true)
    pressEscape(document.body)
    expect(nav().open.value).toBe(false)
    await flushPromises()
    // Açılışta odak yoktu (reveal): tetikleyiciye döner.
    expect(document.activeElement).toBe(trigger())
    wrapper.unmount()
  })

  it('rota değişince kapanır; odak tetikleyiciye döner, inert kalkar', async () => {
    const path = ref('/')
    const { wrapper, nav } = mountShell(ref(true), path)
    trigger().focus()
    nav().toggle()
    await flushPromises()
    path.value = '/gorevler'
    await flushPromises()
    expect(nav().open.value).toBe(false)
    expect(main().hasAttribute('inert')).toBe(false)
    expect(document.activeElement).toBe(trigger())
    wrapper.unmount()
  })

  it('geniş ekranda açık bayrağın kaplama etkisi yok (inert, kilit, odak taşıma yok)', async () => {
    const { wrapper, nav } = mountShell(ref(false))
    const content = document.querySelector<HTMLElement>('[data-testid="content"]')!
    content.focus()
    nav().reveal()
    await flushPromises()
    expect(nav().overlay.value).toBe(false)
    expect(main().hasAttribute('inert')).toBe(false)
    expect(document.documentElement.classList.contains(SCROLL_LOCK_CLASS)).toBe(false)
    expect(document.activeElement).toBe(content)
    wrapper.unmount()
  })

  it('açıkken ekran genişlerse kaplama kalkar, odak yerinde kalır; sökülünce kilit temizlenir', async () => {
    const narrow = ref(true)
    const { wrapper, nav } = mountShell(narrow)
    trigger().focus()
    nav().toggle()
    await flushPromises()
    const first = document.activeElement
    narrow.value = false
    await flushPromises()
    expect(main().hasAttribute('inert')).toBe(false)
    expect(document.activeElement).toBe(first)
    narrow.value = true
    await flushPromises()
    expect(document.documentElement.classList.contains(SCROLL_LOCK_CLASS)).toBe(true)
    wrapper.unmount()
    expect(document.documentElement.classList.contains(SCROLL_LOCK_CLASS)).toBe(false)
  })
})
