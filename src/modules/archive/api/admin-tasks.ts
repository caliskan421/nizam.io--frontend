/**
 * Görev klasörleri (07). Koordinatör/üye: `archiveTasks` (başlıktaki departman zaten tek).
 * Yönetici (P33): `archiveTasks` program geneli döner ve `department_id` taşımaz → klasörün
 * görevleri `archiveTasks ∩ listProgramWorkItems(department_id = klasorId)` kesişimidir (tek
 * sayfa, 200 tavan; sonraki sayfa varsa `truncated` — kesişim eksik olabilir, kullanıcıya
 * söylenir). Görev listesi 03'ün AYNI önbellek girdisidir (`useWorkItemList`).
 */
import { computed } from 'vue'

import { useWorkItemList } from '@/modules/work/public'

import type { AdminTaskFolders } from '../model/types'
import type { ArchiveContext } from '../model/context'
import { useArchiveTasks } from './queries'

export function useArchiveTaskFolders(context: ArchiveContext) {
  const { access, target, readsOpen } = context
  const adminFolder = computed(() => access.value.mode === 'admin-folder')
  const tasks = useArchiveTasks(target, readsOpen)
  const work = useWorkItemList(
    () => (access.value.mode === 'admin-folder' ? access.value.folderId : null),
    undefined,
    () => adminFolder.value && readsOpen.value,
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
  return { tasks, work, folders }
}
