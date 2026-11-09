// Koordinatörlük formu parçalarının ortak tipleri (W74).
import type { MutationOutcome } from '@/shared/http/mutation'

import type { useProgramDepartmentIndex } from '../../api'
import type { useFormDialog } from './form-kit'

export type AnyOutcome = MutationOutcome<unknown, unknown, unknown>

export interface DepartmentFormHooks {
  open: () => boolean
  departmentId: () => string | null | undefined
  saved: (departmentId: string) => void
  close: () => void
}

export interface DepartmentFormContext {
  hooks: DepartmentFormHooks
  dialog: ReturnType<typeof useFormDialog>
  index: ReturnType<typeof useProgramDepartmentIndex>
  /** Başarı: bildirim + `saved` + kapanış. */
  done: (message: string, departmentId: string) => void
  /** Alan hatasına eşlenmeyen sonuç: "sonuç bilinmiyor" yerinde, diğerleri ortak bildirim. */
  report: (outcome: AnyOutcome) => void
  clearNotice: () => void
}

/** "Mevcut departmanı ekle" hedefi (kısmi başarı ya da `department_exists` eşleşmesi). */
export interface LinkTarget {
  departmentId: string
  name: string
}

export type ExistsState =
  | { kind: 'searching' }
  | { kind: 'found'; target: LinkTarget }
  | { kind: 'linked'; name: string }
  | { kind: 'deleted'; name: string }
  | { kind: 'not_found' }
