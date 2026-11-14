/**
 * "Yazıyor" sinyali: yazarken en çok 1/3 sn; akış açık değilse sunucu olayı sessizce düşürür
 * (her zaman 204). Hata/ret yok sayılır (ucuz sinyal; kullanıcıya ileti yok).
 */
import { api } from '@/shared/http'
import { useProtectedMutation } from '@/shared/http/mutation'

import { createTypingThrottle } from '../model/typing'
import type { TypingInput } from '../model/types'
import { programHeaders } from './http'

export function useTypingSignal(now: () => number = Date.now) {
  const throttle = createTypingThrottle(undefined, now)
  const mutation = useProtectedMutation<TypingInput, void>({
    operation: 'sendChatTyping',
    send: (vars, ctx) =>
      api.POST('/v1/chats/{chatId}/typing', {
        params: { header: programHeaders(vars), path: { chatId: vars.chatId } },
        signal: ctx.signal,
      }),
  })
  /** Yazma alanı her tuşta çağırır; aralık dolmadan istek gitmez. */
  async function notify(target: TypingInput): Promise<boolean> {
    if (!throttle.take()) return false
    await mutation.submit(target)
    return true
  }
  return { notify, reset: () => throttle.reset() }
}
