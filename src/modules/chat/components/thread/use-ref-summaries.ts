/**
 * Mesajdaki görev/dosya/koordinatörlük referanslarının özetleri (`getChatRefSummary`; özet her
 * sohbet üyesine açıktır — P60: kilit yok, yalnız `available:false`). `ref_id` önbelleği
 * `useChatRefSummary` ile AYNI anahtardır; burada birden çok referans tek yerden okunur.
 */
import { useQueries } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'

import { fetchRefSummary } from '../../api/fetchers'
import { retryTransient } from '../../api/http'
import { REF_SUMMARY_STALE_MS } from '../../api/queries'
import type { ChatMessageRef, ChatRefSummary } from '../../model/types'

export function useRefSummaries(refs: MaybeRefOrGetter<readonly ChatMessageRef[]>) {
  const store = useScopeStore()
  const results = useQueries({
    queries: computed(() => {
      const scope = store.snapshot
      return toValue(refs).map((ref) => ({
        queryKey: queryKeys.chats.refSummary(scope, ref.ref_id),
        queryFn: sessionBound(({ signal }: { signal: AbortSignal }) =>
          fetchRefSummary(scope.programId!, ref.ref_id, signal),
        ),
        enabled: scope.programId !== null,
        staleTime: (query: { state: { data?: ChatRefSummary } }) =>
          query.state.data?.available === false ? 0 : REF_SUMMARY_STALE_MS,
        retry: retryTransient,
      }))
    }),
  })
  /** `ref_id` → özet (okunana dek yok). */
  return computed(() => {
    const out = new Map<string, ChatRefSummary>()
    toValue(refs).forEach((ref, i) => {
      const data = results.value[i]?.data
      if (data) out.set(ref.ref_id, data)
    })
    return out
  })
}
