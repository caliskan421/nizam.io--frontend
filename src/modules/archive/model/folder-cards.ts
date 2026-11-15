/**
 * 06 klasör kartları. Yönetici (BE-072): `programArchiveFolders` (S2) — programa bağlı bütün
 * koordinatörlükler, dosyasızlar 0 ile; kartta dosya/görev sayısı, boyut ve son yükleme (BE-025). Koordinatör/üye (P40): kart görünmez (06 atlanır); yine de
 * tek klasör `archiveFolders`'tan kurulabilir. "grup/çalışma grubu" rozeti yok (P39); sayılar
 * sunucudandır, örnek/sahte değer yoktur (§4).
 */
import { sortFolders } from './filters'
import type { ArchiveFolder, FolderCardView, FolderSortDirection, FolderSortField } from './types'

/** İlk gösterilen kart sayısı; kalanı "‹N› koordinatörlük daha" (E-06-16, istemci "daha fazla"). */
export const FOLDER_CARD_PAGE = 12

export function archiveFolderCards(
  folders: readonly ArchiveFolder[] | undefined,
  field: FolderSortField = 'ad',
  direction: FolderSortDirection = 'artan',
): FolderCardView[] {
  return sortFolders(folders ?? [], field, direction).map((f) => ({
    folderId: f.folder_id,
    name: f.name,
    fileCount: f.file_count,
    taskCount: f.task_count,
    totalBytes: f.total_bytes,
    lastUploadedAt: f.last_uploaded_at,
    virtual: f.is_virtual,
  }))
}

/** İlk `FOLDER_CARD_PAGE` kart ve kalan sayısı (`expanded` ise hepsi). */
export function pageCards(
  cards: readonly FolderCardView[],
  expanded: boolean,
): { shown: FolderCardView[]; remaining: number } {
  if (expanded || cards.length <= FOLDER_CARD_PAGE) return { shown: [...cards], remaining: 0 }
  return { shown: cards.slice(0, FOLDER_CARD_PAGE), remaining: cards.length - FOLDER_CARD_PAGE }
}
