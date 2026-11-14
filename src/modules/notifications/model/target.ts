/**
 * Bildirim hedefi: `subject_ref.kind` → rota betimi (14 `mekanizma.md` §1). Modül `app/` rota
 * kataloğunu içe aktaramaz; panel `navigate(target)` olayını yayar, kabuk `routeLocation` ile
 * gider. K3 fan-out yasağı: satır başına `getWorkItem` YOK; çözülemeyen hedef 03/09b'nin kendi
 * bulunamadı akışına düşer (`work` modülü `?gorev=` kalıbı, P55). `membership` ve bilinmeyen
 * `kind`: gezinme yok (yalnız okundu).
 */
import type { NotificationItem } from './types'

export type NotificationTarget =
  | { route: 'work.tasks'; params: Record<string, never>; query: { gorev: string } }
  | { route: 'collaboration.meeting'; params: { meetingId: string }; query: Record<string, never> }
  | { route: 'home'; params: Record<string, never>; query: Record<string, never> }

/** Kimlik biçimi rota kataloğundaki `id` kuralıyla aynı (geçersiz kimlik gezinme üretmez). */
const ID_VALUE = /^[A-Za-z0-9_-]{1,128}$/

export function notificationTarget(
  item: Pick<NotificationItem, 'subject_ref'>,
): NotificationTarget | null {
  const { kind, id } = item.subject_ref
  if (kind === 'program_transfer') return { route: 'home', params: {}, query: {} }
  if (!ID_VALUE.test(id)) return null
  if (kind === 'work_item') return { route: 'work.tasks', params: {}, query: { gorev: id } }
  if (kind === 'meeting') {
    return { route: 'collaboration.meeting', params: { meetingId: id }, query: {} }
  }
  return null
}
