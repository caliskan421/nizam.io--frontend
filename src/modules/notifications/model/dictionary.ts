/**
 * `type` → etiket / cümle / simge / ton sözlüğü (14 `backend.md` §4.1; 18 tür: 12 + F8 `work.task.reminder` + v0.25 `messaging.message.*`, `collaboration.meeting.reminder/.rescheduled`, `work.digest.daily`). Yanıt serbest metin
 * taşımaz (ADR-0048); cümleyi `model/sentence.ts` bu sözlüğün `type` girdisinden, `actor`/`subject`/
 * `detail`/`group` kapalı kodlarından kurar. `text` aktörsüz GENEL cümledir (push ve `forbidden`/`unknown`
 * satırı); aktör adı yoksa ya da konu görünmüyorsa başlık/ad UYDURULMAZ. Bilinmeyen
 * tür (yeni etiket) genel satıra düşer — sessiz düşürme yok. Metinler `trNotifications.rows`
 * ağacında; burada yalnız anahtar kimliği. Service worker (W159) sözlüğün ayrı bir kopyasını
 * taşır; eşleşme testi `dictionary.test.ts`'e W159 ekler.
 */
import type { IconName } from '@/shared/ui'

import type { NotificationItem } from './types'

/** Satır simge tonu (token karşılığı bileşende: accent-text, violet, r-koord, gold, ink-muted). */
export type NotificationTone = 'accent' | 'violet' | 'coord' | 'gold' | 'muted'

/** Satırdaki ek düğme (canlı olanlar). "Onayla/Reddet" `action` alanından kurulur (decision). */
export type NotificationAction = 'review' | 'agenda'

export interface DictionaryEntry {
  /** i18n kimliği: `notifications.rows.types.<id>.{label,text}`. */
  readonly id: string
  readonly subject:
    'work_item' | 'meeting' | 'membership' | 'program_transfer' | 'chat' | 'program' | 'unknown'
  readonly icon: IconName
  readonly tone: NotificationTone
  readonly action: NotificationAction | null
}

const entry = (
  id: string,
  subject: DictionaryEntry['subject'],
  icon: IconName,
  tone: NotificationTone,
  action: NotificationAction | null = null,
): DictionaryEntry => ({ id, subject, icon, tone, action })

export const NOTIFICATION_DICTIONARY: Readonly<Record<string, DictionaryEntry>> = {
  'work.item.created': entry('work_item_created', 'work_item', 'check', 'accent'),
  'work.item.transitioned': entry('work_item_transitioned', 'work_item', 'check', 'violet'),
  'work.item.assignment_changed': entry(
    'work_item_assignment_changed',
    'work_item',
    'user-plus',
    'coord',
  ),
  'work.item.date_changed': entry('work_item_date_changed', 'work_item', 'calendar', 'gold'),
  'work.date_change.requested': entry(
    'work_date_change_requested',
    'work_item',
    'calendar',
    'gold',
    'review',
  ),
  'work.date_change.reviewed': entry('work_date_change_reviewed', 'work_item', 'calendar', 'gold'),
  'work.task.reminder': entry('work_task_reminder', 'work_item', 'bell', 'gold'),
  'collaboration.meeting.created': entry(
    'meeting_created',
    'meeting',
    'meetings',
    'accent',
    'agenda',
  ),
  'collaboration.meeting.updated': entry(
    'meeting_updated',
    'meeting',
    'meetings',
    'accent',
    'agenda',
  ),
  'organization.membership.assigned': entry(
    'membership_assigned',
    'membership',
    'user-plus',
    'muted',
  ),
  'organization.membership.removed': entry(
    'membership_removed',
    'membership',
    'user-plus',
    'muted',
  ),
  'organization.membership.role_changed': entry(
    'membership_role_changed',
    'membership',
    'user-plus',
    'muted',
  ),
  'program.transfer.completed': entry('transfer_completed', 'program_transfer', 'bell', 'muted'),
  // v0.25 (BE-142/149): sohbet bildirimi (ADR-0050; mesaj metni yok) ve zamanlı/değişiklik olayları.
  'messaging.message.mentioned': entry('message_mentioned', 'chat', 'messages', 'violet'),
  'messaging.message.sent': entry('message_sent', 'chat', 'messages', 'accent'),
  'collaboration.meeting.reminder': entry('meeting_reminder', 'meeting', 'clock', 'gold', 'agenda'),
  'collaboration.meeting.rescheduled': entry(
    'meeting_rescheduled',
    'meeting',
    'calendar',
    'gold',
    'agenda',
  ),
  'work.digest.daily': entry('digest_daily', 'program', 'tasks', 'accent'),
}

export const KNOWN_NOTIFICATION_TYPES: readonly string[] = Object.keys(NOTIFICATION_DICTIONARY)

/** Sözlük dışı tür: "Yeni bildirim" + zil + `--ink-muted`; hedef yok (E-14-48). */
export const FALLBACK_ENTRY: DictionaryEntry = entry('unknown', 'unknown', 'bell', 'muted')

export function describeNotification(item: Pick<NotificationItem, 'type'>): {
  entry: DictionaryEntry
  known: boolean
} {
  const found = Object.hasOwn(NOTIFICATION_DICTIONARY, item.type)
    ? NOTIFICATION_DICTIONARY[item.type]
    : undefined
  return found ? { entry: found, known: true } : { entry: FALLBACK_ENTRY, known: false }
}
