/**
 * Görev klasörleri (07): koordinatör/üye `archiveTasks`, yönetici `programArchiveTasks?department_id`
 * (S2; BE-072 — eski `archiveTasks ∩ listProgramWorkItems` kesişimi ve 200 tavan uyarısı
 * kalktı). Liste sunucuda kesildiyse (`X-Result-Truncated`) `truncated` söyler. Yükleme seçicisinin
 * görevleri ayrı okumadır (`useArchiveUploadTasks`, `include_empty=true`).
 */
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { isListTruncated } from '@/shared/http/truncation'

import type { TaskFolders } from '../model/types'
import type { ArchiveContext } from '../model/context'
import { useArchiveTasks } from './queries'

export function useArchiveTaskFolders(
  context: ArchiveContext,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const { source, readsOpen } = context
  const tasks = useArchiveTasks(source, () => readsOpen.value && toValue(enabled))
  const folders = computed<TaskFolders>(() => ({
    tasks: tasks.data.value?.tasks ?? [],
    truncated: isListTruncated(tasks.data.value),
    ready: tasks.data.value !== undefined,
  }))
  /** Görev listesinin ilk okuması başarısızsa hatası; veri bir kez geldiyse yenileme hatası ekranı bozmaz. */
  const failure = computed(() =>
    tasks.isError.value && tasks.data.value === undefined
      ? { source: 'tasks' as const, error: tasks.error.value }
      : null,
  )
  function retry(): void {
    void tasks.refetch()
  }
  const retrying = computed(() => tasks.isFetching.value)
  return { tasks, folders, failure, retry, retrying }
}
