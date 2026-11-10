/** W96 yardımcı bileşenlerinin prop/emit tipleri (yalnız `subtasks/` içinde; `../index.ts` sabit). */
import type { SubtaskRowsProps } from '../index'

/** Açma düğmesi: `SubtaskRows` ile aynı kaynak + erişim adı için kod/başlık. */
export interface SubtaskToggleProps extends SubtaskRowsProps {
  /** Erişim adında geçen görev kodu (yoksa başlık). */
  label: string
  /**
   * Gantt satırının `subtask_counts` değeri (BE-051): kapalı satırda da sayaç buradan gelir,
   * açıldığında liste okumasının sayacı onun yerini alır (aynı değer, canlı).
   */
  rowCounts?: { done: number; total: number } | null
}
export interface SubtaskToggleEmits {
  toggle: []
}
