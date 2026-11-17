/**
 * Bildirim hedefi: `subject_ref.kind` → rota betimi (14 `mekanizma.md` §1; F9 BE-143). Modül
 * `app/` rota kataloğunu içe aktaramaz; panel `navigate(target)` olayını yayar, kabuk
 * `routeLocation` ile gider. K3 fan-out yasağı: satır başına `getWorkItem` YOK; çözülemeyen hedef
 * 03/09b'nin kendi bulunamadı akışına düşer (`work` modülü `?gorev=` kalıbı, P55).
 *  - `chat` (v0.25): `collaboration.chat` → `/mesajlar/:chatId`, `detail.seq` varsa `mesaj=<seq>` (mevcut
 *    `around` okuması açar); `seq` geçersizse yalnız konuşma açılır. Yeni sorgu adı yok.
 *  - `program` (günlük özet, v0.25): ana sayfa; program `subject_ref.id`.
 *  - `programId`: hedefin programı (`Notification.program_id`, üst düzey; özet satırında konunun
 *    kimliği). Seçili programdan ALAN TAHMİN EDİLMEZ: `null` ise kapsam değişmez. `membership` ve
 *    bilinmeyen `kind`: gezinme yok (yalnız okundu).
 */
import type { NotificationItem } from './types'

export type NotificationRoute =
  | { route: 'work.tasks'; params: Record<string, never>; query: { gorev: string } }
  | { route: 'collaboration.meeting'; params: { meetingId: string }; query: Record<string, never> }
  | { route: 'collaboration.chat'; params: { chatId: string }; query: { mesaj?: string } }
  | { route: 'home'; params: Record<string, never>; query: Record<string, never> }

export type NotificationTarget = NotificationRoute & { programId: string | null }

/** Kimlik biçimi rota kataloğundaki `id` kuralıyla aynı (geçersiz kimlik gezinme üretmez). */
const ID_VALUE = /^[A-Za-z0-9_-]{1,128}$/

type TargetInput = Pick<NotificationItem, 'subject_ref'> &
  Partial<Pick<NotificationItem, 'detail' | 'program_id'>>

/** `detail.seq` pozitif güvenli tam sayıysa mesaj hedefi (tek kaynak alan: yalnız `seq`). */
function chatSeq(item: TargetInput): string | null {
  const seq = item.detail?.seq
  return typeof seq === 'number' && Number.isSafeInteger(seq) && seq > 0 ? String(seq) : null
}

function routeOf(item: TargetInput): NotificationRoute | null {
  const { kind, id } = item.subject_ref
  if (kind === 'program_transfer') return { route: 'home', params: {}, query: {} }
  if (!ID_VALUE.test(id)) return null
  if (kind === 'work_item') return { route: 'work.tasks', params: {}, query: { gorev: id } }
  if (kind === 'meeting') {
    return { route: 'collaboration.meeting', params: { meetingId: id }, query: {} }
  }
  if (kind === 'program') return { route: 'home', params: {}, query: {} }
  if (kind === 'chat') {
    const seq = chatSeq(item)
    return { route: 'collaboration.chat', params: { chatId: id }, query: seq ? { mesaj: seq } : {} }
  }
  return null
}

export function notificationTarget(item: TargetInput): NotificationTarget | null {
  const route = routeOf(item)
  if (!route) return null
  const { kind, id } = item.subject_ref
  if (kind === 'program_transfer') return { ...route, programId: null }
  const programId = kind === 'program' ? id : (item.program_id ?? null)
  return { ...route, programId }
}
