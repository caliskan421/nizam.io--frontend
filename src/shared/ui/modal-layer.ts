import type { Ref } from 'vue'

import { focusableIn } from './focus-trap'

/**
 * Açık pencere katmanları (`UiModal`, `ConfirmDialog`) — odak kaybına karşı ortak koruma (W83, F2
 * görsel doğrulaması K-2).
 *
 * Sorun: gönderimde düğme `disabled` olunca tarayıcı odağı `BODY`'ye düşürür. Pencerenin kendi
 * `keydown` dinleyicisi artık olay almaz: Esc kapatmaz, Tab arka plana geçer.
 *
 *  - Belge düzeyinde tek `keydown` (yakalama evresi) dinleyicisi: odak hiçbir `aria-modal`
 *    pencerenin içinde DEĞİLKEN en üstteki katman olayı üstlenir — Esc katmanın kapanış kuralına
 *    gider (işlem sürerken kapanmayan pencere kapanmaz), Tab/Shift+Tab odağı pencereye geri alır.
 *    Odak bir pencerenin içindeyken hiçbir şey yapmaz (pencerenin kendi tuzağı çalışır).
 *  - Kurtarma: en üst katmanın içinde `aria-invalid` ya da `disabled` değiştiğinde odak kaybolmuşsa
 *    (`BODY`; ya da önceki kurtarmadan pencerenin kendisinde bekliyorsa) odak ilk hatalı alana, yoksa son odaklanan öğeye (hâlâ odaklanabiliyorsa), yoksa
 *    pencereye verilir.
 *  - `focusFirstInvalid()`: formlar doğrulama/sunucu alan hatasından sonra çağırır; odak en üst
 *    katmandaki ilk hatalı alana gider.
 */
interface Layer {
  panel: Ref<HTMLElement | null>
  escape: () => void
  last: HTMLElement | null
  observer: MutationObserver | null
  onFocusIn: (event: FocusEvent) => void
}

const stack: Layer[] = []

const INVALID = '[aria-invalid="true"]'

function top(): Layer | undefined {
  return stack[stack.length - 1]
}

/** Odak kayıp mı (belge gövdesinde ya da hiçbir yerde)? */
function focusLost(): boolean {
  const active = document.activeElement
  return active === null || active === document.body || active === document.documentElement
}

function insideAnyModal(node: EventTarget | null): boolean {
  return node instanceof Element && node.closest('[aria-modal="true"]') !== null
}

/** Kapsayıcıdaki ilk hatalı (ve odaklanabilir) denetim. */
export function firstInvalidIn(root: ParentNode): HTMLElement | null {
  const el = root.querySelector<HTMLElement>(INVALID)
  if (!el || el.closest('[inert]') || (el as HTMLInputElement).disabled) return null
  return el
}

function focusable(el: HTMLElement | null): el is HTMLElement {
  if (!el?.isConnected) return false
  const root = el.closest<HTMLElement>('.t-modal')
  return root !== null && focusableIn(root).includes(el)
}

function rescue(layer: Layer): void {
  const root = layer.panel.value
  // Pencerenin kendisi yalnız bekleme yeridir (önceki kurtarma): hatalı alan çıkınca oraya geçilir.
  if (!root || top() !== layer || !(focusLost() || document.activeElement === root)) return
  const target = firstInvalidIn(root) ?? (focusable(layer.last) ? layer.last : null) ?? root
  target.focus()
}

function onDocumentKeydown(event: KeyboardEvent): void {
  const layer = top()
  const root = layer?.panel.value
  if (!layer || !root) return
  if (event.key !== 'Escape' && event.key !== 'Tab') return
  // Odak bir pencerenin içinde: o pencerenin kendi tuzağı ve Esc'i çalışır.
  if (insideAnyModal(event.target) || insideAnyModal(document.activeElement)) return
  event.preventDefault()
  event.stopPropagation()
  if (event.key === 'Escape') {
    layer.escape()
    return
  }
  const items = focusableIn(root)
  const invalid = firstInvalidIn(root)
  const target = invalid ?? (event.shiftKey ? items[items.length - 1] : items[0]) ?? root
  target.focus()
}

/**
 * Katman yaşamı: `enter` pencere açılıp panel DOM'a girdikten sonra, `leave` kapanırken çağrılır.
 * `escape` pencerenin Esc kuralıdır (kapatılamıyorsa hiçbir şey yapmaz).
 */
export function useModalLayer(panel: Ref<HTMLElement | null>, escape: () => void) {
  let layer: Layer | null = null

  function enter(): void {
    if (layer) return
    const created: Layer = {
      panel,
      escape,
      last: null,
      observer: null,
      onFocusIn: (event) => {
        if (event.target instanceof HTMLElement) created.last = event.target
      },
    }
    layer = created
    if (stack.length === 0) document.addEventListener('keydown', onDocumentKeydown, true)
    stack.push(created)
    const root = panel.value
    if (root) {
      root.addEventListener('focusin', created.onFocusIn)
      created.observer = new MutationObserver(() => rescue(created))
      created.observer.observe(root, {
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-invalid', 'disabled'],
      })
    }
  }

  function leave(): void {
    const current = layer
    if (!current) return
    layer = null
    current.observer?.disconnect()
    current.panel.value?.removeEventListener('focusin', current.onFocusIn)
    const index = stack.indexOf(current)
    if (index >= 0) stack.splice(index, 1)
    if (stack.length === 0) document.removeEventListener('keydown', onDocumentKeydown, true)
  }

  return { enter, leave }
}

/**
 * En üst penceredeki ilk hatalı alana odaklanır (form doğrulaması ya da sunucu alan hatası
 * sonrası; çağıran DOM güncellendikten sonra — `nextTick` — çağırır). Bulunduysa `true`.
 */
export function focusFirstInvalid(): boolean {
  const root = top()?.panel.value
  const target = root ? firstInvalidIn(root) : null
  if (!target) return false
  target.focus()
  return true
}

/** Yalnız test: açık katman sayısı. */
export function openLayerCount(): number {
  return stack.length
}
