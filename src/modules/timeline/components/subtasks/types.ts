/** W96 yardımcı bileşenlerinin prop/emit tipleri (yalnız `subtasks/` içinde; `../index.ts` sabit). */
import type { SubtaskRowsProps } from '../index'

/** Açma düğmesi: `SubtaskRows` ile aynı kaynak + erişim adı için kod/başlık. */
export interface SubtaskToggleProps extends SubtaskRowsProps {
  /** Erişim adında geçen görev kodu (yoksa başlık). */
  label: string
}
export interface SubtaskToggleEmits {
  toggle: []
}
