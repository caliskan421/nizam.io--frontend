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
import type { components } from '@/shared/api/schema'

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

/** W122 · E-06-10…15 — tek klasör kartı: dosya/görev sayısı, boyut, son yükleme (sunucudan; BE-025). */
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

/** W122 · E-06-22…24 — depolama özeti; toplam ve tür/etiket dağılımı `totals`'tan (BE-025). */
export interface StorageSummaryProps {
  totalFiles: number | null
  /** `totals.total_bytes`; okunana dek `null` → `—`. */
  totalBytes: number | null
  /** `totals.by_type`; okunmadıysa `null` → `—` (boş `[]` gerçek boştur). */
  byType: components['schemas']['ArchiveFolderTotals']['by_type'] | null
  /** `totals.by_tag`; okunmadıysa `null` → `—`. */
  byTag: components['schemas']['ArchiveFolderTotals']['by_tag'] | null
  loading: boolean
  /** Klasör okuması başarısız (veri yok): sıfır/boş değil, hata + yeniden dene. */
  error?: boolean
}
export interface StorageSummaryEmits {
  (e: 'retry'): void
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
  /** Süzgece uyan kümenin kesin boyu (`ArchiveFileList.total`); gelene dek `null` → yüklenen sayı. */
  total: number | null
}
export interface FileFilterBarEmits {
  'update:tag': [value: ArchiveTag | null]
  'update:view': [value: ArchiveView]
}

/** W123 · E-06-41…45 — dosya ızgarası ve küçük resim için program kapsamı. */
export interface FileGridProps {
  programId?: string | null
  files: readonly ArchiveFile[]
  /** `work_item_id` → görev adı (`archiveTasks` sözlüğü). */
  taskTitles: Readonly<Record<string, string>>
  selectedFileId: string | null
  hasMore: boolean
  loading: boolean
  error: boolean
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
  fullscreen: [trigger: HTMLElement]
  /** Silme isteği uçuşta mı: sayfa bu sürede paneli listeden düşse bile açık tutar (sonuç bildirimi). */
  removing: [pending: boolean]
  close: []
  previous: []
  next: []
  deleted: [fileId: string]
  renamed: [fileId: string]
  /** Başka göreve taşındı (W194): dosya bu klasör/süzgeçten düşebilir; panel kapanır. */
  moved: [fileId: string]
  openTask: [workItemId: string]
}

/** W124/W194 · E-06-56…60 — indir / yeniden adlandır / etiketle / başka göreve taşı / sil. */
export interface FileActionsProps {
  file: ArchiveFile
  target: ArchiveTarget
}
export interface FileActionsEmits {
  /** Silme ya da taşıma uçuşta/teslimde: sayfa paneli açık tutar. */
  removing: [pending: boolean]
  deleted: [fileId: string]
  renamed: [fileId: string]
  moved: [fileId: string]
}

/** W194 · E-06-59 — başka göreve taşıma penceresi (`moveFile`; başlıklar KAYNAK dosyanındır). */
export interface MoveFileDialogProps {
  open: boolean
  file: ArchiveFile
  target: ArchiveTarget
}
export interface MoveFileDialogEmits {
  'update:open': [value: boolean]
  /** İstek + sonuç teslimi sürüyor mu (önizleme sahibini açık tutmak için). */
  moving: [pending: boolean]
  moved: [fileId: string]
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
  /** `include_empty=true` görev seçenekleri (dosyasızlar dahil; başlık = seçeneğin `department_id`'si). */
  tasks: readonly UploadTask[]
  defaultTaskId?: string | null
  /** Sunucu seçenek listesini 200'de kesti (`X-Result-Truncated`). */
  truncated?: boolean
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
