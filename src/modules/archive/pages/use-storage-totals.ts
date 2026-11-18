/**
 * 06 depolama özeti girdileri: `programArchiveFolders` `totals` (BE-025). Veri okunana dek `null`;
 * hata yalnız veri hiç yokken (eski kapsamın verisi gösterilmez) hata sayılır.
 */
import { computed } from 'vue'

import type { StorageSummaryProps } from '../components'
import type { ArchiveContext } from '../model/context'

export function useStorageTotals(context: ArchiveContext) {
  return computed<StorageSummaryProps>(() => {
    const totals = context.folders.data.value?.totals
    return {
      totalFiles: totals?.file_count ?? null,
      totalBytes: totals?.total_bytes ?? null,
      byType: totals?.by_type ?? null,
      byTag: totals?.by_tag ?? null,
      loading: context.folders.isPending.value,
      error: context.folders.isError.value && totals === undefined,
    }
  })
}
