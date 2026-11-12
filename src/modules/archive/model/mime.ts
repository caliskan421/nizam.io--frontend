/**
 * Dosya türü sözlüğü: `tur` segmenti → `mime_category` (E-06-07) ve `content_type` → tür rozeti
 * (E-06-42/51). PDF ayrı kategori değildir (`belge` içindedir) ve ayrı gönderilmez; bilinmeyen
 * `content_type` nötr rozet alır. Önizleme yalnız raster görsellerde (denetimsiz HTML/SVG yok).
 */
import type { ArchiveKind, ArchiveMimeCategory } from './types'

export const ARCHIVE_KINDS: readonly ArchiveKind[] = ['tumu', 'gorsel', 'belge']

const KIND_CATEGORY: Readonly<Record<ArchiveKind, ArchiveMimeCategory | null>> = {
  tumu: null,
  gorsel: 'gorsel',
  belge: 'belge',
}

/** Segmentin `mime_category` değeri; "Tümü" süzgeçsizdir (`null`). */
export function mimeCategoryOf(kind: ArchiveKind | undefined): ArchiveMimeCategory | null {
  return kind === undefined ? null : KIND_CATEGORY[kind]
}

export function isArchiveKind(value: unknown): value is ArchiveKind {
  return typeof value === 'string' && (ARCHIVE_KINDS as readonly string[]).includes(value)
}

export type TypeBadge = 'IMG' | 'PDF' | 'DOC' | 'XLS' | 'PPT' | 'TXT' | 'ZIP' | 'DOSYA'

/** Rozet anahtarı → görünen kısa ad (Türkçe tür adı i18n'de `archive.type.*`). */
const BADGE_RULES: ReadonlyArray<readonly [RegExp, TypeBadge]> = [
  [/^image\//, 'IMG'],
  [/^application\/pdf$/, 'PDF'],
  [/(msword|wordprocessingml|opendocument\.text)/, 'DOC'],
  [/(ms-excel|spreadsheetml|opendocument\.spreadsheet|^text\/csv$)/, 'XLS'],
  [/(ms-powerpoint|presentationml|opendocument\.presentation)/, 'PPT'],
  [/^text\//, 'TXT'],
  [/(zip|x-tar|gzip|x-7z|x-rar)/, 'ZIP'],
]

export function typeBadge(contentType: string): TypeBadge {
  const type = contentType.toLowerCase()
  for (const [pattern, badge] of BADGE_RULES) if (pattern.test(type)) return badge
  return 'DOSYA'
}

/** Gömülü önizlemeye uygun raster görsel türleri (SVG ve diğerleri hariç). */
const PREVIEW_IMAGE_TYPES: ReadonlySet<string> = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
])

export function isPreviewableImage(contentType: string): boolean {
  return PREVIEW_IMAGE_TYPES.has(contentType.toLowerCase().split(';')[0]!.trim())
}

const UNITS = ['B', 'KB', 'MB', 'GB'] as const

/** "‹x,y› KB/MB" — ondalık virgül, bir basamak (E-06-13/51). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  const text = unit === 0 ? String(Math.round(value)) : value.toFixed(1).replace('.', ',')
  return `${text} ${UNITS[unit]}`
}

/** Gömülü önizleme için üst sınır (bellekte blob olarak tutulur). */
export const PREVIEW_MAX_BYTES = 20 * 1024 * 1024

/** Dosya önizlenebilir mi: raster görsel ve sınır içinde. Diğer türler tür rozeti alır (BE-026). */
export function canPreview(file: { content_type: string; size_bytes: number }): boolean {
  return isPreviewableImage(file.content_type) && file.size_bytes <= PREVIEW_MAX_BYTES
}
