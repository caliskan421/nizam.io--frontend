/**
 * 08 kart ızgarasının veri birleşimi (08 `backend.md` ana karar, §4): şirket yöneticisinde
 * `listProgramDepartments.departments[]` ⋈ `reportDashboard.coordinatorship_stats[]`
 * (`department_id`). Birim başına istek yok (K3). Ad her yerde programdaki ad
 * (`display_name`, G13); raporda olmayan birim (yarış) için `stat: null` → sayılar "—".
 * Sıra: ad, `tr` yerel ayarı (E-08-16; sunucu sırası bayt sırasıdır).
 */
import type { CoordinatorshipStat, CoordinatorshipView, ProgramDepartment } from './types'

const collator = new Intl.Collator('tr-TR', { sensitivity: 'base' })

export function joinCoordinatorships(
  departments: readonly ProgramDepartment[],
  stats: readonly CoordinatorshipStat[] | null | undefined,
): CoordinatorshipView[] {
  const byId = new Map((stats ?? []).map((s) => [s.department_id, s]))
  return departments
    .map((d) => ({
      departmentId: d.department_id,
      displayName: d.display_name,
      code: d.code ?? null,
      stat: byId.get(d.department_id) ?? null,
    }))
    .sort((a, b) => collator.compare(a.displayName, b.displayName))
}

/** Tek birim (08b başlığı, E-08-52): listede yoksa `null` → "seçili programda yok". */
export function findCoordinatorship(
  views: readonly CoordinatorshipView[],
  departmentId: string,
): CoordinatorshipView | null {
  return views.find((v) => v.departmentId === departmentId) ?? null
}
