/**
 * Gönderim gövdesi (E-10-59/60): metin düz; `mentions[]` / `refs[]` sunucu için yapılandırılmış
 * listedir (sunucu metni ayrıştırmaz, §10.8). Yalnız gövdede HÂLÂ geçen çipler gider (kullanıcı
 * çipi metinden sildiyse listeden de düşer). En çok 20 bahsetme, 10 referans. `@herkes` yalnız
 * yetkiliye (`allowAll`; sunucu da denetler).
 */
import type { SendChatMessageRequest } from '../../model/types'
import type { DraftChips } from './drafts'

export const MAX_MESSAGE_LENGTH = 5000
export const COUNTER_FROM = 4500
export const MAX_MENTIONS = 20
export const MAX_REFS = 10

export interface BuildBodyInput {
  body: string
  clientMessageId: string
  replyTo: string | null
  chips: DraftChips
  allowAll: boolean
}

export function buildSendBody(input: BuildBodyInput): SendChatMessageRequest {
  const text = input.body.trim()
  const seen = new Set<string>()
  const mentions = input.chips.mentions
    .filter(
      ({ token, mention }) => text.includes(token) && (input.allowAll || mention.kind !== 'all'),
    )
    .map(({ mention }) => mention)
    .filter((m) => {
      const key = `${m.kind}:${m.target_id ?? ''}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, MAX_MENTIONS)
  const refKeys = new Set<string>()
  const refs = input.chips.refs
    .filter(({ token }) => text.includes(token))
    .map(({ kind, targetId }) => ({ kind, target_id: targetId }))
    .filter((r) => {
      if (refKeys.has(r.target_id)) return false
      refKeys.add(r.target_id)
      return true
    })
    .slice(0, MAX_REFS)
  return {
    body: text,
    client_message_id: input.clientMessageId,
    ...(mentions.length > 0 ? { mentions } : {}),
    ...(refs.length > 0 ? { refs } : {}),
    ...(input.replyTo ? { reply_to_message_id: input.replyTo } : {}),
  }
}
