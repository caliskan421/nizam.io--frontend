/**
 * Arşiv modülünün tip sözlüğü. Sunucu şekilleri yalnız üretilmiş şemadan TÜRETİLİR (elle DTO
 * yok; `api/` katmanı yerel tip bildiremez, takma adları buradan alır). Burada ek olarak yalnız
 * istemci bileşimleri durur: istek hedefi, süzgeç, yazma değişkenleri, indirme sonuçları.
 */
import type { ApiError } from '@/shared/errors/api-error'
import type { components, operations, paths } from '@/shared/api/schema'
import type { MutationOutcome } from '@/shared/http/mutation'
import type { MaybeRefOrGetter } from 'vue'
import type { WorkTarget } from '@/modules/work/public'

type Schemas = components['schemas']

export type ArchiveFolder = Schemas['ArchiveFolder']
export type ArchiveFolderList = Schemas['ArchiveFolders']
export type ArchiveTask = Schemas['ArchiveTask']
export type ArchiveTaskList = Schemas['ArchiveTasks']
/** `archiveAttachments` öğesi (`FileListItem`; `tag` şemada serbest dizgedir). */
export type ArchiveFile = Schemas['FileListItem']
export type ArchiveFilePage = Schemas['ArchiveFileList']
export type ArchiveUploaderList = Schemas['ArchiveUploaders']
export type FileRecord = Schemas['FileRecord']
export type ArchiveTag = FileRecord['tag']
export type DownloadTicket = Schemas['DownloadTicketResponse']
export type RenameFileBody = Schemas['RenameFileRequest']
export type MoveFileBody = Schemas['MoveFileRequest']
/** `attachFile` çok parçalı gövdesi (şemada `file: string`; çalışma anında `FormData`). */
export type AttachFileForm =
  paths['/v1/work-items/{id}/files']['post']['requestBody']['content']['multipart/form-data']
/** `archiveAttachments` sorgu parametreleri (sunucu adlarıyla). */
export type ArchiveFileQuery = NonNullable<operations['archiveAttachments']['parameters']['query']>
export type PreviewSubtask = Schemas['WorkItemSubtask']

/**
 * Her S3 isteğinin kapsam başlıkları: program + departman. Dosya/görev işlemlerinde başlık
 * dosyanın (görev seçeneğinin) `department_id`'sidir (RECORDS-K39); koordinatör/üye okumalarında
 * seçili kapsamdan gelir.
 */
export type ArchiveTarget = WorkTarget

/**
 * Yönetici program arşivi (S2, `/v1/program/archive/*`; RECORDS-K39): yalnız program başlığı,
 * isteğe bağlı `department_id` sorgu süzgeci (başlık DEĞİL). Okuma kaynağı S3 hedefi
 * (`ArchiveTarget`) ya da bu program kaynağıdır (`isProgramSource`).
 */
export interface ProgramArchiveSource {
  programId: string
  /** `department_id` süzgeci (klasör); `null` = bütün program. */
  departmentId: string | null
  program: true
}
export type ArchiveSource = ArchiveTarget | ProgramArchiveSource

export function isProgramSource(source: ArchiveSource): source is ProgramArchiveSource {
  return 'program' in source && source.program === true
}

/** `mime_category` kümesi (sözleşme; PDF ayrı kategori DEĞİL, `belge` içindedir — E-06-07). */
export type ArchiveMimeCategory = 'belge' | 'tablo' | 'gorsel' | 'arsiv' | 'metin'
/** 06 tür segmenti (URL `tur`): yalnız gönderilebilen değerler. */
export type ArchiveKind = 'tumu' | 'gorsel' | 'belge'
/** `archiveAttachments.sort`: yalnız kodda belgeli değerler; boş = varsayılan (`created_at` azalan). */
export type ArchiveSort = '' | 'name' | 'size'
export type ArchiveView = 'izgara' | 'liste'

/** Dosya listesi süzgeci (UI adlarıyla); imleç burada YOK — süzgeç değişince sıfırlanır. */
export interface ArchiveFileFilters {
  tag?: ArchiveTag
  kind?: ArchiveKind
  search?: string
  workItemId?: string
  uploaderId?: string
  sort?: ArchiveSort
}

/** Klasör ızgarasının istemci sıralaması (06 `sirala`): ad, dosya sayısı, son yükleme (BE-025). */
export type FolderSortField = 'ad' | 'dosya' | 'son'
export type FolderSortDirection = 'artan' | 'azalan'

/** Görev klasörleri (07): `archiveTasks` / `programArchiveTasks?department_id`. */
export interface TaskFolders {
  tasks: ArchiveTask[]
  /** Sunucu listeyi 200'de kesti (`X-Result-Truncated`): liste eksik olabilir. */
  truncated: boolean
  /** Görev listesi okundu mu. */
  ready: boolean
}

/** Yükleme penceresi görev satırı (`UploadDialog` props `tasks`). */
export interface UploadTask {
  workItemId: string
  title: string
  /** Görevin departmanı = isteğin S3 başlığı. */
  departmentId: string
}

