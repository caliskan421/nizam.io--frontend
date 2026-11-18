/**
 * 06 depolama özeti girdileri: `programArchiveFolders` `totals` (BE-025). Veri okunana dek `null`;
 * hata yalnız veri hiç yokken (eski kapsamın verisi gösterilmez) hata sayılır.
 */
import { computed } from 'vue'

import type { StorageSummaryProps } from '../components'
import type { ArchiveContext } from '../model/context'

type Totals = NonNullable<ArchiveContext['folders']['data']['value']>['totals']

function totalsProps(totals: Totals | undefined) {
  return {
    totalFiles: totals?.file_count ?? null,
    totalBytes: totals?.total_bytes ?? null,
    byType: totals?.by_type ?? null,
    byTag: totals?.by_tag ?? null,
  }
}

export function useStorageTotals(context: ArchiveContext) {
  return computed<StorageSummaryProps>(() => {
    const totals = context.folders.data.value?.totals
    const { isPending, isError } = context.folders
    // Verisiz hata sonrası yeniden çekme query-core'da zaten `pending`'dir (meşgul); verili (önbellekli)
    // toplamlar arka plan yeniden çekmesinde gizlenmez.
    return {
      ...totalsProps(totals),
      loading: isPending.value,
      error: isError.value && totals === undefined,
    }
  })
}
