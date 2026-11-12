/**
 * Arşiv ekranları bileşen İSKELETİ (W121; O2b sözleşmesi — KESİN 28). Adlar ve prop/emit tipleri
 * burada SABİTTİR; her O2b uygulayıcısı (W122–W126) yalnız kendi `.vue` dosyalarının gövdesini
 * doldurur, bu dosyaya satır eklemez/değiştirmez. Sözleşme değişikliği koordinatör kararıdır.
 *
 * Veri: yalnız `../api` (public.ts) composable'ları. Sayfalar `useArchiveContext(klasorId)` ile
 * S3 hedefini kurar (P33: yöneticide rotadaki klasör; K/Ü kapsamdan); bileşenler hedefi PROP
 * olarak alır ve kendi başlık kararını vermez. Eylem görünürlüğü yalnız `../model/capabilities`
 * (`archiveCapabilities`); mercek yetki değildir (P1). Yazmalar `../api/writes.ts` ile; onay
 * `shared/ui/confirm` `confirmWrite`; sonuç `notifyOutcome`. Tasarımda olup uçları olmayan öğeler
 * `../model/stubs.ts` olgularıyla devre dışı/statik (sahte veri yok). Metinler `trArchive`
 * (tek ağaç; her W yalnız kendi alt dalı): `archive.folders` (W122), `archive.folder` +
 * `archive.tree` + `archive.tasks` + `archive.files` (W123), `archive.preview` +
 * `archive.actions` (W124), `archive.upload` (W125), `archive.zip` (W126).
 *
 * BAĞLAMA NOKTALARI ("üst bileşende görünür" kabul ölçütü; bağlama yalnız sayfa sahibine aittir):
 *  - `pages/ArchivePage.vue` (W122 gövde): `ArchiveSearchBar`, `FolderGrid`, `TagLegend`,
 *    `StorageSummary` (W122) + `PeriodZipButton` (W126 yapar, W122 bağlar; "Tümünü indir",
 *    E-06-04) + `UploadDialog` (W125 yapar, W122 bağlar; "Dosya yükle" E-06-05 düğmesi açar,
 *    `v-if`; `tasks` = `useArchiveTaskFolders` görevleri `UploadTask[]`'e çevrilmiş; `close`
 *    kapatır, `uploaded` listeyi bildirir).
 *  - `pages/ArchiveFolderPage.vue` (W123 gövde): `FolderTree`, `TaskFolderCards`,
 *    `FileFilterBar`, `FileGrid` | `FileList` (W123) + `FilePreview` (W124 yapar, W123 bağlar;
 *    `?dosya` seçili dosya) + `FolderZipButton` (W126 yapar, W123 bağlar; E-06-34) +
 *    `UploadDialog` (W125 yapar, W123 bağlar; E-06-35, `defaultTaskId` = `?gorev`).
 *  - `FilePreview` (W124) içinde `FileActions` ve `RenameFileDialog` (W124) bağlıdır.
 * Kabul: `docs/ekranlar/06-arsiv/README.md` kabul tablosu (yalnız `kabul`/`geçici kabul`).
 */
import type {
  ArchiveFile,
  ArchiveFolder,
  ArchiveKind,
  ArchiveTag,
  ArchiveTarget,
  ArchiveTask,
  ArchiveView,
  FolderCardView,
  FolderSortDirection,
  FolderSortField,
  UploadTask,
} from '../model/types'

// --- W122 — 06 Arşiv (klasör listesi) ---------------------------------------------------------

/** W122 · E-06-06/07/26 — arama kutusu + tür segmenti (Tümü/Görsel/Belge); `q`, `tur` URL'de. */
export interface ArchiveSearchBarProps {
  q: string
  kind: ArchiveKind
  /** Yönetici (P33): arama statik/boş durum — "Görev klasörü seçin" (designStub BE-072). */
  disabled: boolean
}
export interface ArchiveSearchBarEmits {
  'update:q': [value: string]
  'update:kind': [value: ArchiveKind]
}

/** W122 · E-06-08/09/16 — klasör kartları (ilk 12 + "daha"), sıra düğmesi, boş/yükleniyor/hata. */
export interface FolderGridProps {
  cards: readonly FolderCardView[]
  sortField: FolderSortField
  sortDirection: FolderSortDirection
  loading: boolean
  error: boolean
}
export interface FolderGridEmits {
  /** Kart tıklaması → `/arsiv/:klasorId`. */
  open: [folderId: string]
  'update:sort': [field: FolderSortField, direction: FolderSortDirection]
  retry: []
}

/** W122 · E-06-10…15 — tek klasör kartı; sayılar `null` iken statik `—` (sahte veri yok). */
export interface FolderCardProps {
  card: FolderCardView
}
export interface FolderCardEmits {
  open: [folderId: string]
}

/** W122 · E-06-17…21 — kapalı etiket listesi (P34) + devre dışı "yeni etiket" formu (BE-024). */
export interface TagLegendProps {
  selected?: ArchiveTag | null
}
export interface TagLegendEmits {
  select: [tag: ArchiveTag]
}

/** W122 · E-06-22…24 — depolama özeti; toplam dosya canlı (K/Ü), bayt/dağılım statik (BE-025). */
export interface StorageSummaryProps {
  totalFiles: number | null
  loading: boolean
}

// --- W123 — 07 Arşiv › Klasör (ağaç, görevler, dosyalar) ---------------------------------------

