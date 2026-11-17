/**
 * Satır cümlesi (ADR-0048, ADR-0052; BE-142/148/149/155): sunucu serbest metin döndürmez; cümle
 * `type` sözlüğü + `actor.full_name` + `subject` + `detail` + `group` kodlarından kurulur.
 *  - Aktör adı yoksa (`null`) genel cümle (`text`); ad UYDURULMAZ. Aktör konu maskesinden bağımsızdır.
 *  - Konu satırı yalnız `subject.state = available` iken başlık/kod taşır; `deleted` → "Bu kayıt silindi";
 *    `forbidden`/`unknown` → satır yok (başlık sızıntısı yok; `unknown` geçicidir, yeniden okunur).
 *  - Grup (`group.count ≥ 2`): tam bilinen küçük aktör listesinde "Ayşe ve 2 kişi …"; 5 tavanı ya da
 *    adsız aktör varsa "Ayşe ve diğerleri …" (kesin sayı uydurulmaz); kayıt sayısı metada.
 *  - Bilinmeyen `type` genel satıra düşer (sessiz düşürme yok); bilinmeyen `detail` alanı yok sayılır.
 */
import { notificationText, type NotificationTextKey } from '../messages'
import { describeNotification } from './dictionary'
import type { NotificationItem } from './types'

export interface RowSentence {
  label: string
  text: string
  /** İkinci satır: konu başlığı (+ kod) ya da "Bu kayıt silindi"; yok = çizilmez. */
  subject: string | null
  /** Üçüncü satır: `detail` kodlarından türeyen kısa bilgi. */
  detail: string | null
  /** Birleştirilmiş grup: kayıt sayısı (metada) ve yığın avatar adları (≤5). */
  groupCount: number | null
  avatars: readonly string[]
}

type Person = NonNullable<NotificationItem['actor']>
export interface SentenceContext {
  now: Date
  /** Biçimlendirici: kurulum saat diliminde "GG.AA.YYYY SS:dd". */
  fullTime: (iso: string) => string
}

const t = (id: string, field: string, params?: Record<string, string | number>) =>
  notificationText(`notifications.rows.types.${id}.${field}` as NotificationTextKey, params)
const row = (key: string, params?: Record<string, string | number>) =>
  notificationText(`notifications.rows.${key}` as NotificationTextKey, params)

const named = (person: Person | null | undefined): string | null =>
  person?.full_name?.trim() ? person.full_name.trim() : null

/** Sunucu en çok 5 tekil aktör döndürür; bu sayıya ulaşan liste kesilmiş olabilir. */
const ACTOR_CAP = 5

/**
 * "Ayşe ve 2 kişi" / "Ayşe ve diğerleri" / "Ayşe"; hiç ad yoksa `null`. Sayı yalnız liste TAM ve
 * bütün adlar biliniyorsa söylenir (`actors` < 5 ve hiçbiri `null`); aksi halde (5 tavanı ya da
 * adı çözülemeyen aktör) tekil aktör sayısı bilinmez, sayısız ifade kullanılır. `group.count`
 * olay sayısıdır, aktör sayısı olarak kullanılmaz.
 */
function actorPhrase(item: NotificationItem): string | null {
  const actors = item.group?.actors ?? []
  const names = actors.map(named).filter((n): n is string => n !== null)
  const first = names[0]
  if (first === undefined) return named(item.actor)
  if (actors.length === 1) return first
  const exact = actors.length < ACTOR_CAP && names.length === actors.length
  return exact
    ? row('groupOthers', { first, n: names.length - 1 })
    : row('groupOthersMore', { first })
}

function subjectLine(item: NotificationItem): string | null {
  const { state, title, code, person } = item.subject
  if (state === 'deleted') return row('subjectDeleted')
  if (state !== 'available' || !title) return null
  const personName = named(person)
  if (personName) return row('personLine', { person: personName, title })
  return code ? row('subjectLine', { code, title }) : title
}

function minutesUntil(iso: string, now: Date): number | null {
  const at = new Date(iso).getTime()
  return Number.isNaN(at) ? null : Math.ceil((at - now.getTime()) / 60_000)
}

function reminderText(item: NotificationItem, ctx: SentenceContext): string | null {
  const d = item.detail
  const left = d?.meeting_date ? minutesUntil(d.meeting_date, ctx.now) : null
  if (left !== null) {
    return left > 0 ? t('meeting_reminder', 'soon', { n: left }) : t('meeting_reminder', 'started')
  }
  return typeof d?.lead_minutes === 'number'
    ? t('meeting_reminder', 'lead', { n: d.lead_minutes })
    : null
}

/** Türe özgü kısa bilgi; yalnız sözleşmedeki `detail` alanlarından (kapalı kodlar). */
function detailLine(item: NotificationItem, ctx: SentenceContext): string | null {
  const d = item.detail
  if (!d) return null
  if (
    item.type === 'collaboration.meeting.rescheduled' &&
    d.meeting_date_from &&
    d.meeting_date_to
  ) {
    return row('changeTo', {
      from: ctx.fullTime(d.meeting_date_from),
      to: ctx.fullTime(d.meeting_date_to),
    })
  }
  if (
    item.type === 'work.digest.daily' &&
    typeof d.overdue_count === 'number' &&
    typeof d.due_soon_count === 'number'
  ) {
    return t('digest_daily', 'counts', { overdue: d.overdue_count, soon: d.due_soon_count })
  }
  return null
}

export function describeRow(item: NotificationItem, ctx: SentenceContext): RowSentence {
  const { entry } = describeNotification(item)
  const actor = actorPhrase(item)
  const reminder = item.type === 'collaboration.meeting.reminder' ? reminderText(item, ctx) : null
  const text = reminder ?? (actor ? t(entry.id, 'actorText', { actor }) : t(entry.id, 'text'))
  const group = item.group && item.group.count > 1 ? item.group : null
  return {
    label: t(entry.id, 'label'),
    text,
    subject: subjectLine(item),
    detail: detailLine(item, ctx),
    groupCount: group?.count ?? null,
    avatars: group
      ? group.actors
          .slice(0, 5)
          .map(named)
          .filter((n): n is string => n !== null)
      : [],
  }
}
