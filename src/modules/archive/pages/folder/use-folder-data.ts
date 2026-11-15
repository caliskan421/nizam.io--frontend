/**
 * 07 veri bileşimi: bağlam (`useArchiveContext`), görev klasörleri (`useArchiveTaskFolders`) ve
 * dosya sayfaları (`useArchiveAttachments`). Dosya okuması kuralları (`mekanizma.md` §3):
 *  - Görev süzgeci (`gorev`) görev listesiyle doğrulanır; listede olmayan kimlik yok sayılır.
 *  - Yöneticide de dosyalar klasör düzeyinde okunur (`programArchiveAttachments?department_id`,
 *    BE-072): görev seçmek zorunlu değildir, "Görev klasörü seçin" boş durumu yoktur.
 *  - Toplam sunucunun süzgece uyan küme boyudur (`ArchiveFileList.total`, BE-073).
 */
import { computed, type Ref } from 'vue'

import { useArchiveTaskFolders } from '../../api/admin-tasks'
import { useArchiveContext } from '../../api/context'
import { useArchiveAttachments, useArchiveUploadTasks } from '../../api/queries'
import { archiveFolderCards } from '../../model/folder-cards'
import { taskTitles, uploadTasks } from '../../model/tasks'
import type { ArchiveFileFilters } from '../../model/types'
import type { FolderUrlState } from './url-state'

/** Görev klasörleri + doğrulanmış görev süzgeci. */
function useTaskScope(ctx: ReturnType<typeof useArchiveContext>, url: Ref<FolderUrlState>) {
  const taskFolders = useArchiveTaskFolders(ctx)
  const taskList = computed(() => taskFolders.folders.value.tasks)
  const tasksReady = computed(() => taskFolders.folders.value.ready)
  const tasksFailure = computed(() => taskFolders.failure.value)
  const tasksFailed = computed(() => tasksFailure.value !== null)
  /** Doğrulanmış görev süzgeci; doğrulama beklerken `undefined`. */
  const verifiedTask = computed<string | null | undefined>(() => {
    const id = url.value.task
    if (id === null) return null
    if (tasksReady.value) {
      return taskList.value.some((t) => t.work_item_id === id) ? id : null
    }
    if (tasksFailed.value) return id
    return undefined
  })
  const activeTask = computed(() => verifiedTask.value ?? null)
  return {
    taskFolders,
    taskList,
    verifiedTask,
    activeTask,
    tasksFailed,
    tasksFailure,
    tasksLoading: computed(() => !tasksReady.value && !tasksFailed.value),
  }
}

export function useFolderData(folderId: Ref<string | null>, url: Ref<FolderUrlState>) {
  const ctx = useArchiveContext(folderId)
  const scope = useTaskScope(ctx, url)
  const { taskList, verifiedTask, activeTask } = scope

  const folder = computed(() => ctx.folderList.value?.find((f) => f.folder_id === folderId.value))
  const treeFolders = computed(() => archiveFolderCards(ctx.folderList.value))

  const filters = computed<ArchiveFileFilters>(() => ({
    ...(url.value.tag ? { tag: url.value.tag } : {}),
    ...(url.value.q.trim() ? { search: url.value.q.trim() } : {}),
    ...(activeTask.value ? { workItemId: activeTask.value } : {}),
  }))
  const filesEnabled = computed(() => ctx.readsOpen.value && verifiedTask.value !== undefined)
  const attachments = useArchiveAttachments(ctx.source, filters, filesEnabled)
  // Yükleme seçicisi: dosyasız görevler de (`include_empty=true`, BE-121); ayrı okuma.
  const uploadSource = useArchiveUploadTasks(ctx.source, ctx.readsOpen)
  const query = attachments.query

  const filesLoading = computed(
    () =>
      verifiedTask.value === undefined ||
      (query.isPending.value && filesEnabled.value) ||
      query.isFetchingNextPage.value,
  )

  return {
    ctx,
    ...scope,
    folder,
    treeFolders,
    attachments,
    total: attachments.total,
    titles: computed(() => taskTitles(taskList.value)),
    uploads: computed(() => uploadTasks(uploadSource.data.value?.tasks)),
    filesLoading,
    filesError: computed(() => query.isError.value && filesEnabled.value),
    /** Dosya sayfaları yerleşti (hata yok, uçuşta istek yok). */
    filesSettled: computed(
      () => filesEnabled.value && query.isSuccess.value && !query.isFetching.value,
    ),
  }
}
