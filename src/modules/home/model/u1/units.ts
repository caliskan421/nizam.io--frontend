/**
 * Ü1 birim satırı kaynağı (E-Ü1-21/31; BE-141): `myDepartments` satırından seçili programın
 * birimleri — görünen ad, birim kodu (`department_code`; null olabilir) ve koordinatör adları
 * (`coordinators[].full_name`; ad null olabilir → o kişi atlanır, ad/e-posta uydurulmaz).
 */
import { homeText } from '../messages'

/** `MyDepartment` şemasından okunan alanlar (yalnız yapı). */
export interface MyUnitSource {
  program_id: string
  department_id: string
  display_name: string
  department_code: string | null
  coordinators?: readonly { account_id?: string; full_name: string | null }[] | null
}

export interface MyUnit {
  departmentId: string
  displayName: string
  code: string | null
  /** Adı bilinen koordinatörler (sunucu sırası); yoksa boş. */
  coordinators: string[]
  /** "Koordinatörüme yaz" hedefi: sunucu sırasındaki ilk koordinatörün hesabı; yoksa `null`. */
  coordinatorId: string | null
}

export function myUnits(rows: readonly MyUnitSource[], programId: string | null): MyUnit[] {
  const seen = new Map<string, MyUnit>()
  for (const row of rows) {
    if (row.program_id !== programId || seen.has(row.department_id)) continue
    seen.set(row.department_id, {
      departmentId: row.department_id,
      displayName: row.display_name,
      code: row.department_code?.trim() || null,
      coordinators: (row.coordinators ?? [])
        .map((c) => c.full_name?.trim() ?? '')
        .filter((name) => name !== ''),
      coordinatorId: row.coordinators?.find((c) => !!c.account_id)?.account_id ?? null,
    })
  }
  return [...seen.values()]
}

/** "Koordinatör: ‹ad›" ya da "Koordinatörler: ‹ad, ad›"; ad yoksa `null` (satır gizli). */
export function coordinatorText(unit: Pick<MyUnit, 'coordinators'>): string | null {
  if (unit.coordinators.length === 0) return null
  return homeText(
    unit.coordinators.length === 1 ? 'home.u1.depts.coordinator' : 'home.u1.depts.coordinators',
    { name: unit.coordinators.join(', ') },
  )
}

/** "Koordinatörüme yaz" alt satırı: "‹ad› · ‹birim›"; koordinatör adı yoksa `null`. */
export function messageLine(
  unit: Pick<MyUnit, 'coordinators' | 'displayName'> | null,
): string | null {
  if (!unit || unit.coordinators.length === 0) return null
  return `${unit.coordinators.join(', ')} · ${unit.displayName}`
}
