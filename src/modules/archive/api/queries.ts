/**
 * Arşiv okuyucuları (TanStack Query). Anahtarlar YALNIZ `shared/http/query-keys.ts`'ten ve
 * seçili kapsamın anlık görüntüsüyle kurulur; departman alanı kaynağın süzgeciyle doldurulur
 * (`keyScope`; yöneticide S2 `department_id`, K/Ü S3 başlığı) ve S2 kaynağı süzgece işaret koyar
 * (`sourceFilters`) — kapsam değişince hepsi düşer (K2). Her okuyucu `sessionBound` kapısından
 * geçer ve `signal`'i iletir (KESİN 26b). Kaynağı olmayan (`null`) kipte sorgu etkinleşmez:
 * başlıksız istek yoktur. Süzgeç değişince anahtar değişir → imleç sıfırlanır.
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
import { keyScope, sourceFilters } from '../model/admin-scope'
import type {
  ArchiveFileFilters,
  ArchiveFilePage,
  ArchiveSource,
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

/** Kaynağın (yöneticide klasörün / program süzgecinin) kapsamıyla ayrışmış anahtar. */
function archiveKey(
  scope: ScopeSnapshot,
  source: ArchiveSource | null,
  facet: ArchiveFacet,
  filters: QueryFilters = {},
): QueryKey {
  if (source === null) return queryKeys.archive.list(scope, facet, filters)
  return queryKeys.archive.list(keyScope(scope, source), facet, sourceFilters(source, filters))
}

function plainReader<D>(
  source: MaybeTarget,
  enabled: MaybeFlag,
  facet: ArchiveFacet,
  fetcher: (source: ArchiveSource, signal?: AbortSignal) => Promise<D>,
  filters: QueryFilters = {},
) {
  const store = useScopeStore()
  return useQuery(
    computed(() => {
      const scope = store.snapshot
      const resolved = toValue(source)
      return {
        queryKey: archiveKey(scope, resolved, facet, filters),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) => fetcher(resolved!, signal)),
        enabled: resolved !== null && toValue(enabled),
        retry: retryTransient,
        staleTime: ARCHIVE_STALE_MS,
      }
    }),
  )
}

/** `archiveFolders` / `programArchiveFolders` — klasör özeti + toplamlar; `klasorId` doğrulaması. */
export function useArchiveFolders(source: MaybeTarget, enabled: MaybeFlag = true) {
  return plainReader(source, enabled, 'folders', fetchArchiveFolders)
}

/** `archiveTasks` / `programArchiveTasks` — dosyalı görevler (görev adı sözlüğü de buradan). */
export function useArchiveTasks(source: MaybeTarget, enabled: MaybeFlag = true) {
  return plainReader(source, enabled, 'tasks', (s, signal) => fetchArchiveTasks(s, false, signal))
}

/**
 * Yükleme seçicisinin görevleri: `include_empty=true` ile dosyasız canlı görevler de (BE-121).
 * Klasör görevlerinden ve seçimli ZIP kümesinden AYRI anahtardır (onlar parametresizdir).
 */
export function useArchiveUploadTasks(source: MaybeTarget, enabled: MaybeFlag = true) {
  return plainReader(source, enabled, 'tasks', (s, signal) => fetchArchiveTasks(s, true, signal), {
    include_empty: 'true',
  })
}

/** `archiveUploaders` — yükleyen kimlikleri + `uploader_details` adları (BE-071). */
export function useArchiveUploaders(source: MaybeTarget, enabled: MaybeFlag = true) {
  return plainReader(source, enabled, 'uploaders', fetchArchiveUploaders)
}

/**
 * `archiveAttachments` / `programArchiveAttachments` — imleçli sonsuz sorgu. `total` sunucunun
 * süzgece uyan küme boyudur (`ArchiveFileList.total`, BE-073; imleçten bağımsız, her sayfada aynı);
 * süzgeç değişince yeniden okunur, sayfalardan türetilmez. "daha fazla yükle" = `loadMore()`
 * (aynı uç, aynı süzgeç).
 */
export function useArchiveAttachments(
  source: MaybeTarget,
  filters: MaybeRefOrGetter<ArchiveFileFilters>,
  enabled: MaybeFlag = true,
) {
  const store = useScopeStore()
  const query = useInfiniteQuery(
    computed(() => {
      const scope = store.snapshot
      const resolved = toValue(source)
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
  const total = computed<number | null>(() => {
    const value = query.data.value?.pages.at(-1)?.total
    return typeof value === 'number' ? value : null
  })
  async function loadMore() {
    if (query.hasNextPage.value && !query.isFetchingNextPage.value) await query.fetchNextPage()
  }
  return { query, files, hasMore, total, loadMore }
}
