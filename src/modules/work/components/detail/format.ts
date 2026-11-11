/**
 * Ayrıntı paneli saf türetimleri (E-03-41, E-03-46…51). Tarih günleri (`start_on`, `end_on`,
 * `completed_on`) takvim günüdür (`YYYY-AA-GG`), saat dilimine çevrilmez; anlar (`created_at`)
 * kurulum saat diliminde güne indirilir (ana sayfa `today.ts` ile aynı ilke). Biçim dışı değer
 * gösterilmez (uydurma yok).
 */
import { workShortCode } from '../../model/short-code'

import type { WorkItem, WorkItemStatus } from '../../model/types'
import { detailText } from './messages'

/** Kurulum profili gelmeden kullanılan saat dilimi (03 README E-03-25: Europe/Istanbul). */
export const FALLBACK_TIME_ZONE = 'Europe/Istanbul'

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/

interface DayParts {
  year: string
  month: string
  day: string
}

function dayParts(day: string | null | undefined): DayParts | null {
  const match = day ? DAY.exec(day) : null
  if (!match) return null
  const [, year, month, day2] = match
  return year && month && day2 ? { year, month, day: day2 } : null
}

/** `YYYY-AA-GG` → `GG.AA.YYYY` (E-03-48/49). */
export function formatDay(day: string | null | undefined): string | null {
  const p = dayParts(day)
  return p ? `${p.day}.${p.month}.${p.year}` : null
}

/** Tarih aralığı (E-03-49): aynı yılda "GG.AA → GG.AA.YYYY", aksi hâlde iki tam tarih. */
export function formatRange(start: string, end: string): string | null {
  const s = dayParts(start)
  const e = dayParts(end)
  if (!s || !e) return null
  const head = s.year === e.year ? `${s.day}.${s.month}` : `${s.day}.${s.month}.${s.year}`
  return `${head} → ${e.day}.${e.month}.${e.year}`
}

/** Anın kurulum saat dilimindeki günü (`YYYY-AA-GG`); geçersiz an ya da dilimde `null`. */
export function instantDay(iso: string, timeZone: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  try {
    // en-CA biçimi YYYY-AA-GG verir.
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  } catch {
    return null
  }
}

/** Zaman çizgisi kısa tarihi: "10 Haz" (tasarım `rp-timeline`). */
export function shortDay(day: string | null | undefined): string | null {
  const p = dayParts(day)
  if (!p) return null
  const date = new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)))
  const parts = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
  }).formatToParts(date)
  const value = (type: 'day' | 'month') => parts.find((part) => part.type === type)?.value
  return `${value('day')} ${value('month')}`
}

/** Kişi adı; sunucu `null` döndürürse "Bilinmeyen kişi" (E-03-27/46/47). */
export function personName(fullName: string | null | undefined): string {
  return fullName ?? detailText('workDetail.summary.unknownPerson')
}

/**
 * Üst bilgi "‹kod› · ‹koordinatörlük›" (E-03-41). Kod öneki `ProgramDepartment.code` (yoksa
 * gösterilmez); görev sıra numarası sözleşmede yok → statik "—" (BE-005, E-03-20 ile aynı).
 */
export function kickerText(
  code: string | null | undefined,
  departmentName: string | null | undefined,
): string {
  const parts: string[] = []
  if (code) parts.push(workShortCode(code))
  if (departmentName) parts.push(departmentName)
  return parts.join(' · ')
}

export type StatusDot = 'todo' | 'doing' | 'review' | 'back' | 'done'

/** Durum → `rp-dot--*` (E-03-23; `iade_edildi` = "Geri gönderildi" `rp-dot--back`, P5). */
export const STATUS_DOT: Readonly<Record<WorkItemStatus, StatusDot>> = {
  baslanmadi: 'todo',
  devam_ediyor: 'doing',
  onaya_sunuldu: 'review',
  iade_edildi: 'back',
  tamamlandi: 'done',
}

export type TimelineKey = 'created' | 'start' | 'endPassed' | 'overdue' | 'completed'

export interface TimelineEvent {
  key: TimelineKey
  text: string
  /** Kısa tarih ("10 Haz") ya da "bugün". */
  when: string
  tone: 'done' | 'doing' | 'late'
  /** Kırmızı, kalın satır (gecikme). */
  alert: boolean
}

type TimelineFields = Pick<
  WorkItem,
  'created_at' | 'start_on' | 'end_on' | 'is_overdue' | 'days_overdue' | 'completed_on'
>

/**
 * İlerleme çizgisi (E-03-51): YALNIZ görevin tarih alanlarından türetilen olaylar (`backend.md`
 * §1 son satır). Durum geçişi, atama, dosya olayları yoktur (BE-007 audit); sahte olay üretilmez.
 * Gecikme sunucu bayrağından (`is_overdue`, `days_overdue`), istemci tarih hesabı yapmaz.
 */
export function timelineEvents(item: TimelineFields, timeZone: string): TimelineEvent[] {
  const t = (key: `workDetail.timeline.${TimelineKey}`, n = 0) => detailText(key, { n })
  const events: TimelineEvent[] = []
  const push = (
    key: TimelineKey,
    when: string | null,
    tone: TimelineEvent['tone'],
    alert = false,
  ) => {
    if (when)
      events.push({
        key,
        text: t(`workDetail.timeline.${key}`, item.days_overdue),
        when,
        tone,
        alert,
      })
  }
  push('created', shortDay(instantDay(item.created_at, timeZone)), 'done')
  push('start', shortDay(item.start_on), 'doing')
  if (item.is_overdue) {
    push('endPassed', shortDay(item.end_on), 'late')
    if (item.days_overdue > 0)
      push('overdue', detailText('workDetail.timeline.today'), 'late', true)
  }
  push('completed', shortDay(item.completed_on), 'done')
  return events
}
