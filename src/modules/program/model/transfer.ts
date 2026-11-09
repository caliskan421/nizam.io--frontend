/**
 * Dönem aktarımı görünüm modeli (saf; `previewTransfer` → `transferWorkItems`).
 *
 *  - Önizleme olmadan aktarım yoktur: yürütme yalnız ELDEKİ önizlemenin seçimiyle ve
 *    `preview_fingerprint`'iyle yapılır; seçim önizlemeden sonra değiştiyse önizleme bayattır
 *    (`isPreviewCurrent`) ve yeniden önizlenir.
 *  - Engel/uyarı metinleri `blockers` / `warnings` DİZELERİNDEN üretilmez (sözleşmede değer kümesi
 *    yok); yalnız yapılandırılmış alanlar okunur (çözülemeyen kalem, döngü, eksik dosya, kesilen
 *    bağ, eksik erişim) ve dizilerin yalnız SAYISI gösterilir.
 *  - Eksik erişim (hedef programa bağlı olmayan departman) bayraksız aktarımı engeller;
 *    `add_missing_access` ile bağ kurulur (PROGRAM-K28). Önizleme bayrağı almaz: tek engel eksik
 *    erişimse ve kullanıcı bayrağı seçtiyse yürütme açılır.
 */
import { formatBytes, programText } from './messages'
import type { TransferPreview, TransferSelection } from './types'

/** Tek aktarımın kalem tavanı (PROGRAM-K33). */
export const TRANSFER_ITEM_LIMIT = 200

export function sameSelection(a: TransferSelection | null, b: TransferSelection | null): boolean {
  if (!a || !b) return false
  return (
    a.sourceProgramId === b.sourceProgramId &&
    a.targetProgramId === b.targetProgramId &&
    a.departmentId === b.departmentId &&
    a.workItemIds.length === b.workItemIds.length &&
    a.workItemIds.every((id, i) => id === b.workItemIds[i])
  )
}

/** Önizleme hâlâ güncel seçime mi ait. */
export function isPreviewCurrent(
  previewed: TransferSelection | null,
  current: TransferSelection | null,
): boolean {
  return sameSelection(previewed, current)
}

/** Yürütülebilir mi: sunucu `can_execute` ya da tek engel eksik erişim + bayrak seçili. */
export function canExecute(preview: TransferPreview, addMissingAccess: boolean): boolean {
  if (preview.can_execute) return true
  return preview.missing_access && addMissingAccess && preview.blockers.length === 1
}

export type SummaryTone = 'neutral' | 'warn' | 'danger'

export interface SummaryLine {
  key: string
  text: string
  tone: SummaryTone
}

const count = (list: readonly unknown[] | null | undefined) => list?.length ?? 0

function line(key: string, text: string, tone: SummaryTone = 'neutral'): SummaryLine {
  return { key, text, tone }
}

const OPTIONAL_LINES = [
  { key: 'cut', tone: 'warn', pick: (p: TransferPreview) => count(p.cut_dependency_ids) },
  { key: 'cycle', tone: 'danger', pick: (p: TransferPreview) => count(p.cycle_work_item_ids) },
  { key: 'missingFiles', tone: 'danger', pick: (p: TransferPreview) => count(p.missing_file_ids) },
  { key: 'granted', tone: 'neutral', pick: (p: TransferPreview) => count(p.granted_memberships) },
] as const

/** Önizlemenin okunur özeti (yalnız sıfırdan büyük kalemler). */
export function previewSummary(preview: TransferPreview): SummaryLine[] {
  const lines: SummaryLine[] = [
    line(
      'resolved',
      programText('transfer.resolved', { n: count(preview.resolved_work_item_ids) }),
    ),
  ]
  const unresolved = count(preview.unresolved_work_item_ids)
  if (unresolved > 0) {
    lines.push(line('unresolved', programText('transfer.unresolved', { n: unresolved }), 'danger'))
  }
  if (preview.file_count > 0) {
    const size = formatBytes(preview.file_total_bytes)
    lines.push(line('files', programText('transfer.files', { n: preview.file_count, size })))
  }
  if (preview.preserved_dependency_count > 0) {
    const n = preview.preserved_dependency_count
    lines.push(line('preserved', programText('transfer.preserved', { n })))
  }
  for (const { key, tone, pick } of OPTIONAL_LINES) {
    const n = pick(preview)
    if (n > 0) lines.push(line(key, programText(`transfer.${key}`, { n }), tone))
  }
  if (preview.missing_access) {
    lines.push(line('missingAccess', programText('transfer.missingAccess'), 'warn'))
  }
  return lines
}
