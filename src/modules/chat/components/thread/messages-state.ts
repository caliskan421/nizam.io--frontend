/**
 * Pencere okuyucusunun yükleniyor/hata durumu. `ChatPageContext.messages` tipi bu alanları
 * açmaz (sözleşme değişmez); sayfa sahibi `useChatMessages` sonucunun tamamını verir, `query`
 * çalışma anında vardır. Yoksa (ör. sahte bağlam) durum "hazır" sayılır.
 * SAHİPLİK-DIŞI İHTİYAÇ: `ChatPageContext.messages.query` tipli olarak açılmalı.
 */
import { computed, type ComputedRef, type Ref } from 'vue'

import { useChatPage } from '../../model/context'

interface QueryLike {
  isPending: Ref<boolean>
  isError: Ref<boolean>
  refetch: () => Promise<unknown>
}

function queryOf(messages: unknown): QueryLike | null {
  if (typeof messages !== 'object' || messages === null || !('query' in messages)) return null
  return (messages as { query: QueryLike }).query
}

export function useMessagesState(): {
  loading: ComputedRef<boolean>
  failed: ComputedRef<boolean>
  retry: () => void
} {
  const page = useChatPage()
  const query = queryOf(page.messages)
  return {
    loading: computed(() => query?.isPending.value ?? false),
    failed: computed(() => query?.isError.value ?? false),
    retry: () => void query?.refetch(),
  }
}
