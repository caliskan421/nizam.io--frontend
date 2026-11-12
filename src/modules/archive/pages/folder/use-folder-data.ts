/**
 * 07 veri bileşimi: bağlam (`useArchiveContext`), görev klasörleri (`useArchiveTaskFolders`) ve
 * dosya sayfaları (`useArchiveAttachments`). Dosya okuması kuralları (P33, `mekanizma.md` §3):
 *  - Görev süzgeci (`gorev`) görev listesiyle doğrulanır; listede olmayan kimlik yok sayılır
 *    (yönetici için dosyanın departmanı bilinemez).
 *  - Yöneticide dosyalar yalnız doğrulanmış görev seçiliyken okunur; aksi `needsTask`
 *    ("Görev klasörü seçin", BE-072) ve S3 dosya isteği YOK.
 *  - Toplam yalnız süzgeçsizde klasör, yalnız görev süzgecinde görev sayacından bilinir
 *    (`knownTotal`); diğerinde "n+" (BE-073).
 */
import { computed, type Ref } from 'vue'

import { useArchiveTaskFolders } from '../../api/admin-tasks'
import { useArchiveContext } from '../../api/context'
import { useArchiveAttachments } from '../../api/queries'
import { knownTotal } from '../../model/filters'
import { archiveFolderCards } from '../../model/folder-cards'
import { taskTitles, uploadTasks } from '../../model/tasks'
import type { ArchiveFileFilters } from '../../model/types'
import type { FolderUrlState } from './url-state'

/** Görev klasörleri + doğrulanmış görev süzgeci (yönetici için `needsTask`). */
function useTaskScope(ctx: ReturnType<typeof useArchiveContext>, url: Ref<FolderUrlState>) {
  const taskFolders = useArchiveTaskFolders(ctx)
  const taskList = computed(() => taskFolders.folders.value.tasks)
  const tasksReady = computed(() => taskFolders.folders.value.ready)
  const tasksFailed = computed(() => taskFolders.tasks.isError.value)
  const adminFolder = computed(() => ctx.access.value.mode === 'admin-folder')
  /** Doğrulanmış görev süzgeci; doğrulama beklerken `undefined`. */
  const verifiedTask = computed<string | null | undefined>(() => {
    const id = url.value.task
    if (id === null) return null
    if (tasksReady.value) {
      return taskList.value.some((t) => t.work_item_id === id) ? id : null
    }
    if (tasksFailed.value) return adminFolder.value ? null : id
    return undefined
  })
  const activeTask = computed(() => verifiedTask.value ?? null)
  const needsTask = computed(() => adminFolder.value && activeTask.value === null)
  return {
    taskFolders,
    taskList,
    verifiedTask,
    activeTask,
    needsTask,
    tasksLoading: computed(() => !tasksReady.value && !tasksFailed.value),
  }
}

export function useFolderData(folderId: Ref<string | null>, url: Ref<FolderUrlState>) {
  const ctx = useArchiveContext(folderId)
  const scope = useTaskScope(ctx, url)
  const { taskList, verifiedTask, activeTask, needsTask } = scope

  const folder = computed(() => ctx.folderList.value?.find((f) => f.folder_id === folderId.value))
  const treeFolders = computed(() => archiveFolderCards(ctx.folderList.value))

  const filters = computed<ArchiveFileFilters>(() => ({
    ...(url.value.tag ? { tag: url.value.tag } : {}),
    ...(url.value.q.trim() ? { search: url.value.q.trim() } : {}),
    ...(activeTask.value ? { workItemId: activeTask.value } : {}),
  }))
  const filesEnabled = computed(
    () => ctx.readsOpen.value && verifiedTask.value !== undefined && !needsTask.value,
  )
  const attachments = useArchiveAttachments(ctx.target, filters, filesEnabled)
  const query = attachments.query

  const total = computed(() =>
    knownTotal(filters.value, {
      folder: folder.value?.file_count ?? null,
      task: taskList.value.find((t) => t.work_item_id === activeTask.value)?.file_count ?? null,
    }),
  )
  const filesLoading = computed(
    () =>
      !needsTask.value &&
      (verifiedTask.value === undefined ||
        (query.isPending.value && filesEnabled.value) ||
        query.isFetchingNextPage.value),
  )

  return {
    ctx,
    ...scope,
    folder,
    treeFolders,
    attachments,
    total,
    titles: computed(() => taskTitles(taskList.value)),
    uploads: computed(() => uploadTasks(taskList.value, ctx.target.value?.departmentId ?? null)),
    filesLoading,
    filesError: computed(() => query.isError.value && filesEnabled.value),
    /** Dosya sayfaları yerleşti (hata yok, uçuşta istek yok). */
    filesSettled: computed(
      () => filesEnabled.value && query.isSuccess.value && !query.isFetching.value,
    ),
  }
}
