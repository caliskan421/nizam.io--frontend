/**
 * Görev klasörü yardımcıları: görev adı sözlüğü (`archiveTasks`; dosya kartında görev adı,
 * E-06-52) ve yükleme penceresi görev satırları (P35: arşivde görünen görevler).
 */
import type { ArchiveTask, UploadTask } from './types'

/** `work_item_id` → görev adı. */
export function taskTitles(tasks: readonly ArchiveTask[] | undefined): Record<string, string> {
  return Object.fromEntries((tasks ?? []).map((t) => [t.work_item_id, t.title]))
}

const collator = new Intl.Collator('tr-TR', { sensitivity: 'base' })

/**
 * Yükleme penceresi satırları (`include_empty=true` görev seçenekleri, BE-121): isteğin S3
 * başlığı = SEÇENEĞİN `department_id`'sidir (RECORDS-K39; yönetici için rotadaki klasör değil).
 * Ada göre sıralı; sunucunun "dosyalılar önce" sırası seçicide korunmaz (ad sırası).
 */
export function uploadTasks(tasks: readonly ArchiveTask[] | undefined): UploadTask[] {
  return [...(tasks ?? [])]
    .sort((a, b) => collator.compare(a.title, b.title))
    .map((t) => ({ workItemId: t.work_item_id, title: t.title, departmentId: t.department_id }))
}
