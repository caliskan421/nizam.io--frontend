/**
 * Görevin kaynak sohbet mesajı (BE-085 ters bağ, P86): S3 okuma, görevin kendi kapsamıyla
 * (program + departman). Anahtar kapsamlıdır (`queryKeys.workItems.sourceMessage`): kapsam
 * (program/mercek) değişince düşer, eski kapsamın geç yanıtı yeni kapsama yazılmaz; okuyucu
 * oturuma bağlıdır (`sessionBound`) ve `signal`'i iletir (KESİN 26b). Mesajdan görev açma ve
 * mesaj silme bağı yeniden okutur (`query-keys.ts`).
 */
import { useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'

import type { WorkTarget } from '../model/types'
import { fetchSourceMessage } from './fetchers'
import { retryTransient } from './http'

const STALE_MS = 30_000

export function useWorkItemSourceMessage(
  workItemId: MaybeRefOrGetter<string | null>,
  target: MaybeRefOrGetter<WorkTarget | null>,
) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      const id = toValue(workItemId)
      const resolved = toValue(target)
      return {
        queryKey: queryKeys.workItems.sourceMessage(scope, id ?? ''),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchSourceMessage(resolved!, id!, signal),
        ),
        enabled: id !== null && resolved !== null && scope.programId !== null,
        retry: retryTransient,
        staleTime: STALE_MS,
      }
    }),
  )
}
