/**
 * Ek yükleme kuralları (istemci-akislari §10.10): tek istek TEK dosya (çoklu seçim her dosya için
 * ayrı mesaj); izinli 11 tür; video yok, HEIC'i istemci JPEG'e çevirir (arayüz). Tavan sunucu
 * yapılandırmasıdır (varsayılan 25 MB): sayı yazılmaz, 422 `messaging.file_too_large` alan altında
 * gösterilir. Gövde `body` parçası dosyadan ÖNCE gelir.
 */
import type {
  ArchiveFileForm,
  ArchiveFileInput,
  AttachmentForm,
  SendAttachmentInput,
} from './types'

export const ATTACHMENT_EXTENSIONS = [
  'pdf',
  'png',
  'jpg',
  'csv',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'pages',
] as const

/** Çok parçalı gövde: isteğe bağlı açıklama dosyadan ÖNCE (sunucu sıralı okur). */
export function buildAttachmentForm(vars: SendAttachmentInput): FormData {
  const form = new FormData()
  if (vars.caption) form.append('body', vars.caption)
  form.append('file', vars.file, vars.file.name)
  return form
}

/** `openapi-fetch` gövde tipi: çalışma anında FormData (work `attachFile` kalıbı). */
export function attachmentBody(vars: SendAttachmentInput): AttachmentForm {
  return buildAttachmentForm(vars) as unknown as AttachmentForm
}

/** Dosya uzantısı izinli kümede mi (yalnız ön denetim; karar sunucudadır: tür/imza/uzantı). */
export function hasAllowedExtension(fileName: string): boolean {
  const ext = fileName.split('.').at(-1)?.toLowerCase() ?? ''
  return (ATTACHMENT_EXTENSIONS as readonly string[]).includes(ext)
}

/**
 * `archiveChatFile` çok parçalı gövdesi (BE-029): metin alanları `file` parçasından ÖNCE (ön
 * kapılar dosya akışı okunmadan uygulanır); `file` SON parçadır. Boş `body` gönderilmez (sunucu
 * dosyanın görünen adını kullanır).
 */
export function buildArchiveForm(vars: ArchiveFileInput): FormData {
  const form = new FormData()
  form.append('client_message_id', vars.clientMessageId)
  form.append('work_item_id', vars.workItemId)
  form.append('tag', vars.tag)
  if (vars.subtaskId) form.append('subtask_id', vars.subtaskId)
  if (vars.body) form.append('body', vars.body)
  if (vars.replyToMessageId) form.append('reply_to_message_id', vars.replyToMessageId)
  form.append('file', vars.file, vars.file.name)
  return form
}

export function archiveBody(vars: ArchiveFileInput): ArchiveFileForm {
  return buildArchiveForm(vars) as unknown as ArchiveFileForm
}
