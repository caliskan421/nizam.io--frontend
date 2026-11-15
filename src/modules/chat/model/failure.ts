/**
 * `messaging.*` hata kodları → sınıf + i18n anahtarı (10 `backend.md` §7; `error-codes.json`
 * `catalog_version` 1: 18 zarf kodu (pin v0.23.0-api `messaging.auto_group_protected` ekledi) +
 * `messaging.input_invalid` altındaki 4 alan kodu = 22).
 * Sunucu `message` alanı gösterilmez: metin `errors.<kod>` anahtarından gelir (`errorText`).
 * `effect` ekranın uyguladığı davranıştır (liste tazele, sohbeti kapat …); karar bileşenindir.
 */
export type ChatFailureClass =
  /** Kaynak yok/erişilemez: sohbet kapanır ya da yerel kayıt kaldırılır. */
  | 'gone'
  /** Yetki yok (gizleme güvenlik değildir; K6 yetki yenileme). */
  | 'forbidden'
  /** Çakışma: güncel durum okunur, kullanıcı karar verir. */
  | 'conflict'
  /** Alan hatası: alan altı ileti. */
  | 'field'
  /** İstemci hatası/programlama: genel ileti. */
  | 'client'
  /** Silinmiş iş: yeni kimlik ÜRETİLMEZ ya da yeni anahtarla kullanıcı eylemi. */
  | 'deleted'
  /** Liste imleci bozuk: atılır, baştan okunur. */
  | 'cursor'

export type ChatFailureEffect =
  | 'close_chat'
  | 'drop_local_message'
  | 'reread_message'
  | 'refresh_members'
  | 'keep_draft'
  | 'reset_cursor'
  | 'refresh_authority'
  | 'mark_card_gone'
  | 'mark_poll_closed'
  | 'field_error'
  | 'generic'

export interface ChatFailure {
  class: ChatFailureClass
  /** `errors.<kod>` (vue-i18n); `field` alan kodlarında üst kodun anahtarı. */
  messageKey: string
  effect: ChatFailureEffect
}

const f = (cls: ChatFailureClass, code: string, effect: ChatFailureEffect): ChatFailure => ({
  class: cls,
  messageKey: `errors.${code}`,
  effect,
})

export const CHAT_FAILURES: Readonly<Record<string, ChatFailure>> = {
  'messaging.auto_group_protected': f('conflict', 'messaging.auto_group_protected', 'generic'),
  'messaging.chat_deleted': f('deleted', 'messaging.chat_deleted', 'generic'),
  'messaging.chat_not_found': f('gone', 'messaging.chat_not_found', 'close_chat'),
  'messaging.edit_conflict': f('conflict', 'messaging.edit_conflict', 'reread_message'),
  'messaging.file_rejected': f('field', 'messaging.file_rejected', 'field_error'),
  'messaging.file_too_large': f('field', 'messaging.file_too_large', 'field_error'),
  'messaging.idempotency_key_reused': f('client', 'messaging.idempotency_key_reused', 'generic'),
  'messaging.input_invalid': f('field', 'messaging.input_invalid', 'field_error'),
  'messaging.invalid_cursor': f('cursor', 'messaging.invalid_cursor', 'reset_cursor'),
  'messaging.member_not_found': f('gone', 'messaging.member_not_found', 'refresh_members'),
  'messaging.member_source_managed': f('conflict', 'messaging.member_source_managed', 'generic'),
  'messaging.message_deleted': f('deleted', 'messaging.message_deleted', 'keep_draft'),
  'messaging.message_not_found': f('gone', 'messaging.message_not_found', 'drop_local_message'),
  'messaging.not_authorized': f('forbidden', 'messaging.not_authorized', 'refresh_authority'),
  'messaging.poll_closed': f('conflict', 'messaging.poll_closed', 'mark_poll_closed'),
  'messaging.ref_not_found': f('gone', 'messaging.ref_not_found', 'mark_card_gone'),
  'messaging.scope_invalid': f('forbidden', 'messaging.scope_invalid', 'refresh_authority'),
  'messaging.task_deleted': f('deleted', 'messaging.task_deleted', 'generic'),
  // `messaging.input_invalid` alan kodları (fields[]): istemci hatası, genel ileti.
  'messaging.request_key_required': f('client', 'messaging.request_key_required', 'generic'),
  'messaging.request_key_invalid': f('client', 'messaging.request_key_invalid', 'generic'),
  'messaging.revision_required': f('client', 'messaging.revision_required', 'generic'),
  'messaging.revision_invalid': f('client', 'messaging.revision_invalid', 'generic'),
}

export function chatFailure(code: string): ChatFailure | null {
  return Object.hasOwn(CHAT_FAILURES, code) ? (CHAT_FAILURES[code] ?? null) : null
}
