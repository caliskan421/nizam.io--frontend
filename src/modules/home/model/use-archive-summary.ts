/**
 * 01 yönetici kartlarının arşiv özeti (E-01-37/38): tek istek `programArchiveFolders` (S2, BE-072;
 * K3 fan-out yasağı gözetilir) — kart başına dosya sayısı (ve BE-025 ile son yükleme) buradan.
 * Pano ucundan bağımsızdır; okuma hatasında/yüklenirken kartlar nötr "—" gösterir (sayı uydurulmaz).
 */
import { computed } from 'vue'

import { programSource, useArchiveFolders, type ArchiveFolder } from '@/modules/archive/public'
import { useScopeStore } from '@/shared/scope/store'

export function useArchiveSummary() {
  const store = useScopeStore()
  const folders = useArchiveFolders(() =>
    store.programId === null ? null : programSource(store.programId, null),
  )
  /** Departman kimliği → klasör özeti (klasör kimliği departman kimliğidir). */
  const byDepartment = computed<ReadonlyMap<string, ArchiveFolder>>(
    () => new Map((folders.data.value?.folders ?? []).map((f) => [f.folder_id, f])),
  )
  return { byDepartment }
}
