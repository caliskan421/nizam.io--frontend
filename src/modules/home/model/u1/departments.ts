/**
 * Ü1 "Koordinatörlüklerim" (E-Ü1-30…32): `myDepartments` üyelik satırları + AYNI yükleme
 * kümesinin `department_id` kırılımı (tek istek; fan-out değil). "‹n› görev" = o birimdeki açık
 * görevlerim; dilimler başlamadı/devam/onayda/iade. Koordinatör adı ve birim kodu `myDepartments` satırından (BE-141).
 */
import { collator, isOpen, type WorkRow } from '../role/common'
import { coordinatorText } from './units'

export interface UnitRow {
  departmentId: string
  name: string
  /** Birim kodu (`MyDepartment.department_code`); yoksa ad kısaltması çağıranda (BE-141). */
  code: string | null
  /** "Koordinatör: ‹ad›" satırı; ad yoksa `null` (gizli). */
  coordinator: string | null
  open: number
  overdue: number
  doing: number
  review: number
  back: number
  notStarted: number
}

export function unitBreakdown(
  units: readonly {
    departmentId: string
    displayName: string
    code?: string | null
    coordinators?: string[]
  }[],
  items: readonly WorkRow[],
): UnitRow[] {
  const open = items.filter(isOpen)
  return units
    .map((unit) => {
      const mine = open.filter((i) => i.department_id === unit.departmentId)
      const row: UnitRow = {
        departmentId: unit.departmentId,
        name: unit.displayName,
        code: unit.code ?? null,
        coordinator: coordinatorText({ coordinators: unit.coordinators ?? [] }),
        open: mine.length,
        overdue: mine.filter((i) => i.is_overdue).length,
        doing: 0,
        review: 0,
        back: 0,
        notStarted: 0,
      }
      for (const item of mine) {
        if (item.status === 'baslanmadi') row.notStarted += 1
        else if (item.status === 'devam_ediyor') row.doing += 1
        else if (item.status === 'onaya_sunuldu') row.review += 1
        else row.back += 1
      }
      return row
    })
    .sort((a, b) => b.open - a.open || collator.compare(a.name, b.name))
}

/** Durum çubuğu dilim genişlikleri (yüzde; açık görev yoksa hepsi 0). */
export function unitWidths(row: UnitRow): Record<'todo' | 'doing' | 'review' | 'back', number> {
  const share = (n: number) => (row.open === 0 ? 0 : (n / row.open) * 100)
  return {
    todo: share(row.notStarted),
    doing: share(row.doing),
    review: share(row.review),
    back: share(row.back),
  }
}
