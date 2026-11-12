/**
 * 06 `sirala` URL değeri (`<alan>:<yön>`; rota kataloğu `sortBy(['ad', 'dosya'])`). Yalnız sunucunun
 * verdiği alanlar sıralanır: "Son yükleme" için alan yok (BE-025) → değer ve seçenek yoktur.
 * Varsayılan (ada göre artan) URL'ye yazılmaz.
 */
import type { FolderSortDirection, FolderSortField } from '../../model/types'

export interface FolderSort {
  field: FolderSortField
  direction: FolderSortDirection
}

export const DEFAULT_FOLDER_SORT: FolderSort = { field: 'ad', direction: 'artan' }

/** Menü seçenekleri (görünüm sırası); anahtar i18n `archive.folders.sort.*` ile eşleşir. */
export const FOLDER_SORT_OPTIONS = [
  { key: 'adArtan', field: 'ad', direction: 'artan' },
  { key: 'adAzalan', field: 'ad', direction: 'azalan' },
  { key: 'dosyaAzalan', field: 'dosya', direction: 'azalan' },
  { key: 'dosyaArtan', field: 'dosya', direction: 'artan' },
] as const satisfies readonly (FolderSort & { key: string })[]

export type FolderSortKey = (typeof FOLDER_SORT_OPTIONS)[number]['key']

export function sortKey(sort: FolderSort): FolderSortKey {
  return (
    FOLDER_SORT_OPTIONS.find((o) => o.field === sort.field && o.direction === sort.direction)
      ?.key ?? 'adArtan'
  )
}

export function parseFolderSort(raw: unknown): FolderSort {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string') return DEFAULT_FOLDER_SORT
  const match = FOLDER_SORT_OPTIONS.find((o) => `${o.field}:${o.direction}` === value)
  return match ? { field: match.field, direction: match.direction } : DEFAULT_FOLDER_SORT
}

/** URL değeri; varsayılan sıra için `undefined` (parametre kaldırılır). */
export function formatFolderSort(sort: FolderSort): string | undefined {
  return sort.field === DEFAULT_FOLDER_SORT.field &&
    sort.direction === DEFAULT_FOLDER_SORT.direction
    ? undefined
    : `${sort.field}:${sort.direction}`
}
