/**
 * `type` → etiket / cümle / simge / ton sözlüğü (14 `backend.md` §4.1; 12 tür). Yanıt metinsizdir
 * (K15/K29): aktör adı, konu başlığı, kod, tarih UYDURULMAZ; cümle yalnız türü söyler. Bilinmeyen
 * tür (yeni etiket) genel satıra düşer — sessiz düşürme yok. Metinler `trNotifications.rows`
 * ağacında; burada yalnız anahtar kimliği. Service worker (W159) sözlüğün ayrı bir kopyasını
 * taşır; eşleşme testi `dictionary.test.ts`'e W159 ekler.
 */
import type { IconName } from '@/shared/ui'

import type { NotificationItem } from './types'

/** Satır simge tonu (token karşılığı bileşende: accent-text, violet, r-koord, gold, ink-muted). */
export type NotificationTone = 'accent' | 'violet' | 'coord' | 'gold' | 'muted'

/** Satırdaki ek düğme (canlı olanlar). "Onayla/Reddet" BE-146 yüzünden statiktir (stubs.ts). */
export type NotificationAction = 'review' | 'agenda'

export interface DictionaryEntry {
  /** i18n kimliği: `notifications.rows.types.<id>.{label,text}`. */
  readonly id: string
  readonly subject: 'work_item' | 'meeting' | 'membership' | 'program_transfer' | 'unknown'
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
