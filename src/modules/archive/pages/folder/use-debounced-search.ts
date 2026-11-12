/**
 * Arama kutusu metni ↔ URL `q` (gecikmeli, mekanizma §3 "yazarken gecikmeli"). Zamanlayıcı sahibi
 * (sayfa) sökülürken ve `cancel()` ile iptal edilir: sökülmüş ekran URL'ye yazmaz (KESİN 26a).
 * URL dışarıdan değişirse (geri tuşu) kutu ona uyar; enter gecikmeyi atlar.
 */
import { onScopeDispose, ref, watch, type Ref } from 'vue'

export const SEARCH_DEBOUNCE_MS = 300

export function useDebouncedSearch(urlValue: Ref<string>, commit: (value: string) => unknown) {
  const text = ref(urlValue.value)
  let timer: ReturnType<typeof setTimeout> | null = null

  function cancel(): void {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  function flush(): void {
    cancel()
    if (text.value.trim() !== urlValue.value.trim()) void commit(text.value)
  }

  watch(text, (value) => {
    cancel()
    if (value.trim() === urlValue.value.trim()) return
    timer = setTimeout(() => {
      timer = null
      void commit(value)
    }, SEARCH_DEBOUNCE_MS)
  })
  watch(urlValue, (value) => {
    if (timer === null && value !== text.value) text.value = value
  })
  onScopeDispose(cancel)

  return { text, flush, cancel, reset: () => ((text.value = ''), cancel()) }
}
