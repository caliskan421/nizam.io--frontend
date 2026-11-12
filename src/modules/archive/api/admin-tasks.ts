/**
 * Görev klasörleri (07). Koordinatör/üye: `archiveTasks` (başlıktaki departman zaten tek).
 * Yönetici (P33): `archiveTasks` program geneli döner ve `department_id` taşımaz → klasörün
 * görevleri `archiveTasks ∩ listProgramWorkItems(department_id = klasorId)` kesişimidir (tek
 * sayfa, 200 tavan; sonraki sayfa varsa `truncated` — kesişim eksik olabilir, kullanıcıya
 * söylenir). Görev listesi 03'ün AYNI önbellek girdisidir (`useWorkItemList`).
 */
import { computed } from 'vue'

import { toValue, type MaybeRefOrGetter } from 'vue'

import { useWorkItemList } from '@/modules/work/public'

import type { AdminTaskFolders } from '../model/types'
import type { ArchiveContext } from '../model/context'
import { useArchiveTasks } from './queries'

export function useArchiveTaskFolders(
  context: ArchiveContext,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const { access, target, readsOpen } = context
  const adminFolder = computed(() => access.value.mode === 'admin-folder')
  const tasks = useArchiveTasks(target, () => readsOpen.value && toValue(enabled))
  const work = useWorkItemList(
    () => (access.value.mode === 'admin-folder' ? access.value.folderId : null),
    undefined,
    () => adminFolder.value && readsOpen.value && toValue(enabled),
  )
  const folders = computed<AdminTaskFolders>(() => {
    const archived = tasks.data.value?.tasks ?? []
    if (!adminFolder.value) {
      return { tasks: archived, truncated: false, ready: tasks.data.value !== undefined }
    }
    const ids = new Set(work.items.value.map((item) => item.work_item_id))
    const ready = tasks.data.value !== undefined && work.query.data.value !== undefined
    return {
      tasks: ready ? archived.filter((task) => ids.has(task.work_item_id)) : [],
      truncated: work.query.hasNextPage.value === true,
      ready,
    }
  })
  /**
   * Kesişimin iki bağımlılığının hatası BİRLİKTE (Ö-02): ilk okuması başarısız olan kaynak
   * (`source`) ve hatası. Veri bir kez geldiyse sonraki yenileme hatası ekranı bozmaz.
   */
  const failure = computed<TaskFoldersFailure | null>(() => {
    if (folders.value.ready) return null
    if (tasks.isError.value && tasks.data.value === undefined) {
      return { source: 'tasks', error: tasks.error.value }
    }
    if (adminFolder.value && work.query.isError.value && work.query.data.value === undefined) {
      return { source: 'work', error: work.query.error.value }
    }
    return null
  })
  /** "Yeniden dene": kesişimin her iki sorgusu (yönetici dışında yalnız `archiveTasks`). */
  function retry(): void {
    void tasks.refetch()
    if (adminFolder.value) void work.query.refetch()
  }
  const retrying = computed(
    () => tasks.isFetching.value || (adminFolder.value && work.query.isFetching.value),
  )
  return { tasks, work, folders, failure, retry, retrying }
}

export interface TaskFoldersFailure {
  source: 'tasks' | 'work'
  error: unknown
}
