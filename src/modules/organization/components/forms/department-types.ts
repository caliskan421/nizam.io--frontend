// Koordinatörlük formu parçalarının ortak tipleri (W74).
import type { MutationOutcome } from '@/shared/http/mutation'

import type { useProgramDepartmentIndex } from '../../api'
import type { useFormDialog } from './form-kit'
import type { useToast } from '@/shared/ui'

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
  /**
   * Alan hatasına eşlenmeyen sonuç: "sonuç bilinmiyor" yerinde (`resume`: "Yeniden gönder"
   * çözülünce akışın devamı), diğerleri ortak bildirim.
   */
  report: (outcome: AnyOutcome, resume?: (outcome: AnyOutcome) => void) => void
  clearNotice: () => void
  /** `UiOutcomeNotice` `resolved`: bekleyen devam çalışır (yoksa yalnız bildirim kapanır). */
  resolved: (outcome: AnyOutcome) => void
  /** Kurulumda alınmış bildirim (sahip yaşamını bilir; CX-F1-Ö-07, W82c). */
  toast: ReturnType<typeof useToast>
}

/** "Mevcut departmanı ekle" hedefi (kısmi başarı ya da `department_exists` eşleşmesi). */
export interface LinkTarget {
  departmentId: string
  name: string
}

export type ExistsState =
  | { kind: 'found'; target: LinkTarget }
  | { kind: 'linked'; name: string }
  | { kind: 'deleted'; name: string }
