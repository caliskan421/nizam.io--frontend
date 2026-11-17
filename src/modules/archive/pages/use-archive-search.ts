/**
 * 06 yönetici araması (BE-072; E-06-06/26): program geneli `programArchiveAttachments` (dosya
 * adı + görev başlığı + yükleyen adı, `search_scope=all`; `department_id` yok). Süzgeç (metin ya da tür) doluyken sonuç listesi
 * klasör ızgarasının yerine geçer; bir sonuç dosyanın klasörünü ve önizlemesini açar
 * (`/arsiv/<satırın department_id'si>?dosya&gorev`). Görev adları program geneli görev
 * seçeneklerinden (yalnız arama etkinken okunur).
 */
import { computed, type Ref } from 'vue'
import { useRouter } from 'vue-router'

import type { ArchiveContext } from '../model/context'
import type { ArchiveFileFilters, ArchiveKind } from '../model/types'
import { taskTitles } from '../model/tasks'
import { useArchiveAttachments, useArchiveTasks } from '../api/queries'
import { ARCHIVE_FOLDER_ROUTE } from '../routes'

export function useArchiveSearch(
  context: ArchiveContext,
  input: { q: Ref<string>; kind: Ref<ArchiveKind>; adminGrid: Ref<boolean> },
) {
  const router = useRouter()
  const { q, kind, adminGrid } = input
  const searching = computed(
    () => adminGrid.value && (q.value.trim() !== '' || kind.value !== 'tumu'),
  )
  const filters = computed<ArchiveFileFilters>(() => ({
    ...(q.value.trim() ? { search: q.value.trim() } : {}),
    ...(kind.value !== 'tumu' ? { kind: kind.value } : {}),
  }))
  const results = useArchiveAttachments(context.source, filters, searching)
  const tasks = useArchiveTasks(context.source, searching)
  const titles = computed(() => taskTitles(tasks.data.value?.tasks))
  function openResult(fileId: string): void {
    const file = results.files.value.find((f) => f.file_id === fileId)
    if (!file) return
    void router.push({
      name: ARCHIVE_FOLDER_ROUTE.name,
      params: { klasorId: file.department_id },
      query: { dosya: file.file_id, gorev: file.work_item_id },
    })
  }
  return { searching, results, titles, openResult }
}
