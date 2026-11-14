/**
 * Pencere okuyucusunun yükleniyor/hata durumu: `ChatPageContext.messages.query` (tipli; W156
 * SAHİPLİK-DIŞI İHTİYAÇ kapandı, KUSUR 5).
 */
import { computed, type ComputedRef } from 'vue'

import { useChatPage } from '../../model/context'

export function useMessagesState(): {
  loading: ComputedRef<boolean>
  failed: ComputedRef<boolean>
  retry: () => void
} {
  const { query } = useChatPage().messages
  return {
    loading: computed(() => query.isPending.value),
    failed: computed(() => query.isError.value),
    retry: () => void query.refetch(),
  }
}
