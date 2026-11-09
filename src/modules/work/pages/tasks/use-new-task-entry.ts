/**
 * "Yeni görev" girişi ve sonucu (E-03-06 → E-03-57; W48 entegrasyon).
 *
 *  - `?yeni=1` (01 ana sayfa hızlı işlemi, katalog `work.tasks.query.yeni`): yetki olguları
 *    (standing) gelince BİR kez okunur; `canCreateWorkItem` ise form açılır, değilse yok sayılır.
 *    Parametre her iki durumda `replace` ile düşer: geri tuşu formu yeniden açmaz.
 *  - Hedef ve atanan ön değeri (W76): aynı anda gelen `koordinatorluk` formun hedefi olur —
 *    yalnız çağıranın o birimde görev açma yetkisi varsa (form seçenekleri `canManageWorkItem`,
 *    mercekten bağımsız — P1); liste süzgecini/merceği değiştirmez. `atanan` formda ekip üyesiyse ön dolar. İkisi de
 *    `NEW_TASK_PRESET` ile forma verilir; `atanan` URL'den `yeni` ile birlikte düşer.
 *  - Kapsam değişince açık form kapanır (çağıran `close`): eski kapsamın seçimiyle gönderim yok.
 *  - `created`: yeni görev panelde YALNIZ şu anki listenin kapsamındaysa açılır (aynı program,
 *    liste `department_id`'si yoksa ya da eşitse). Aksi hâlde panel hedefi çözülemez ("kapsam
 *    bilinmiyor" / yanlış birimle 404); görev oluşturuldu bildirimi formdan gelir.
 */
import { provide, readonly, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'

import { useScopeStore } from '@/shared/scope/store'

import { NEW_TASK_PRESET, type NewTaskPreset } from '../../components/forms/new-task-preset'
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

const ID_VALUE = /^[A-Za-z0-9_-]{1,128}$/

function idParam(raw: unknown): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' && ID_VALUE.test(value) ? value : null
}

export function useNewTaskEntry(deps: NewTaskEntryDeps) {
  const route = useRoute()
  const store = useScopeStore()
  const creating = ref(false)
  const preset = shallowRef<NewTaskPreset | null>(null)
  provide(NEW_TASK_PRESET, readonly(preset))

  /** URL ön değerleri (biçim denetimi); yetki denetimi formda (`useTaskDepartments`, s.139). */
  function presetFrom(query: Readonly<Record<string, unknown>>): NewTaskPreset | null {
    const departmentId = idParam(query.koordinatorluk)
    const assignee = idParam(query.atanan)
    return departmentId === null && assignee === null ? null : { departmentId, assignee }
  }

  watch(
    () => [newTaskRequested(route.query), deps.ready()] as const,
    ([requested, ready]) => {
      if (!requested || !ready) return
      if (deps.canCreate()) {
        preset.value = presetFrom(route.query)
        creating.value = true
      }
      deps.normalizeUrl()
    },
    { immediate: true },
  )
  // Form kapanınca ön değer düşer: sonraki "Yeni görev" açılışı normaldir.
  watch(creating, (open) => {
    if (!open) preset.value = null
  })

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
    preset.value = null
  }

  return { creating, created, close }
}
