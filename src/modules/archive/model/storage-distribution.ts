/**
 * Depolama dağılımı (E-06-23/24; BE-025): `totals.by_type` ve `totals.by_tag` dönen kartların
 * dosya kümesinin tür/etiket kırılımıdır (klasör kırılımı DEĞİL). Sunucu sırası (bayta göre azalan,
 * eşitlikte anahtar) aynen korunur; istemci yeniden sıralamaz. Yüzde BAYT oranıdır (dosya adedi
 * değil) ve her eksende aynı `totals.total_bytes` aralığına göre hesaplanır.
 */
import type { components } from '@/shared/api/schema'
import type { TokenName } from '@/shared/tokens/tokens.gen'

import { tagView } from './tags'

type Totals = components['schemas']['ArchiveFolderTotals']
export type StorageType = components['schemas']['ArchiveStorageType']['type']

export const STORAGE_TYPES: readonly StorageType[] = [
  'pdf',
  'image',
  'document',
  'spreadsheet',
  'presentation',
  'other',
]

const TYPE_TONES: Readonly<Record<StorageType, TokenName>> = {
  pdf: 'danger',
  image: 'avatar-4',
  document: 'violet',
  spreadsheet: 'accent-text',
  presentation: 'gold',
  other: 'ink-muted',
}

export interface DistributionRow {
  key: string
  /** Tür için `null`: etiket metni i18n'den (`archive.folders.storage.types.*`) çözülür. */
  label: string | null
  tone: TokenName
  fileCount: number
  bytes: number
  /** 0–100, bayt oranı; toplam 0 ise 0 (NaN/Infinity yok). */
  percent: number
}

function share(bytes: number, totalBytes: number): number {
  if (!(totalBytes > 0) || !Number.isFinite(bytes) || bytes <= 0) return 0
  return Math.min(100, (bytes / totalBytes) * 100)
}

export function typeRows(
  rows: Totals['by_type'] | undefined,
  totalBytes: number | null,
): DistributionRow[] | null {
  if (rows === undefined || totalBytes === null) return null
  return rows.map((row) => ({
    key: row.type,
    label: null,
    tone: TYPE_TONES[row.type] ?? 'ink-muted',
    fileCount: row.file_count,
    bytes: row.total_bytes,
    percent: share(row.total_bytes, totalBytes),
  }))
}

export function tagRows(
  rows: Totals['by_tag'] | undefined,
  totalBytes: number | null,
): DistributionRow[] | null {
  if (rows === undefined || totalBytes === null) return null
  return rows.map((row) => {
    const view = tagView(row.tag)
    return {
      key: row.tag,
      label: view.label,
      tone: view.tone,
      fileCount: row.file_count,
      bytes: row.total_bytes,
      percent: share(row.total_bytes, totalBytes),
    }
  })
}
