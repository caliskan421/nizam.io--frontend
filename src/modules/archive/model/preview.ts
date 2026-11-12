/** Önizleme yan okumaları: yükleyen adı (`listWorkItemFiles`) ve alt görev adı (`listWorkItemSubtasks`). */
import type { PreviewFileInfo, PreviewSubtask } from './types'

/** Yükleyen görünen adı; satır yok ya da `null` (kimlikten ad uydurulmaz) → `null` (nötr gösterim). */
export function uploaderName(
  files: readonly PreviewFileInfo[] | undefined,
  fileId: string,
): string | null {
  return files?.find((f) => f.file_id === fileId)?.uploaded_by_full_name ?? null
}

/** Alt görev başlığı; liste yok/eşleşme yok → `null` (ızgarada adsız "alt görev" etiketi). */
export function subtaskTitle(
  subtasks: readonly PreviewSubtask[] | undefined,
  subtaskId: string | undefined,
): string | null {
  if (!subtaskId) return null
  return subtasks?.find((s) => s.subtask_id === subtaskId)?.title ?? null
}
