import type { IconName } from './icons'

/** `UiSelect` seçeneği. */
export interface UiSelectOption {
  value: string
  label: string
  disabled?: boolean
}

/** `UiSegmented` / `UiTabs` seçeneği: görünür etiket, isteğe bağlı simge ve sayaç (`rp-count`). */
export interface UiChoiceOption<V extends string = string> {
  value: V
  label: string
  icon?: IconName
  count?: string | number
  disabled?: boolean
}
