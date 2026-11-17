/**
 * Mesajı ilet (BE-080, `forwardChatMessage`): 1–10 benzersiz hedef, hepsi ya da hiçbiri (biri
 * reddedilirse HİÇBİR hedefe yazılmaz: tek hata, kısmi sonuç yok). `Idempotency-Key` eylem başına
 * bir kez (motor; "sonuç bilinmiyor" tekrarında AYNI anahtar + AYNI gövde). Cevap yalnız
 * `items[{chat_id,message_id}]`'dır: istemci kaynaktan yeni mesaj gövdesi KURMAZ, kaynak
 * gönderen/sohbet bilgisini kopyalamaz. Hedef sohbetlerin liste/ref/ek/sayaç okumaları
 * `query-keys` ilişkisiyle yenilenir (bağlam verilmez: hedefler birden çok sohbettir); açık
 * sohbetin mesaj penceresi olay içeriğiyle DEĞİL, gerçek `after` okumasıyla uzlaşır (pencere
 * tarafı çağıranda: `refreshOpenTarget`).
 */
import { api } from '@/shared/http'
import { useProtectedMutation } from '@/shared/http/mutation'

import type { ForwardChatMessageResult, ForwardInput } from '../model/types'
import { programHeaders } from './http'

export function useForwardChatMessage() {
  return useProtectedMutation<ForwardInput, ForwardChatMessageResult>({
    operation: 'forwardChatMessage',
    send: (vars, ctx) =>
      api.POST('/v1/chats/{chatId}/messages/{messageId}/forward', {
        params: {
          header: { ...programHeaders(vars), 'Idempotency-Key': ctx.idempotencyKey },
          path: { chatId: vars.chatId, messageId: vars.messageId },
        },
        body: vars.body,
        signal: ctx.signal,
      }),
  })
}
