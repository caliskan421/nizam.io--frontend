import type { Ref } from 'vue'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/** Kapsayıcı içindeki klavyeyle odaklanabilir öğeler (belge sırasıyla; `inert` altı hariç). */
export function focusableIn(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.closest('[inert]'))
}

/**
 * Odak tuzağı (pencere): `activate` önceki odağı saklar ve `[data-autofocus]` ya da ilk
 * odaklanabilir öğeye (yoksa kapsayıcıya) geçer; `onKeydown` Tab / Shift+Tab'ı içeride döndürür;
 * `deactivate` odağı önceki öğeye geri verir.
 */
export function useFocusTrap(container: Ref<HTMLElement | null>) {
  let previous: HTMLElement | null = null

  function activate(): void {
    previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = container.value
    if (!root) return
    const target = root.querySelector<HTMLElement>('[data-autofocus]') ?? focusableIn(root)[0]
    ;(target ?? root).focus()
  }

  function deactivate(): void {
    if (previous?.isConnected) previous.focus()
    previous = null
  }

  function onKeydown(event: KeyboardEvent): void {
    const root = container.value
    if (event.key !== 'Tab' || !root) return
    const items = focusableIn(root)
    const first = items[0]
    const last = items[items.length - 1]
    if (!first || !last) {
      event.preventDefault()
      root.focus()
      return
    }
    const active = document.activeElement
    if (event.shiftKey && (active === first || active === root || !root.contains(active))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (active === last || !root.contains(active))) {
      event.preventDefault()
      first.focus()
    }
  }

  return { activate, deactivate, onKeydown }
}
