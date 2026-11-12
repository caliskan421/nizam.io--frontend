/**
 * Seçili dosyanın önizleme okumaları (yalnız seçili dosya için; ızgara küçük resmi yok — BE-026):
 *  - Görsel gövde: `downloadFile` gövdesi `Authorization`'lı istemciyle `blob` okunur, `blob:`
 *    URL'ye çevrilir; URL söküm/dosya değişiminde `revokeObjectURL` ile serbest bırakılır.
 *    Üretim CSP'sinde `img-src blob:` gerekir (doğrulama: görsel duman; gevşetme yok). Yalnız
 *    raster görsel ve boyut sınırı içinde (`canPreview`); SVG/HTML gömülmez.
 *  - Yükleyen adı: `listWorkItemFiles` (`uploaded_by_full_name`; null → nötr). Alt görev adı:
 *    `listWorkItemSubtasks` (403 `work.not_assigned` → nötr, hata değil). İki okuma da yalnız
 *    seçili dosya için açılır (liste fan-out'u yok).
 */
import { useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed, onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

import { retryTransient, useWorkItemFiles, useWorkItemSubtasks } from '@/modules/work/public'
import { api, unwrap } from '@/shared/http'
import { scopeHeaders } from '@/modules/work/public'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { sessionBound } from '@/shared/session/query-session'

import { keyScope } from '../model/admin-scope'
import { canPreview } from '../model/mime'
import { subtaskTitle, uploaderName } from '../model/preview'
import type { ArchiveFile, ArchiveTarget } from '../model/types'

/** `downloadFile` gövdesi (S3, dosyanın departmanı); `blob` olarak okunur. */
export function fetchFileBlob(target: ArchiveTarget, fileId: string, signal?: AbortSignal) {
  return unwrap(
    api.GET('/v1/files/{id}/download', {
      params: { header: scopeHeaders(target), path: { id: fileId } },
      parseAs: 'blob',
      signal,
    }),
  )
}

/** Seçili görsel dosyanın `blob:` URL'si; sökülünce/dosya değişince serbest bırakılır. */
export function useFilePreview(
  target: MaybeRefOrGetter<ArchiveTarget | null>,
  file: MaybeRefOrGetter<ArchiveFile | null>,
) {
  const store = useScopeStore()
  const query = useQuery(
    computed(() => {
      const scope = store.snapshot
      const resolved = toValue(target)
      const selected = toValue(file)
      const eligible = resolved !== null && selected !== null && canPreview(selected)
      return {
        queryKey: queryKeys.archive.list(resolved ? keyScope(scope, resolved) : scope, 'preview', {
          file_id: selected?.file_id ?? '',
        }),
        queryFn: sessionBound(({ signal }: QueryFunctionContext) =>
          fetchFileBlob(resolved!, selected!.file_id, signal),
        ),
        enabled: eligible,
        retry: retryTransient,
        // Blob önbellekte tutulmaz: gözlemci kalkınca düşer, yeniden açılışta yeniden okunur.
        gcTime: 0,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
      }
    }),
  )
  const url = ref<string | null>(null)
  const stop = watch(
    () => query.data.value,
    (blob, _previous, onCleanup) => {
      if (!(blob instanceof Blob)) {
        url.value = null
        return
      }
      const created = URL.createObjectURL(blob)
      url.value = created
      onCleanup(() => {
        URL.revokeObjectURL(created)
        if (url.value === created) url.value = null
      })
    },
    { immediate: true, flush: 'sync' },
  )
  onScopeDispose(stop)
  return { query, url }
}

/** Seçili dosyanın yükleyen adı ve alt görev adı (iki yan okuma, yalnız seçili dosya için). */
export function usePreviewDetails(
  target: MaybeRefOrGetter<ArchiveTarget | null>,
  file: MaybeRefOrGetter<ArchiveFile | null>,
) {
  const selected = computed(() => toValue(file))
  const files = useWorkItemFiles(() => selected.value?.work_item_id ?? null, target)
  const subtasks = useWorkItemSubtasks(
    () => (selected.value?.subtask_id ? selected.value.work_item_id : null),
    target,
  )
  return {
    files,
    subtasks,
    uploaderName: computed(() =>
      selected.value ? uploaderName(files.data.value?.files, selected.value.file_id) : null,
    ),
    subtaskTitle: computed(() =>
      subtaskTitle(subtasks.data.value?.subtasks, selected.value?.subtask_id),
    ),
  }
}