/** W123 · E-06-27…30 — klasör ağacı: düzey 0 klasörler (`archiveFolders`), düzey 1 görevler. */
export interface FolderTreeProps {
  folders: readonly FolderCardView[]
  activeFolderId: string
  tasks: readonly ArchiveTask[]
  selectedTaskId: string | null
  /** Yönetici: görev listesi 200 tavanında kesildi (kesişim eksik olabilir). */
  truncated: boolean
  loadingTasks: boolean
}
export interface FolderTreeEmits {
  selectFolder: [folderId: string]
  selectTask: [workItemId: string | null]
}

/** W123 · E-06-36/37 — görev klasörü kartları; `gorev` URL'de. */
export interface TaskFolderCardsProps {
  tasks: readonly ArchiveTask[]
  selectedTaskId: string | null
  truncated: boolean
  loading: boolean
}
export interface TaskFolderCardsEmits {
  select: [workItemId: string | null]
}

/** W123 · E-06-38…40/46 — başlık + sayaç ("n+"), etiket segmenti, görünüm segmenti. */
export interface FileFilterBarProps {
  tag: ArchiveTag | null
  view: ArchiveView
  loaded: number
  /** Kesin toplam (`knownTotal`); süzgeçlide `null` → "n+" (hasMore). */
  total: number | null
  hasMore: boolean
}
export interface FileFilterBarEmits {
  'update:tag': [value: ArchiveTag | null]
  'update:view': [value: ArchiveView]
}

/** W123 · E-06-41…45 — dosya ızgarası (nötr tür simgesi, küçük resim yok; BE-026). */
export interface FileGridProps {
  files: readonly ArchiveFile[]
  /** `work_item_id` → görev adı (`archiveTasks` sözlüğü). */
  taskTitles: Readonly<Record<string, string>>
  selectedFileId: string | null
  hasMore: boolean
  loading: boolean
  error: boolean
  /** Yönetici, görev seçilmemiş: "Görev klasörü seçin" boş durumu (BE-072). */
  needsTask: boolean
}
export interface FileGridEmits {
  select: [fileId: string]
  loadMore: []
  retry: []
}

/** W123 · E-06-61 — dosya listesi (ad/görev/tür/boyut/etiket); ızgarayla aynı sözleşme. */
export type FileListProps = FileGridProps
export type FileListEmits = FileGridEmits

// --- W124 — önizleme ve dosya eylemleri -------------------------------------------------------

/** W124 · E-06-45…57 — önizleme paneli (görsel blob, tür rozeti, önceki/sonraki, kapat). */
export interface FilePreviewProps {
  file: ArchiveFile
  /** 1 tabanlı konum ve toplam ("‹i› / ‹N›"; toplam bilinmiyorsa `null` → "n+"). */
  position: number
  total: number | null
  hasMore: boolean
  /** Dosyanın departmanını taşıyan S3 hedefi (yöneticide rotadaki klasör). */
  target: ArchiveTarget
  taskTitle: string | null
}
export interface FilePreviewEmits {
  close: []
  previous: []
  next: []
  deleted: [fileId: string]
  renamed: [fileId: string]
  openTask: [workItemId: string]
}

/** W124 · E-06-56…60 — indir / yeniden adlandır / sil + devre dışı etiket-taşı (BE-074/075). */
export interface FileActionsProps {
  file: ArchiveFile
  target: ArchiveTarget
}
export interface FileActionsEmits {
  deleted: [fileId: string]
  renamed: [fileId: string]
}

/** W124 · E-06-57/64 — yeniden adlandırma formu (409 `records.name_taken` alanın altında). */
export interface RenameFileDialogProps {
  open: boolean
  file: ArchiveFile
  target: ArchiveTarget
}
export interface RenameFileDialogEmits {
  'update:open': [value: boolean]
  renamed: [fileId: string]
}

// --- W125 — yükleme ---------------------------------------------------------------------------

/** W125 · E-06-05/35/62 — görev seçtiren yükleme penceresi (zorunlu etiket, sürükle-bırak). */
export interface UploadDialogProps {
  tasks: readonly UploadTask[]
  defaultTaskId?: string | null
}
export interface UploadDialogEmits {
  close: []
  uploaded: [fileId: string]
}

// --- W126 — ZIP -------------------------------------------------------------------------------

/** W126 · E-06-34 — klasör ZIP'i (bilet; kota/yarım indirme açık). */
export interface FolderZipButtonProps {
  target: ArchiveTarget
  folder: Pick<ArchiveFolder, 'folder_id' | 'name' | 'is_virtual'>
}

/** W126 · E-06-04 — dönem ZIP'i (yalnız ŞY); `target` `null` iken devre dışı (06, BE-072). */
export interface PeriodZipButtonProps {
  target: ArchiveTarget | null
}

// --- Bileşenler (gövdeler O2b'de) ------------------------------------------------------------

export { default as ArchiveSearchBar } from './folders/ArchiveSearchBar.vue'
export { default as FolderGrid } from './folders/FolderGrid.vue'
export { default as FolderCard } from './folders/FolderCard.vue'
export { default as TagLegend } from './folders/TagLegend.vue'
export { default as StorageSummary } from './folders/StorageSummary.vue'
export { default as FolderTree } from './tree/FolderTree.vue'
export { default as TaskFolderCards } from './tasks/TaskFolderCards.vue'
export { default as FileFilterBar } from './files/FileFilterBar.vue'
export { default as FileGrid } from './files/FileGrid.vue'
export { default as FileList } from './files/FileList.vue'
export { default as FilePreview } from './preview/FilePreview.vue'
export { default as FileActions } from './preview/FileActions.vue'
export { default as RenameFileDialog } from './preview/RenameFileDialog.vue'
export { default as UploadDialog } from './upload/UploadDialog.vue'
export { default as FolderZipButton } from './zip/FolderZipButton.vue'
export { default as PeriodZipButton } from './zip/PeriodZipButton.vue'
