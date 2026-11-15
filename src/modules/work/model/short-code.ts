/** Kod taşıyan görev şekli (`WorkItem`, `GanttTask`; WORK-K97). */
export interface ShortCodeSource {
  code: string | null
  sequence_no: number | null
}

/**
 * Görev kısa kodu (E-03-20): sunucunun `code` alanı (`<DEPARTMAN-KODU>-<sıra>`). Departmanın
 * kodu yoksa `code` null gelir; sözleşme gereği istemci `#<sequence_no>` gösterir. Sıra da yoksa
 * boş dize (kod uydurulmaz).
 */
export function workShortCode(task: ShortCodeSource | null | undefined): string {
  if (!task) return ''
  if (task.code) return task.code
  return task.sequence_no === null || task.sequence_no === undefined ? '' : `#${task.sequence_no}`
}
