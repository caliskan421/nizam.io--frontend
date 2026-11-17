/**
 * Konu sessize alma kapsamı (BE-156, NOTIFICATIONS-K44): yalnız `work_item` ve `meeting`; sohbetin
 * seviyesi `setChatNotificationLevel` ucundadır. Başka `kind`'da düğme yoktur.
 */
import type { MutableSubjectKind, NotificationItem } from './types'

export function muteKindOf(item: Pick<NotificationItem, 'subject_ref'>): MutableSubjectKind | null {
  const { kind } = item.subject_ref
  return kind === 'work_item' || kind === 'meeting' ? kind : null
}
