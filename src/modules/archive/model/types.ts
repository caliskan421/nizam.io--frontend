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
/** `attachFile` çok parçalı gövdesi (şemada `file: string`; çalışma anında `FormData`). */
export type AttachFileForm =
  paths['/v1/work-items/{id}/files']['post']['requestBody']['content']['multipart/form-data']
/** `archiveAttachments` sorgu parametreleri (sunucu adlarıyla). */
export type ArchiveFileQuery = NonNullable<operations['archiveAttachments']['parameters']['query']>
/** `listWorkItemFiles` öğesi: önizlemede yükleyen adı (`uploaded_by_full_name`, null olabilir). */
export type PreviewFileInfo = Schemas['WorkItemFileListItem']
export type PreviewSubtask = Schemas['WorkItemSubtask']

/**
 * Her S3 isteğinin kapsam başlıkları: program + departman. Yöneticide departman rotadaki
 * `klasorId`'den (P33, `model/admin-scope.ts`), koordinatör/üyede seçili kapsamdan gelir.
 */
export type ArchiveTarget = WorkTarget

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

/** Klasör ızgarasının istemci sıralaması (06 `sirala`): yalnız sunucunun verdiği alanlar. */
export type FolderSortField = 'ad' | 'dosya'
export type FolderSortDirection = 'artan' | 'azalan'

/** Bir yönetici ızgara öğesi: `listProgramDepartments` adı + sayılar statik (BE-072/BE-025). */
export interface AdminFolderCard {
  folderId: string
  name: string
}

/** Yönetici görev klasörleri: `archiveTasks` ∩ `listProgramWorkItems(department_id)`. */
export interface AdminTaskFolders {
  tasks: ArchiveTask[]
  /** 200 tavanına çarpıldı (sonraki sayfa var): kesişim eksik olabilir. */
  truncated: boolean
  /** Görev listesi (kesişim) henüz tamamlandı mı. */
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

/** İndirme türü: tek dosya, klasör ZIP'i, dönem ZIP'i (seçim ZIP'i kullanılmaz). */
export type ArchiveDownloadKind = 'file' | 'folder' | 'period'

export interface ArchiveDownloadRequest {
  target: ArchiveTarget
  kind: ArchiveDownloadKind
  /** `file` için dosya, `folder` için klasör kimliği; `period` için yok. */
  id?: string
  /** Sunucu `Content-Disposition` vermezse kaydedilecek ad. */
  fallbackName: string
}

/** Bilet tüketiminin sonucu: kaydedildi ya da sınıflandırılmış hata (otomatik tekrar yok). */
export interface ArchiveDownloadSaved {
  kind: 'saved'
  fileName: string
}
/** Tüketimde hedefin hatası (422 `identity.download_target_invalid`, 429, `records.*`). */
export interface ArchiveDownloadFailed {
  kind: 'failed'
  error: ApiError
  /** 429 `Retry-After` (saniye) — otomatik tekrar yok. */
  retryAfter: number | null
}
export type TicketOutcome = MutationOutcome<ArchiveDownloadRequest, DownloadTicket, unknown>
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

/** 06 klasör kartı: sayılar yönetici merceğinde `null` (statik `—`; BE-072/BE-025). */
export interface FolderCardView {
  folderId: string
  name: string
  /** Canlı dosya sayısı (K/Ü `archiveFolders.file_count`); yöneticide `null`. */
  fileCount: number | null
  /** Üye sanal klasörü ("Görevlerim"). */
  virtual: boolean
}

/** `listProgramDepartments` öğesinden gerekli alanlar (yönetici ızgarası). */
export type ProgramDepartmentRow = Schemas['ProgramDepartment']

/** Reaktif hedef ve etkinleştirme girdileri (okuyucu composable'ları). */
export type MaybeTarget = MaybeRefOrGetter<ArchiveTarget | null>
export type MaybeFlag = MaybeRefOrGetter<boolean>
