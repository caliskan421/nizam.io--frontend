/** Önizleme yan okumaları: alt görev adı (`listWorkItemSubtasks`); yükleyen adı ve tarih liste satırındadır. */
import type { ArchiveFile, PreviewSubtask } from './types'

/**
 * Yükleyen görünen adı (`FileListItem.uploaded_by_full_name`, RECORDS-K40): satırı olmayan
 * hesapta ya da ad okuması başarısızsa `null` → nötr gösterim (kimlikten ad uydurulmaz).
 */
export function uploaderName(file: Pick<ArchiveFile, 'uploaded_by_full_name'>): string | null {
  const name = file.uploaded_by_full_name?.trim()
  return name ? name : null
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

const FALLBACK_TIME_ZONE = 'Europe/Istanbul'

function parts(at: Date, timeZone: string): Record<string, string> {
  const format = (zone: string) =>
    new Intl.DateTimeFormat('tr-TR', {
      timeZone: zone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(at)
  let list: Intl.DateTimeFormatPart[]
  try {
    list = format(timeZone)
  } catch {
    list = format(FALLBACK_TIME_ZONE)
  }
  return Object.fromEntries(list.map((part) => [part.type, part.value]))
}

/**
 * Yükleme zamanı "GG.AA.YYYY · SS:DD" (E-06-55): kurulum saat diliminde (`instanceProfile.timezone`,
 * istemcinin değil; WORK-K37). Çözümlenemeyen değer → `null` (tarih tahmin edilmez).
 */
export function formatUploadedAt(iso: string, timeZone: string | null | undefined): string | null {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return null
  const p = parts(at, timeZone ?? FALLBACK_TIME_ZONE)
  return `${p.day}.${p.month}.${p.year} · ${p.hour}:${p.minute}`
}
