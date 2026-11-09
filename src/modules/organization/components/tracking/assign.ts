/**
 * 05b kişinin seçili programdaki birimleri (E-05-44 alt satır, E-05-48 "Görev ata" hedefi).
 * Kaynak yalnız `memberships` etiketleri (seçili program, P13) ⋈ `listProgramDepartments`
 * (`display_name`, G13); çözülemeyen kimlik gösterilmez (E-05-20 kalıbı).
 *
 * "Görev ata" (P15): hedef koordinatörlük AÇIK seçilir — kişinin birimleri; tekse doğrudan.
 * Görev formu work modülünün `NewTaskDialog`'udur ve modül sınırı gereği yalnız kendi girişinden
 * açılır: `/gorevler?yeni=1&koordinatorluk=<birim>&atanan=<hesap>` (`TASKS_NEW_TASK_QUERY`).
 */
import { TASKS_NEW_TASK_QUERY, TASKS_ROUTE } from '@/modules/work/public'

import { programMemberships } from '../../model/memberships'
import type { KnownUser, ProgramDepartment } from '../../model/types'

export interface PersonUnit {
  departmentId: string
  name: string
  code: string | null
}

const collator = new Intl.Collator('tr-TR', { sensitivity: 'base' })

/** Seçili programdaki birimler (ad sırasıyla, tekil); kişi bilinmiyorsa `null`. */
export function personUnits(
  user: Pick<KnownUser, 'memberships'> | null,
  programId: string | null,
  departments: ReadonlyMap<string, Pick<ProgramDepartment, 'display_name' | 'code'>>,
): PersonUnit[] | null {
  if (user === null) return null
  const seen = new Map<string, PersonUnit>()
  for (const label of programMemberships(user, programId)) {
    const department = departments.get(label.departmentId)
    if (!department || seen.has(label.departmentId)) continue
    seen.set(label.departmentId, {
      departmentId: label.departmentId,
      name: department.display_name,
      code: department.code ?? null,
    })
  }
  return [...seen.values()].sort((a, b) => collator.compare(a.name, b.name))
}

/** Görevler ekranındaki yeni görev girişi: hedef birim ön seçili, atanan = bu kişi (E-05-48). */
export function newTaskLocation(departmentId: string, accountId: string) {
  return {
    name: TASKS_ROUTE.name,
    query: { ...TASKS_NEW_TASK_QUERY, koordinatorluk: departmentId, atanan: accountId },
  }
}

/** Görev bağlantısı (E-05-62/67 → 03 paneli). */
export function taskLocation(workItemId: string) {
  return { name: TASKS_ROUTE.name, query: { gorev: workItemId } }
}
