/**
 * Taşıma penceresi yardımcıları (W194). Hata → alan eşlemesi `moveFile` hata listesine dayanır
 * (openapi RECORDS-K46); sunucu `message` alanı kullanılmaz. Backend sınırını (görev başına dosya
 * tavanı) istemci sayı olarak bilmez: yalnız sunucu hatasını gösterir.
 */
import type { ApiError } from '@/shared/errors/api-error'

export type MoveField = 'task' | 'subtask'

/** Hatanın gösterileceği alan; eşleşmeyen hata pencere altında genel hata olarak kalır. */
export function moveErrorField(error: Pick<ApiError, 'code' | 'fields'>): MoveField | null {
  if (error.code === 'records.too_many_files') return 'task'
  if (error.code !== 'records.input_invalid') return null
  const names = error.fields.map((f) => f.field)
  if (names.includes('subtask_id')) return 'subtask'
  if (names.includes('work_item_id')) return 'task'
  return null
}

/** Hedef görev artık seçilemiyor mu (görünmeyen/silinmiş/atanmamış): seçim sıfırlanır. */
export function targetRejected(error: Pick<ApiError, 'code' | 'fields'>): boolean {
  return error.code === 'records.input_invalid' && moveErrorField(error) === 'task'
}
