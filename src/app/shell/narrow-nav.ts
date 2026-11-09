import { computed, nextTick, onScopeDispose, ref, watch, type ComputedRef, type Ref } from 'vue'

import { tokenPx } from '@/shared/tokens/css-var'

/**
 * Dar ekran kenar menüsü (≤ `--rp-narrow-max`, 900 px; O4 görsel borç, Codex CX-F1-Ö-05). Tasarımda
 * mobil yok (P3 en sade): dar ekranda menü varsayılan KAPALI, üst çubuktaki düğmeyle perdeli
 * kaplama olarak açılır. Durum yalnız bellekte; rota değişince, Esc ya da perdeye tıklayınca kapanır.
 *
 * Kaplama (`overlay` = açık VE dar ekran) erişilebilir kip penceresi gibi davranır:
 *  - açılınca odak menüdeki ilk odaklanabilir öğeye girer; kapanınca açılıştaki odağa (yoksa
 *    tetikleyiciye) döner;
 *  - arka içerik klavye/ekran okuyucu için etkisizdir (kabuk `<main inert>` bağlar);
 *  - belge kaydırması kilitlenir (`<html class="rp-scroll-lock">`);
 *  - Esc (belge düzeyinde; iç öğe olayı işlediyse dokunulmaz) kapatır.
 * Geniş ekranda `open`'ın görünür etkisi yoktur; kaplama etkileri yalnız dar ekranda uygulanır.
 */
export interface NarrowNav {
  open: Ref<boolean>
  /** Kaplama etkin: açık ve dar ekran (arka içerik `inert`, kaydırma kilidi, odak menüde). */
  overlay: ComputedRef<boolean>
  toggle(): void
  close(): void
  /** Kapsam seçimi bekleniyor: seçici görünsün diye kaplama açılır. */
  reveal(): void
}

export interface NarrowNavDom {
  /** Kaplama kabı (kenar menüsü). */
  side: () => HTMLElement | null
  /** Açılıştaki odak geri verilemezse dönülecek tetikleyici (üst çubuk menü düğmesi). */
  trigger: () => HTMLElement | null
  /** Dar ekran mı (varsayılan: `--rp-narrow-max` medya koşulu). */
  narrow?: Ref<boolean>
}

export const SCROLL_LOCK_CLASS = 'rp-scroll-lock'

/** Dar ekran medya koşulu — eşik tek kaynaktan: `--rp-narrow-max` token'ı. */
export function narrowMediaQuery(): string {
  return `(max-width: ${tokenPx('rp-narrow-max')}px)`
}

/** `narrowMediaQuery()` eşleşmesi; `matchMedia` yoksa (ör. SSR/test) geniş varsayılır. */
export function useNarrowMedia(): Ref<boolean> {
  const narrow = ref(false)
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return narrow
  const media = window.matchMedia(narrowMediaQuery())
  narrow.value = media.matches
  const onChange = (event: MediaQueryListEvent) => {
    narrow.value = event.matches
  }
  media.addEventListener('change', onChange)
  onScopeDispose(() => media.removeEventListener('change', onChange))
  return narrow
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function firstFocusable(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>(FOCUSABLE)
}

export function useNarrowNav(path: () => string, dom?: NarrowNavDom): NarrowNav {
  const open = ref(false)
  const narrow = dom ? (dom.narrow ?? useNarrowMedia()) : ref(false)
  const overlay = computed(() => open.value && narrow.value)
  let returnTo: HTMLElement | null = null

  watch(path, () => {
    open.value = false
  })

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || event.defaultPrevented || !open.value) return
    open.value = false
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', onKeydown)
    onScopeDispose(() => document.removeEventListener('keydown', onKeydown))
  }

  if (dom) {
    watch(overlay, async (active) => {
      document.documentElement.classList.toggle(SCROLL_LOCK_CLASS, active)
      if (active) {
        const current = document.activeElement
        returnTo = current instanceof HTMLElement && current !== document.body ? current : null
        await nextTick()
        const side = dom.side()
        if (overlay.value && side) firstFocusable(side)?.focus()
        return
      }
      // Yalnız kapatılınca odak geri verilir (ekran genişleyince kaplama kalkar, odak yerinde).
      if (open.value) return
      const target = returnTo?.isConnected ? returnTo : dom.trigger()
      returnTo = null
      // `inert` kalkana dek (sonraki çizim) bekle; ardından odak tetikleyiciye.
      await nextTick()
      target?.focus()
    })
    onScopeDispose(() => document.documentElement.classList.remove(SCROLL_LOCK_CLASS))
  }

  return {
    open,
    overlay,
    toggle: () => {
      open.value = !open.value
    },
    close: () => {
      open.value = false
    },
    reveal: () => {
      open.value = true
    },
  }
}
