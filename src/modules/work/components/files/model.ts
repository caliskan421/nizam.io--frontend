/**
 * Dosyalar bileşenlerinin saf yardımcıları (W46; E-03-35, E-03-50, E-03-52, E-03-61).
 *
 *  - Etiket seçici kapalı kümeden (`FILE_TAGS`, P5): varsayılan etiket yoktur, seçim zorunlu.
 *  - "Kanıt" ayrı işaret değildir (backend.md §4): herhangi dosya kanıta sayılır; panelde son
 *    dosyanın adı ya da "Yok". Yükleme zamanı alanı yoktur: "son" = sunucu sırasındaki son öğe.
 *  - Alt görev yuvası (E-03-35) `subtask_id` eşleşen dosyalardan.
 */
import type { UiSelectOption } from '@/shared/ui'

import { FILE_TAGS, type FileTag, type WorkItemFile } from '../../model/types'
import { filesText } from './messages'

/** Kapalı küme denetimi (sunucu `tag` alanı listede düz `string`'dir). */
export function isFileTag(value: string): value is FileTag {
  return (FILE_TAGS as readonly string[]).includes(value)
}

/** Etiketin görünen adı; küme dışı değer (yeni etiket) olduğu gibi gösterilir. */
export function tagLabel(tag: string): string {
  return isFileTag(tag) ? filesText(`workFiles.tag.${tag}`) : tag
}

/** Etiket seçici seçenekleri (sözleşme sırası). */
export function tagOptions(): UiSelectOption[] {
  return FILE_TAGS.map((tag) => ({ value: tag, label: tagLabel(tag) }))
}

const UNITS = ['b', 'kb', 'mb', 'gb'] as const
const STEP = 1024
const sizeFormat = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })

/** Bayt → "12 KB" (1024 tabanı, en çok bir ondalık, `tr` biçimi). */
export function formatFileSize(bytes: number): string {
  let value = Math.max(0, bytes)
  let unit = 0
  while (value >= STEP && unit < UNITS.length - 1) {
    value /= STEP
    unit += 1
  }
  const n = unit === 0 ? String(Math.round(value)) : sizeFormat.format(value)
  return filesText(`workFiles.size.${UNITS[unit]!}`, { n })
}

/** Yükleyenin adı; `null` → "Bilinmeyen kişi" (G4). */
export function uploaderName(file: Pick<WorkItemFile, 'uploaded_by_full_name'>): string {
  return file.uploaded_by_full_name ?? filesText('workFiles.unknownPerson')
}

/** Bir alt göreve bağlı dosyalar (sunucu sırası korunur). */
export function filesOfSubtask(files: readonly WorkItemFile[], subtaskId: string): WorkItemFile[] {
  return files.filter((file) => file.subtask_id === subtaskId)
}

/** E-03-50: son dosyanın adı; dosya yoksa `null` (çağıran "Yok" yazar). */
export function evidenceFileName(files: readonly WorkItemFile[]): string | null {
  return files.length > 0 ? files[files.length - 1]!.display_name : null
}

/**
 * Alt görev yuvasının etiketi (E-03-35): son bağlı dosyanın adı, birden çoksa "+n";
 * dosya yoksa `null` (çağıran "Kanıt yükle" / "Kanıt yok" yazar).
 */
export function slotLabel(files: readonly WorkItemFile[]): string | null {
  const name = evidenceFileName(files)
  if (name === null) return null
  if (files.length === 1) return name
  return filesText('workFiles.slot.more', { name, n: files.length - 1 })
}

/** Dosya adı taslağı: kırpılmış; boşsa `null`. */
export function normalizedName(draft: string): string | null {
  const name = draft.trim()
  return name.length > 0 ? name : null
}
