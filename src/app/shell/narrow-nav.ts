import { ref, watch, type Ref } from 'vue'

/**
 * Dar ekran kenar menüsü (≤ `--rp-narrow-max`, 900 px; O4 görsel borç). Tasarımda mobil yok
 * (P3 en sade): dar ekranda menü varsayılan KAPALI, üst çubuktaki düğmeyle perdeli kaplama
 * olarak açılır. Durum yalnız bellekte; rota değişince, Esc ya da perdeye tıklayınca kapanır.
 * Geniş ekranda bu durumun görünür etkisi yoktur (yalnız medya koşulu altındaki CSS okur).
 */
export interface NarrowNav {
  open: Ref<boolean>
  toggle(): void
  close(): void
  /** Kapsam seçimi bekleniyor: seçici görünsün diye kaplama açılır. */
  reveal(): void
}

export function useNarrowNav(path: () => string): NarrowNav {
  const open = ref(false)
  watch(path, () => {
    open.value = false
  })
  return {
    open,
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
