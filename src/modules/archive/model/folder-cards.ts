/**
 * 06 klasör kartları. Yönetici (P33): `listProgramDepartments` (S2) adlarından, sayılar `null`
 * (statik `—`; klasör özeti alanları yok — BE-025, departman başlığı yok — BE-072). Koordinatör/
 * üye (P40): kart görünmez (06 atlanır); yine de tek klasör `archiveFolders`'tan kurulabilir.
 * "grup/çalışma grubu" rozeti yok (P39); sayılar örnek/sahte değer taşımaz (§4).
 */
import { sortFolders } from './filters'
import type {
  ArchiveFolder,
  FolderCardView,
  FolderSortDirection,
  FolderSortField,
  ProgramDepartmentRow,
} from './types'

/** İlk gösterilen kart sayısı; kalanı "‹N› koordinatörlük daha" (E-06-16, istemci "daha fazla"). */
export const FOLDER_CARD_PAGE = 12

export function adminFolderCards(
  departments: readonly ProgramDepartmentRow[] | undefined,
  field: FolderSortField = 'ad',
  direction: FolderSortDirection = 'artan',
): FolderCardView[] {
  const sorted = sortFolders(
    (departments ?? []).map((d) => ({ name: d.display_name, id: d.department_id })),
    // Dosya sayısı yönetici ızgarasında bilinmez: sayıya göre sıra ada düşer.
    field === 'dosya' ? 'ad' : field,
    direction,
  )
  return sorted.map((d) => ({ folderId: d.id, name: d.name, fileCount: null, virtual: false }))
}

export function archiveFolderCards(
  folders: readonly ArchiveFolder[] | undefined,
  field: FolderSortField = 'ad',
  direction: FolderSortDirection = 'artan',
): FolderCardView[] {
  return sortFolders(folders ?? [], field, direction).map((f) => ({
    folderId: f.folder_id,
    name: f.name,
    fileCount: f.file_count,
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
