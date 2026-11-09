/**
 * "Yeni görev" girişi ve sonucu (E-03-06 → E-03-57; W48 entegrasyon).
 *
 *  - `?yeni=1` (01 ana sayfa hızlı işlemi, katalog `work.tasks.query.yeni`): yetki olguları
 *    (standing) gelince BİR kez okunur; `canCreateWorkItem` ise form açılır, değilse yok sayılır.
 *    Parametre her iki durumda `replace` ile düşer: geri tuşu formu yeniden açmaz.
 *  - Kapsam değişince açık form kapanır (çağıran `close`): eski kapsamın seçimiyle gönderim yok.
 *  - `created`: yeni görev panelde YALNIZ şu anki listenin kapsamındaysa açılır (aynı program,
 *    liste `department_id`'si yoksa ya da eşitse). Aksi hâlde panel hedefi çözülemez ("kapsam
 *    bilinmiyor" / yanlış birimle 404); görev oluşturuldu bildirimi formdan gelir.
 */
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { useScopeStore } from '@/shared/scope/store'

import type { WorkItem } from '../../model/types'
import { newTaskRequested } from './url-state'

export interface NewTaskEntryDeps {
  /** Yetki olguları yüklendi mi (standing). */
  ready: () => boolean
  canCreate: () => boolean
  /** Listenin `department_id`'si (`listDepartmentFilter`); `null` = programın tamamı. */
  listDepartment: () => string | null
  /** URL'yi yeniden yazar (bilinmeyen/`yeni` anahtarı düşer; `replace`). */
  normalizeUrl: () => void
  open: (workItemId: string) => void
}

export function useNewTaskEntry(deps: NewTaskEntryDeps) {
  const route = useRoute()
  const store = useScopeStore()
  const creating = ref(false)

  watch(
    () => [newTaskRequested(route.query), deps.ready()] as const,
    ([requested, ready]) => {
      if (!requested || !ready) return
      if (deps.canCreate()) creating.value = true
      deps.normalizeUrl()
    },
    { immediate: true },
  )

  function inListScope(item: WorkItem): boolean {
    const department = deps.listDepartment()
    return (
      item.program_id === store.programId &&
      (department === null || item.department_id === department)
    )
  }

  function created(item: WorkItem): void {
    if (inListScope(item)) deps.open(item.work_item_id)
  }

  function close(): void {
    creating.value = false
  }

  return { creating, created, close }
}
