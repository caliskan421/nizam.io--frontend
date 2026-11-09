/**
 * Gantt yüzü türetmesi (K4; 03c kabul "satır dışı varsayımlar" 1): yüz KAPSAM MERCEĞİNDEN gelir —
 * Admin merceği `adminGantt`, Koordinatör `coordinatorGantt`, Üye `memberGantt`. Birleşik rolde
 * (yönetici + koordinatör) Koordinatör merceği koordinatör yüzünü okur; yönetici yetkisi yüzden
 * bağımsız `capabilities.ts`'te korunur (P1). Görünür yüz seçici yoktur.
 *
 * Kapsam eksikse (mercek ya da — Koordinatör/Üye yüzünde — departman yok) yüz `null`: okuyucu
 * istek atmaz (S3 uçlarda departman başlığı zorunlu).
 */
import type { ScopeSnapshot } from '@/shared/scope/scope'

import type { GanttFace, GanttTarget } from './types'

export function ganttFace(scope: ScopeSnapshot): GanttFace | null {
  if (scope.programId === null || !scope.lens) return null
  if (scope.lens === 'admin') return 'admin'
  if (scope.departmentId === null) return null
  return scope.lens === 'coordinator' ? 'coordinator' : 'member'
}

/** Yüzün Gantt ucuna gidecek kapsam (Admin yüzünde departman yok). */
export function ganttTarget(scope: ScopeSnapshot): GanttTarget | null {
  const face = ganttFace(scope)
  if (face === null || scope.programId === null) return null
  return { programId: scope.programId, departmentId: face === 'admin' ? null : scope.departmentId }
}
