import { useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'

import { scopeHeaders } from '@/modules/work/public'
import { api, unwrap } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'

import { keyScope } from '../model/admin-scope'
import type { ArchiveTarget } from '../model/types'
import type { ThumbnailQueue } from '../model/thumbnail-queue'

export function useFileThumbnail(
  target: () => ArchiveTarget,
  fileId: () => string | null,
  enqueue?: ThumbnailQueue,
) {
  const store = useScopeStore()
  const query = useQuery(
    computed(() => {
      const scope = store.snapshot
      const resolved = target()
      const id = fileId()
      const read = sessionBound(async ({ signal }: QueryFunctionContext) => {
        if (id === null) return null
        return unwrap(
          api.GET('/v1/files/{id}/thumbnail', {
            params: { header: scopeHeaders(resolved), path: { id } },
            parseAs: 'blob',
            signal,
            cache: 'no-store',
          }),
        )
      })
      return {
        queryKey: queryKeys.archive.thumbnail(keyScope(scope, resolved), id ?? ''),
        enabled: id !== null && scope.programId === resolved.programId,
        // Oturum damgası hem kuyruğa girişte hem gerçek ağ isteği öncesinde denetlenir.
        queryFn: enqueue
          ? sessionBound((context: QueryFunctionContext) =>
              enqueue(context.signal, () => read(context)),
            )
          : read,
        gcTime: 0,
        staleTime: Infinity,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      }
    }),
  )

  const url = ref<string | null>(null)
  watch(
    query.data,
    (blob, _previous, onCleanup) => {
      if (!(blob instanceof Blob) || blob.type !== 'image/jpeg' || blob.size === 0) return
      const created = URL.createObjectURL(blob)
      url.value = created
      onCleanup(() => {
        URL.revokeObjectURL(created)
        url.value = null
      })
    },
    { immediate: true, flush: 'sync' },
  )
  return { url, loading: query.isLoading }
}
