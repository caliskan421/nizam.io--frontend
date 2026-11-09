/**
 * 08 kartının saf görünüm kuralları (README kabul tablosu E-08-28, E-08-32, E-08-37; yapı sağlığı
 * E-08-11 aynı "sessiz" tanımını kullanır). Girdi yalnız `CoordinatorshipView` ve "şimdi"dir;
 * sahte veri üretilmez (ortak-kurallar §4).
 *
 *  - Kod rozeti: `code`; kodsuz birimde programdaki adın baş harfleri (gösterim kuralı, stub değil).
 *  - Koordinatör yığını: en çok 3 avatar; satır "‹ilk koordinatör› +n" ya da tek ad.
 *  - Durum bayrağı önceliği: koordinatörsüz > sessiz > normal. Sessiz = `last_activity_at` yok ya
 *    da 30 günden eski (alan görev hareketidir; "dosya" metni yazılmaz — BE-018).
 */
import type { CoordinatorshipView } from '../../model/types'
import { coordsText } from './messages'

export const QUIET_DAYS = 30
export const MAX_LEAD_AVATARS = 3
const DAY_MS = 86_400_000

/** İlk iki sözcüğün ilk harfleri, `tr-TR` büyük harf (UiAvatar kuralı). */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toLocaleUpperCase('tr-TR')
}

/** E-08-28: rozet metni. */
export function codeBadge(view: Pick<CoordinatorshipView, 'code' | 'displayName'>): string {
  return view.code ?? initialsOf(view.displayName)
}

/** Son görev hareketinden bu yana geçen tam gün; tarih yok/bozuksa `null`. */
export function daysSince(iso: string | null | undefined, now: number): number | null {
  if (!iso) return null
  const at = Date.parse(iso)
  if (Number.isNaN(at)) return null
  return Math.max(0, Math.floor((now - at) / DAY_MS))
}

/** E-08-11 / E-08-37: görev hareketi yok ya da 30 günden eski. */
export function isQuiet(iso: string | null | undefined, now: number): boolean {
  const days = daysSince(iso, now)
  return days === null || days > QUIET_DAYS
}

/** Göreli zaman: "bugün", "dün", "‹n› gün önce". */
export function relativeDays(days: number): string {
  if (days <= 0) return coordsText('coordinatorships.card.today')
  if (days === 1) return coordsText('coordinatorships.card.yesterday')
  return coordsText('coordinatorships.card.daysAgo', { n: days })
}

export interface LeadView {
  accountId: string
  fullName: string
  initials: string
}

/** E-08-32: avatarlar (en çok 3) ve yan satır. Rapor satırı yoksa `null`. */
export function leadsOf(view: CoordinatorshipView): { avatars: LeadView[]; line: string } | null {
  const coordinators = view.stat?.coordinators
  if (!coordinators || coordinators.length === 0) return null
  const avatars = coordinators.slice(0, MAX_LEAD_AVATARS).map((p) => ({
    accountId: p.account_id,
    fullName: p.full_name,
    initials: initialsOf(p.full_name),
  }))
  const first = coordinators[0]!.full_name
  const line =
    coordinators.length > 1
      ? coordsText('coordinatorships.card.leadMore', { name: first, n: coordinators.length - 1 })
      : first
  return { avatars, line }
}

export type FlagTone = 'gold' | 'danger' | 'muted'

export interface CardFlag {
  kind: 'unknown' | 'no-lead' | 'quiet' | 'active'
  text: string
  tone: FlagTone
}

/** E-08-37 durum bayrağı (öncelik: koordinatörsüz > sessiz > normal). */
export function flagOf(view: CoordinatorshipView, now: number): CardFlag {
  const stat = view.stat
  if (!stat) {
    return { kind: 'unknown', text: coordsText('coordinatorships.card.noStats'), tone: 'muted' }
  }
  if (stat.coordinators.length === 0) {
    return { kind: 'no-lead', text: coordsText('coordinatorships.card.noLead'), tone: 'gold' }
  }
  const days = daysSince(stat.last_activity_at, now)
  if (days === null) {
    return { kind: 'quiet', text: coordsText('coordinatorships.card.never'), tone: 'danger' }
  }
  const when = relativeDays(days)
  return days > QUIET_DAYS
    ? { kind: 'quiet', text: coordsText('coordinatorships.card.quiet', { when }), tone: 'danger' }
    : { kind: 'active', text: coordsText('coordinatorships.card.active', { when }), tone: 'muted' }
}
