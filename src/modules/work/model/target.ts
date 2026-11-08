/**
 * Kapsam hedefleri (istemci-akislari §2; K3; `03-gorevler-liste/backend.md` "S3").
 *
 *  - Tek göreve ait her istek GÖREVİN KENDİ `program_id` / `department_id`'siyle gider
 *    (`targetOf`); seçili mercek/birim değil. Yönetici merceğinde (departmansız kapsam) de
 *    ayrıntı, alt görev, dosya, not uçları böyle çalışır.
 *  - Liste tek uçtan (`listProgramWorkItems`, S2) ve tek `department_id` ile okunur (K3,
 *    fan-out yok): Admin merceğinde süzgeçteki koordinatörlük (yoksa hepsi), Koordinatör/Üye
 *    merceğinde seçili birim (`listDepartmentFilter`).
 */
import type { ScopeSnapshot } from '@/shared/scope/scope'

import type { WorkItem, WorkTarget } from './types'

/** Görevin kendi kapsamı. */
export function targetOf(item: Pick<WorkItem, 'program_id' | 'department_id'>): WorkTarget {
  return { programId: item.program_id, departmentId: item.department_id }
}

/** Seçili programda bir departman hedefi (yeni görev); program seçili değilse `null`. */
export function departmentTarget(
  scope: ScopeSnapshot,
  departmentId: string | null,
): WorkTarget | null {
  if (!scope.programId || !departmentId) return null
  return { programId: scope.programId, departmentId }
}

/**
 * Listenin `department_id` değeri: Admin merceğinde koordinatörlük süzgeci (E-03-12, tek seçim;
 * yoksa `null` = programın tamamı), Koordinatör/Üye merceğinde seçili birim (süzgeç gizli).
 */
export function listDepartmentFilter(
  scope: ScopeSnapshot,
  selectedDepartmentId: string | null,
): string | null {
  if (scope.lens === 'admin') return selectedDepartmentId
  return scope.departmentId
}

/**
 * Yalnız görev kimliği bilinirken (ör. derin bağlantı `?gorev=`) hedef: önce yüklenmiş liste
 * satırları (görevin kendi kapsamı), yoksa Koordinatör/Üye merceğinde seçili birim. Yönetici
 * merceğinde liste dışı görevin departmanı bilinmez → `null` (istek atılmaz; çağıran listeyi
 * yükler ya da paneli kapatır).
 */
export function resolveTarget(
  workItemId: string,
  scope: ScopeSnapshot,
  listed: Iterable<Pick<WorkItem, 'work_item_id' | 'program_id' | 'department_id'>>,
): WorkTarget | null {
  for (const item of listed) {
    if (item.work_item_id === workItemId && item.program_id === scope.programId) {
      return targetOf(item)
    }
  }
  if (scope.lens !== 'admin' && scope.programId && scope.departmentId) {
    return { programId: scope.programId, departmentId: scope.departmentId }
  }
  return null
}