export interface AttachArchiveFileInput {
  target: ArchiveTarget
  workItemId: string
  file: Blob
  /** `File` değilse zorunlu. */
  fileName?: string
  tag: ArchiveTag
  subtaskId?: string
}

export interface ArchiveFileRef {
  target: ArchiveTarget
  workItemId: string
  fileId: string
}

export interface RenameArchiveFileInput extends ArchiveFileRef {
  displayName: string
}

/**
 * `moveFile` değişkenleri (RECORDS-K46): `target` + `workItemId` + `fileId` KAYNAK dosyanındır
 * (S3 başlıkları); hedef görev yalnız gövdededir, hedef departman başlık DEĞİLDİR.
 */
export interface MoveArchiveFileInput extends ArchiveFileRef {
  targetWorkItemId: string
  /** Hedef görevin canlı alt görevi; yoksa dosya yalnız ana göreve bağlanır. */
  targetSubtaskId?: string
}

/** `retagFile` değişkenleri: kapalı küme etiketi (BE-074). */
export interface RetagArchiveFileInput extends ArchiveFileRef {
  tag: ArchiveTag
}

/** S3 indirme türü: tek dosya ya da klasör ZIP'i (dönem ZIP'i S2'dir: `PeriodZipRequest`). */
export type ArchiveDownloadKind = 'file' | 'folder'

export interface ArchiveDownloadRequest {
  target: ArchiveTarget
  kind: ArchiveDownloadKind
  /** `file` için dosya, `folder` için klasör kimliği. */
  id: string
  /** Sunucu `Content-Disposition` vermezse kaydedilecek ad. */
  fallbackName: string
}

/**
 * Dönem arşivi ZIP'i (`programArchiveZip`, S2; BE-120): yalnız program başlığı, departman başlığı
 * YOK. `includeReports` → `include_reports=true` (BE-124: `00-Genel/Donem-Raporu.pdf`, birim
 * raporları, `EKSIK-DOSYALAR.txt`).
 */
export interface PeriodZipRequest {
  programId: string
  includeReports: boolean
  /** Sunucu `Content-Disposition` vermezse kaydedilecek ad. */
  fallbackName: string
}

/** Bilet tüketiminin sonucu: kaydedildi ya da sınıflandırılmış hata (otomatik tekrar yok). */
export interface ArchiveDownloadSaved {
  kind: 'saved'
  fileName: string
  /** Yanıt `X-Result-Truncated: true` taşıdı (raporlu ZIP'te gömülü rapor kesildi; BE-124). */
  truncated?: boolean
}
/** Tüketimde hedefin hatası (422 `identity.download_target_invalid`, 429, `records.*`). */
export interface ArchiveDownloadFailed {
  kind: 'failed'
  error: ApiError
  /** 429 `Retry-After` (saniye) — otomatik tekrar yok. */
  retryAfter: number | null
}
export type TicketOutcome =
  | MutationOutcome<ArchiveDownloadRequest, DownloadTicket, unknown>
  | MutationOutcome<PeriodZipRequest, DownloadTicket, unknown>
/** Bilet ÜRETİMİ başarısız (429 açık bilet tavanı, 403, ağ …): ortak yazma sonucu. */
export interface ArchiveDownloadTicketFailed {
  kind: 'ticket_failed'
  outcome: TicketOutcome
}
/** Sahip (ekran) bilet alınırken söküldü: bilet tüketilmedi, bildirim yok. */
export interface ArchiveDownloadDisposed {
  kind: 'disposed'
}
export type ArchiveDownloadResult =
  | ArchiveDownloadSaved
  | ArchiveDownloadFailed
  | ArchiveDownloadTicketFailed
  | ArchiveDownloadDisposed

/** Yönetici merceği kararı (`model/admin-scope.ts`). */
export type ArchiveAccess =
  | { mode: 'waiting' }
  /** Yönetici için rotadaki klasör kimliği başlığa yazılamaz (biçim/sanal klasör): bulunamadı. */
  | { mode: 'invalid' }
  | { mode: 'admin-overview' }
  | { mode: 'admin-folder'; target: ArchiveTarget; folderId: string }
  | { mode: 'scoped'; target: ArchiveTarget }

/** 06 klasör kartı (`archiveFolders` / `programArchiveFolders`). */
export interface FolderCardView {
  folderId: string
  name: string
  /** Canlı dosya sayısı. */
  fileCount: number
  /** Dosyalı görev sayısı (`task_count`, BE-025). */
  taskCount: number
  /** Klasördeki dosyaların toplam boyutu (bayt; `total_bytes`, BE-025). */
  totalBytes: number
  /** Hâlen arşivde duran en yeni dosya metadata'sının oluşturulma anı (UTC); dosyasızda `null`. */
  lastUploadedAt: string | null
  /** Üye sanal klasörü ("Görevlerim"). */
  virtual: boolean
}

/** Reaktif okuma kaynağı ve etkinleştirme girdileri (okuyucu composable'ları). */
export type MaybeTarget = MaybeRefOrGetter<ArchiveSource | null>
export type MaybeFlag = MaybeRefOrGetter<boolean>
