/**
 * Dar ekran (≤ `--rp-narrow-max`) — tek kaynak token; kabuğun `useNarrowMedia`'sı `app/` içinde
 * olduğundan modül aynı eşiği `matchMedia` ile kendisi okur (P62: 390'da tek sütun).
 * `matchMedia` yoksa (test/SSR) geniş varsayılır.
 */
import { onScopeDispose, ref, type Ref } from 'vue'

import { tokenPx } from '@/shared/tokens/css-var'

export function useNarrow(): Ref<boolean> {
  const narrow = ref(false)
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return narrow
  const media = window.matchMedia(`(max-width: ${tokenPx('rp-narrow-max')}px)`)
  narrow.value = media.matches
  const onChange = (event: MediaQueryListEvent) => {
    narrow.value = event.matches
  }
  media.addEventListener('change', onChange)
  onScopeDispose(() => media.removeEventListener('change', onChange))
  return narrow
}
