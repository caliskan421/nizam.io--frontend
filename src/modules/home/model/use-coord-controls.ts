/**
 * Koordinatörlük kartlarının yerel durumu (`mekanizma.md` §3; hepsi bellekte, URL ve depoda yok):
 * arama (kısa gecikmeyle süzülür, E-01-23), durum süzgeci, sıralama ölçütü + ters. Kapsam
 * değişince (program) hepsi sıfırlanır (K2). Bekleyen arama gecikmesi sahibin sökülmesinde ve
 * kapsam değişiminde iptal edilir (KESİN 26a); `flip` ters çevirir.
 */
import { onScopeDispose, ref, watch, type Ref } from 'vue'

import {
  coordSortDisabled,
  DEFAULT_COORD_SORT,
  type CoordFilter,
  type CoordSortKey,
} from './coordinatorships'

/** Arama gecikmesi (E-01-23; 03/08 ile aynı değer). */
export const COORD_SEARCH_DEBOUNCE_MS = 300

export function useCoordControls(resetOn: () => unknown) {
  /** Kutudaki ham metin. */
  const text = ref('')
  /** Süzgece giren (gecikmeli) metin. */
  const query = ref('')
  const filter: Ref<CoordFilter> = ref('all')
  const sortKey: Ref<CoordSortKey> = ref(DEFAULT_COORD_SORT)
  const reversed = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  function cancel(): void {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  watch(text, (value) => {
    cancel()
    if (value === query.value) return
    timer = setTimeout(() => {
      timer = null
      query.value = value
    }, COORD_SEARCH_DEBOUNCE_MS)
  })

  /** Ölçüt seçimi: `reversed=false` (mekanizma §3); devre dışı ölçüt seçilmez. */
  function pickSort(key: CoordSortKey): void {
    if (coordSortDisabled(key)) return
    sortKey.value = key
    reversed.value = false
  }

  function flip(): void {
    reversed.value = !reversed.value
  }

  function reset(): void {
    cancel()
    text.value = ''
    query.value = ''
    filter.value = 'all'
    sortKey.value = DEFAULT_COORD_SORT
    reversed.value = false
  }

  watch(resetOn, reset)
  onScopeDispose(cancel)

  return { text, query, filter, sortKey, reversed, pickSort, flip, reset }
}
