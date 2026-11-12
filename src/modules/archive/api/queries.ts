/**
 * Arşiv okuyucuları (TanStack Query). Anahtarlar YALNIZ `shared/http/query-keys.ts`'ten ve
 * seçili kapsamın anlık görüntüsüyle kurulur; yöneticide departman alanı rotadaki klasörle
 * doldurulur (`keyScope`, P33) — kapsam değişince hepsi düşer (K2). Her okuyucu `sessionBound`
 * kapısından geçer ve `signal`'i iletir (KESİN 26b). S3 başlığı olmayan (hedefsiz) kipte sorgu
 * etkinleşmez: başlıksız istek yoktur. Süzgeç değişince anahtar değişir → imleç sıfırlanır.
 */
import {
  useInfiniteQuery,
  useQuery,
  type QueryFunctionContext,
  type QueryKey,
} from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { retryTransient } from '@/modules/work/public'
import { queryKeys, type ArchiveFacet, type QueryFilters } from '@/shared/http/query-keys'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'

import { filterKey } from '../model/filters'
import { keyScope } from '../model/admin-scope'
import type {
  ArchiveFileFilters,
  ArchiveFilePage,
  ArchiveTarget,
  MaybeFlag,
  MaybeTarget,
} from '../model/types'
import {
  fetchArchiveAttachments,
  fetchArchiveFolders,
  fetchArchiveTasks,
  fetchArchiveUploaders,
} from './fetchers'

export const ARCHIVE_STALE_MS = 30_000

/** Hedefin (yöneticide klasörün) kapsamıyla ayrışmış anahtar. */
function archiveKey(
  scope: ScopeSnapshot,
  target: ArchiveTarget | null,
  facet: ArchiveFacet,
  filters: QueryFilters = {},
): QueryKey {
  return queryKeys.archive.list(target ? keyScope(scope, target) : scope, facet, filters)
}

function plainReader<D>(
  target: MaybeTarget,
  enabled: MaybeFlag,
  facet: ArchiveFacet,
  fetcher: (target: ArchiveTarget, signal?: AbortSignal) => Promise<D>,
) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      const resolved = toValue(target)
      return {
        queryKey: archiveKey(scope, resolved, facet),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) => fetcher(resolved!, signal)),
        enabled: resolved !== null && toValue(enabled),
        retry: retryTransient,
        staleTime: ARCHIVE_STALE_MS,
      }
    }),
  )
}

/** `archiveFolders` — klasör özeti; yöneticide `klasorId` doğrulamasının ilk adımı. */
export function useArchiveFolders(target: MaybeTarget, enabled: MaybeFlag = true) {
  return plainReader(target, enabled, 'folders', fetchArchiveFolders)
}

/** `archiveTasks` — dosyalı görevler (görev adı sözlüğü de buradan). */
export function useArchiveTasks(target: MaybeTarget, enabled: MaybeFlag = true) {
  return plainReader(target, enabled, 'tasks', fetchArchiveTasks)
}

/** `archiveUploaders` — yükleyen hesap kimlikleri (ad yok; kişi araması kurulmaz, BE-071). */
export function useArchiveUploaders(target: MaybeTarget, enabled: MaybeFlag = true) {
  return plainReader(target, enabled, 'uploaders', fetchArchiveUploaders)
}

/**
 * `archiveAttachments` — imleçli sonsuz sorgu. `hasMore` → "n+" olgusu (toplam yok, BE-073);
 * "daha fazla yükle" = `loadMore()` (aynı uç, aynı süzgeç). Yönetici dosya okuması yalnız
 * `workItemId` süzgeciyle etkinleştirilir (`enabled`'ı çağıran kurar).
 */
export function useArchiveAttachments(
  target: MaybeTarget,
  filters: MaybeRefOrGetter<ArchiveFileFilters>,
  enabled: MaybeFlag = true,
) {
  const store = useScopeStore()
  const query = useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const resolved = toValue(target)
      const selected = toValue(filters)
      return {
        queryKey: archiveKey(scope, resolved, 'attachments', filterKey(selected)),
        queryFn: sessionBound(({ signal, pageParam }: QueryFunctionContext<QueryKey, string>) =>
          fetchArchiveAttachments(resolved!, selected, pageParam || undefined, signal),
        ),
        initialPageParam: '',
        getNextPageParam: (page: ArchiveFilePage) => page.next_cursor || undefined,
        enabled: resolved !== null && toValue(enabled),
        retry: retryTransient,
        staleTime: ARCHIVE_STALE_MS,
      }
    }),
  )
  const files = computed(() => query.data.value?.pages.flatMap((page) => page.files) ?? [])
  const hasMore = computed(() => query.hasNextPage.value === true)
  async function loadMore() {
    if (query.hasNextPage.value && !query.isFetchingNextPage.value) await query.fetchNextPage()
  }
  return { query, files, hasMore, loadMore }
}
