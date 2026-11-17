/**
 * Ek yükleme ve indirme (istemci-akislari §10.10). Yükleme: `POST /v1/chats/{id}/attachments`
 * (multipart, tek dosya; `client_message_id` SORGUda; 201 yeni, 200 tekrar). İndirme: bilet akışı
 * (`shared/download`): `issueDownloadTicket` → `downloadChatAttachment` / `downloadChatSharedFile`
 * (S2: program başlığı bilete yazılır). Mesaj silindi ya da üyelik düştüyse bilet 404 alır
 * (`messaging.message_not_found` / `ref_not_found` → "artık yok").
 */
import { api } from '@/shared/http'
import { useProtectedMutation } from '@/shared/http/mutation'
import { useDownloadFlow, type DownloadTarget } from '@/shared/download'

import { withEffects } from '../model/effects'
import { archiveBody, attachmentBody } from '../model/attachments'
import { upsertMessage } from '../model/window'
import type {
  ArchiveFileInput,
  ArchivedChatFile,
  ChatDownloadRequest,
  ChatMessage,
  SendAttachmentInput,
} from '../model/types'
import { programHeaders } from './http'
import { patchWindow } from './window-cache'

export function useSendChatAttachment() {
  return withEffects(
    useProtectedMutation<SendAttachmentInput, ChatMessage>({
      operation: 'sendChatAttachment',
      send: (vars, ctx) =>
        api.POST('/v1/chats/{chatId}/attachments', {
          params: {
            header: programHeaders(vars),
            path: { chatId: vars.chatId },
            query: {
              client_message_id: vars.clientMessageId,
              ...(vars.replyToMessageId ? { reply_to_message_id: vars.replyToMessageId } : {}),
            },
          },
          body: attachmentBody(vars),
          signal: ctx.signal,
        }),
    }),
    {
      onSuccess: (fx) =>
        patchWindow(fx.client, fx.scope, fx.vars.chatId, (w) => upsertMessage(w, fx.data)),
    },
  )
}

/**
 * Görev arşivine de kaydet (BE-029, `archiveChatFile`): tek multipart istek (dosya arşive yüklenir,
 * sohbete `file` referanslı mesaj düşer; 201 yeni / 200 tekrar). `Idempotency-Key` eylem başına
 * bir kez (motor; ağ tekrarında AYNI), `client_message_id` vars'ta sabittir. Yarım iş telafisi
 * (mesaj düşerse dosya silinir; telafi düşerse arşivde kalır) SUNUCUDADIR: istemci ikinci adım
 * uydurmaz. Başarıda dönen gerçek mesaj pencereye işlenir; görev dosyası/arşiv/sohbet yüzeyleri
 * `query-keys` ilişkisiyle yenilenir (`workItemId` bağlamı → yalnız o görevin dosyaları).
 */
export function useArchiveChatFile() {
  return withEffects(
    useProtectedMutation<ArchiveFileInput, ArchivedChatFile>({
      operation: 'archiveChatFile',
      invalidation: (vars) => ({ workItemId: vars.workItemId, chatId: vars.chatId }),
      send: (vars, ctx) =>
        api.POST('/v1/chats/{chatId}/archived-files', {
          params: {
            header: { ...programHeaders(vars), 'Idempotency-Key': ctx.idempotencyKey },
            path: { chatId: vars.chatId },
          },
          body: archiveBody(vars),
          signal: ctx.signal,
        }),
    }),
    {
      onSuccess: (fx) =>
        patchWindow(fx.client, fx.scope, fx.vars.chatId, (w) => upsertMessage(w, fx.data.message)),
    },
  )
}

/** Bilet hedefinin göreli yolu (kapalı liste sunucuda: yalnız bu iki sohbet deseni). */
export function chatDownloadPath(request: ChatDownloadRequest): string {
  const id = encodeURIComponent(request.id)
  return request.kind === 'attachment' ? `/v1/chat-attachments/${id}` : `/v1/chat-file-refs/${id}`
}

function chatTarget(request: ChatDownloadRequest): DownloadTarget {
  return {
    method: 'GET',
    path: chatDownloadPath(request),
    headers: programHeaders(request),
    fallbackName: request.fallbackName,
  }
}

/** Ek / paylaşılan dosya indir: bilet tıklama anında üretilir, saklanmaz. */
export function useChatDownload() {
  const flow = useDownloadFlow<ChatDownloadRequest>(chatTarget)
  return { start: (request: ChatDownloadRequest) => flow.start(request), isPending: flow.isPending }
}
