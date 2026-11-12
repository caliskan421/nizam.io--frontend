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

/** Seçili dosyanın 1 tabanlı konumu ("‹i› / ‹N›"); listede yoksa `0`. */
export function filePosition(files: readonly { file_id: string }[], fileId: string | null): number {
  if (fileId === null) return 0
  const index = files.findIndex((f) => f.file_id === fileId)
  return index === -1 ? 0 : index + 1
}

/**
 * Önceki/sonraki dosya (yüklenmiş + süzülmüş liste üzerinde). Listenin sonunda `null`: devam
 * varsa (`hasMore`) çağıran önce bir sayfa daha yükler (mekanizma §5), yoksa düğme devre dışıdır.
 */
export function adjacentFile<T extends { file_id: string }>(
  files: readonly T[],
  fileId: string | null,
  direction: 'previous' | 'next',
): T | null {
  const position = filePosition(files, fileId)
  if (position === 0) return null
  return files[direction === 'next' ? position : position - 2] ?? null
}
