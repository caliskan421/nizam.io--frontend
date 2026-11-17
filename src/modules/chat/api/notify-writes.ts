/**
 * Sohbet bildirim seviyesi (BE-027 ayar yüzü): `setChatNotificationLevel` PUT `{level}` (S2, CSRF,
 * anahtarsız, idempotent). Başarıda liste + ayrıntı yeniden okunur (`query-keys.ts` ilişkisi);
 * seviye yalnız `Chat.notify_level`'dan okunur, okunmamış sayacı seviyeden bağımsızdır (K46/K54).
 */
import { api } from '@/shared/http'
import { useProtectedMutation } from '@/shared/http/mutation'

import type { ChatNotificationLevelBody, SetNotificationLevelInput } from '../model/shared-types'
import { programHeaders } from './http'

export function useSetChatNotificationLevel() {
  return useProtectedMutation<SetNotificationLevelInput, ChatNotificationLevelBody>({
    operation: 'setChatNotificationLevel',
    send: (vars, ctx) =>
      api.PUT('/v1/chats/{chatId}/notification-level', {
        params: { header: programHeaders(vars), path: { chatId: vars.chatId } },
        body: { level: vars.level },
        signal: ctx.signal,
      }),
    invalidation: (vars) => ({ chatId: vars.chatId }),
  })
}
