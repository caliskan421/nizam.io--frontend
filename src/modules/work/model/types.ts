/**
 * Görev modülünün tip sözlüğü. Sunucu şekilleri yalnız üretilmiş şemadan TÜRETİLİR (elle DTO
 * yok — `api/` katmanı yerel tip bildiremez, takma adları buradan alır). Burada ek olarak
 * yalnız istemci tarafı bileşimler durur: hedef kapsam (`WorkTarget`) ve korumalı yazma
 * eylemlerinin değişkenleri (gövde şemadan, kapsam + kimlik istemciden).
 */
import type { components, paths } from '@/shared/api/schema'

type Schemas = components['schemas']

export type WorkItem = Schemas['WorkItem']
export type WorkItemDetail = Schemas['WorkItemDetail']
export type WorkItemList = Schemas['WorkItemList']
export type WorkItemStatus = WorkItem['status']
export type WorkItemPriority = WorkItem['priority']
export type WorkItemSubtask = Schemas['WorkItemSubtask']
export type WorkItemSubtaskList = Schemas['WorkItemSubtaskList']
export type WorkItemNote = Schemas['WorkItemNote']
export type WorkItemNoteList = Schemas['WorkItemNoteList']
export type WorkItemFile = Schemas['WorkItemFileListItem']
export type WorkItemFileList = Schemas['FileRecordList']
export type FileRecord = Schemas['FileRecord']
export type FileTag = FileRecord['tag']
export type ProgramDepartment = Schemas['ProgramDepartment']
export type ProgramDepartmentList = Schemas['ProgramDepartmentList']
export type MyDepartment = Schemas['MyDepartment']
export type CreateWorkItemBody = Schemas['CreateWorkItemRequest']
export type UpdateWorkItemBody = Schemas['UpdateWorkItemRequest']
export type TransitionBody = Schemas['TransitionRequest']
export type TransitionResult = Schemas['TransitionResult']
export type CreateSubtaskBody = Schemas['CreateSubtaskRequest']
export type UpdateSubtaskBody = Schemas['UpdateSubtaskRequest']
export type AddedCount = Schemas['AddedCount']
export type StatusResult = Schemas['StatusResult']
export type WorkNoteUpdated = Schemas['WorkNoteUpdated']
export type DownloadTicket = Schemas['DownloadTicketResponse']
/** `attachFile` çok parçalı gövdesi (şemada `file: string`; çalışma anında `FormData`). */
export type AttachFileForm =
  paths['/v1/work-items/{id}/files']['post']['requestBody']['content']['multipart/form-data']

/** `attachFile` `tag` kapalı kümesi (şema enum'u ile aynı sıra; P5 etiket seçici). */
export const FILE_TAGS: readonly FileTag[] = ['ister', 'plan', 'girdi', 'analiz', 'cikti', 'sonuc']

/** Beş durum, sözleşme sırası (E-03-07/23; P5 — `iade_edildi` dahil). */
export const WORK_ITEM_STATUSES: readonly WorkItemStatus[] = [
  'baslanmadi',
  'devam_ediyor',
  'onaya_sunuldu',
  'iade_edildi',
  'tamamlandi',
]

/**
 * Bir isteğin kapsam başlıkları (`X-Nizamio-Program` / `X-Nizamio-Department`). Tek göreve ait
 * her istek GÖREVİN KENDİ program/departmanıyla gider (istemci-akislari §2; aksi 404
 * `work.item_not_found`); yeni görev seçilen departmanla. Eylem anında değişkene yazılır ve
 * eylemle birlikte dondurulur: başlık her gönderimde (tekrar dahil) aynıdır.
 */
export interface WorkTarget {
  programId: string
  departmentId: string
}

/** Tek göreve bağlı okuma kaynakları (`queryKeys.workItems.<kaynak>`). */
export type WorkItemResource = 'item' | 'subtasks' | 'files' | 'notes'

/** S2 okuma kapsamı (departmansız). */
export interface ProgramTarget {
  programId: string
}

/** Tek göreve ait yazma: hedef kapsam + görev kimliği (+ gövde). */
export interface WorkItemRef {
  target: WorkTarget
  workItemId: string
}

export interface CreateWorkItemInput {
  target: WorkTarget
  body: CreateWorkItemBody
}

/** Yeni görev + (koordinatörde) ek atananlar (`addAssignments`, ikinci adım). */
export interface CreateWorkItemWithAssigneesInput extends CreateWorkItemInput {
  /** `body.assignee_account_id` dışındaki ek atananlar; boşsa ikinci adım koşmaz. */
  extraAssignees: readonly string[]
}

export interface AddAssignmentsInput extends WorkItemRef {
  accountIds: readonly string[]
}

/** `updateWorkItem`: `base` formun açılışta okuduğu görev (sürümler buradan). */
export interface UpdateWorkItemInput extends WorkItemRef {
  base: WorkItem
  changes: UpdateWorkItemBody
}

export interface TransitionInput extends WorkItemRef {
  body: TransitionBody
}

export interface CreateSubtaskInput extends WorkItemRef {
  body: CreateSubtaskBody
}

/** `updateWorkItemSubtask`: yalnız `{done}` gönderilirse sürüm eklenmez. */
export interface UpdateSubtaskInput extends WorkItemRef {
  base: WorkItemSubtask
  changes: UpdateSubtaskBody
}

export interface SubtaskRef extends WorkItemRef {
  subtaskId: string
}

export interface AttachFileInput extends WorkItemRef {
  file: Blob
  /** Dosya adı (`File` değilse zorunlu). */
  fileName?: string
  tag: FileTag
  subtaskId?: string
}

export interface FileRef extends WorkItemRef {
  fileId: string
}

export interface RenameFileInput extends FileRef {
  displayName: string
}

export interface AddNoteInput extends WorkItemRef {
  content: string
}

export interface NoteRef extends WorkItemRef {
  noteId: string
}

export interface UpdateNoteInput extends NoteRef {
  base: WorkItemNote
  content: string
}
