/**
 * Sayfa sayaçları (E-12-04/08; BE-110): tür segmenti sayaçları ve alt başlık `reportDeletedSummary`
 * değeridir (kesin; süzgeçten bağımsız). Özet gelmediyse sayaç çizilmez, alt başlık nötr kalır
 * (sahte sayı yok).
 */
import { computed } from 'vue'

import { useDeletedSummary } from '../api/summary'
import { SUMMARY_FIELD, type DeletedKind } from '../model/kinds'
import { deletedText } from '../model/messages'

export function usePageCounts(enabled: () => boolean, kind: () => DeletedKind) {
  const summary = useDeletedSummary(enabled)
  const counts = computed<Record<DeletedKind, number> | null>(() => {
    const data = summary.data.value
    if (!data) return null
    const out = {} as Record<DeletedKind, number>
    for (const [name, field] of Object.entries(SUMMARY_FIELD))
      out[name as DeletedKind] = data[field]
    return out
  })
  const subtitle = computed(() => {
    const n = counts.value?.[kind()] ?? null
    return n === null
      ? deletedText('page.sub.idle')
      : deletedText('page.sub.loaded', { n, kind: deletedText(`kindNames.${kind()}`) })
  })
  return { counts, subtitle }
}
