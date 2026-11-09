/**
 * 05b Kişisel takip — saf türetimler (05 `backend.md` §4, `mekanizma.md` §5; kabul E-05-49…75).
 * Girdi YALNIZ kişinin görev kümesidir (`usePersonWorkItems`: program geneli tek liste ∩
 * `assignedSubset`, KESİN 21); kartlar, sekme sayacı, liste başlığı, tablo, takvim ve dağılım
 * aynı kümeden türetilir — burada ikinci bir atanan süzmesi yoktur.
 *
 *  - Açık = `status ≠ tamamlandi` (`iade_edildi` açık sayılır, G2); Gecikmede = açık ∧
 *    `is_overdue` (sunucu; tamamlanmış geç görev sayılmaz, G3); Onay bekleyen =
 *    `onaya_sunuldu`; Tamamlanma % = tamamlandı / toplam; zamanında = açık − geciken.
 *  - "Gün gecikti" sunucu `days_overdue`; yalnız "gün kaldı" istemcide (`end_on − bugün`).
 *    Bugün Europe/Istanbul takvim günüdür (kurulum saat dilimi; 03 `backend.md` §4).
 *  - Gruplar: "Son tarihe göre" Gecikmede (`is_overdue`) → Bu hafta (`end_on` ≤ bu haftanın
 *    pazarı; hafta pazartesi–pazar) → Sonra; "Duruma göre" 5 durum (P5). Grup içi bitiş artan.
 *  - Takvim ve dağılım yalnız AÇIK görevler (E-05-71, E-05-74; `iade_edildi` ayrı dilim).
 */
import { WORK_ITEM_STATUSES, type WorkItem, type WorkItemStatus } from '@/modules/work/public'
import type { IconName } from '@/shared/ui'

import type { USER_CARDS, USER_GROUPINGS } from '../../routes'
import { trackingText } from './messages'

export type TrackingCard = (typeof USER_CARDS)[number]
export type TrackingGrouping = (typeof USER_GROUPINGS)[number]

/** Türetimlerin okuduğu görev alanları. */
export type TrackingItem = Pick<
  WorkItem,
  'work_item_id' | 'department_id' | 'title' | 'status' | 'end_on' | 'is_overdue' | 'days_overdue'
>

// --- Tarih ------------------------------------------------------------------------------------

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/
const ISO_MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/
const DAY_MS = 86_400_000

const istanbulDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Istanbul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Europe/Istanbul takvim günü (`YYYY-MM-DD`). */
export function istanbulToday(now: Date = new Date()): string {
  return istanbulDay.format(now)
}

function dayParts(day: string): [number, number, number] | null {
  const match = ISO_DAY.exec(day)
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null
}

function utc(day: string): number | null {
  const p = dayParts(day)
  return p ? Date.UTC(p[0], p[1] - 1, p[2]) : null
}

function isoOf(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/** `to − from` takvim günü; biçimsiz girdide `null`. */
export function daysBetween(from: string, to: string): number | null {
  const a = utc(from)
  const b = utc(to)
  return a === null || b === null ? null : Math.round((b - a) / DAY_MS)
}

/** `GG.AA.YYYY` (E-05-65); biçimsiz değer olduğu gibi. */
export function formatDay(day: string): string {
  const p = dayParts(day)
  if (!p) return day
  return `${String(p[2]).padStart(2, '0')}.${String(p[1]).padStart(2, '0')}.${p[0]}`
}

/** Bugünün haftası (pazartesi–pazar; E-05-57 sınır kuralı). */
export function weekBounds(today: string): { start: string; end: string } | null {
  const t = utc(today)
  if (t === null) return null
  const offset = (new Date(t).getUTCDay() + 6) % 7
  return { start: isoOf(t - offset * DAY_MS), end: isoOf(t + (6 - offset) * DAY_MS) }
}

/** Takvim ayı `YYYY-MM` geçerli mi (URL `ay`). */
export function isMonth(value: unknown): value is string {
  return typeof value === 'string' && ISO_MONTH.test(value)
}

export function monthOf(day: string): string {
  return day.slice(0, 7)
}

/** Ay kaydırma (`-1` önceki, `+1` sonraki). */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number) as [number, number]
  const index = y * 12 + (m - 1) + delta
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}

export function monthName(month: string): string {
  const m = Number(month.slice(5, 7))
  return trackingText(
    `organization.tracking.calendar.months.m${m}` as 'organization.tracking.calendar.months.m1',
  )
}

// --- Sayım ve kartlar (E-05-49…52) -------------------------------------------------------------

export interface TrackingCounts {
  total: number
  completed: number
  open: number
  overdue: number
  pending: number
}

export const isOpen = (item: Pick<TrackingItem, 'status'>) => item.status !== 'tamamlandi'
const isLate = (item: Pick<TrackingItem, 'status' | 'is_overdue'>) =>
  isOpen(item) && item.is_overdue

export function trackingCounts(items: readonly TrackingItem[]): TrackingCounts {
  const counts: TrackingCounts = { total: 0, completed: 0, open: 0, overdue: 0, pending: 0 }
  for (const item of items) {
    counts.total += 1
    if (!isOpen(item)) {
      counts.completed += 1
      continue
    }
    counts.open += 1
    if (item.is_overdue) counts.overdue += 1
    if (item.status === 'onaya_sunuldu') counts.pending += 1
  }
  return counts
}

const CARD_FILTERS: Readonly<Record<TrackingCard, (item: TrackingItem) => boolean>> = {
  tamamlanan: (item) => !isOpen(item),
  acik: isOpen,
  geciken: isLate,
  onayda: (item) => item.status === 'onaya_sunuldu',
}

/** Seçili kartın satırları (E-05-50 varsayılan `acik`; liste başlığı ve sekme sayacı da bu). */
export function cardItems<T extends TrackingItem>(items: readonly T[], card: TrackingCard): T[] {
  return items.filter(CARD_FILTERS[card])
}

/** Yuvarlanmış yüzde; payda 0 → 0. */
export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((part / whole) * 100)))
}

export type CardTone = 'accent' | 'violet' | 'danger' | 'gold'

export interface CardView {
  key: TrackingCard
  label: string
  value: string
  /** `null` → not satırı çizilmez (E-05-52). */
  note: string | null
  /** Çubuk doluluğu 0–100. */
  bar: number
  tone: CardTone
  icon: IconName
  danger: boolean
  title: string
}

const number = new Intl.NumberFormat('tr-TR')
const fmt = (n: number) => number.format(n)

const t = trackingText

function completionCard(c: TrackingCounts): CardView {
  const done = percent(c.completed, c.total)
  return {
    key: 'tamamlanan',
    label: t('organization.tracking.cards.completion'),
    value: t('organization.tracking.cards.completionValue', { p: done }),
    note:
      c.total === 0
        ? t('organization.tracking.cards.noTasks')
        : t('organization.tracking.cards.completionNote', {
            total: fmt(c.total),
            done: fmt(c.completed),
            suffix: possessiveSuffix(c.completed),
          }),
    bar: done,
    tone: 'accent',
    icon: 'check',
    danger: false,
    title: t('organization.tracking.cards.title.tamamlanan'),
  }
}

function openCard(c: TrackingCounts): CardView {
  return {
    key: 'acik',
    label: t('organization.tracking.cards.open'),
    value: fmt(c.open),
    note:
      c.total === 0
        ? t('organization.tracking.cards.noTasks')
        : t('organization.tracking.cards.openNote', { n: fmt(Math.max(0, c.open - c.overdue)) }),
    bar: percent(c.open, c.total),
    tone: 'violet',
    icon: 'bolt',
    danger: false,
    title: t('organization.tracking.cards.title.acik'),
  }
}

function overdueCard(c: TrackingCounts): CardView {
  const late = percent(c.overdue, c.open)
  return {
    key: 'geciken',
    label: t('organization.tracking.cards.overdue'),
    value: fmt(c.overdue),
    note:
      c.open === 0
        ? t(
            c.total === 0
              ? 'organization.tracking.cards.noTasks'
              : 'organization.tracking.cards.noOpen',
          )
        : t('organization.tracking.cards.overdueNote', { q: late, suffix: possessiveSuffix(late) }),
    bar: late,
    tone: 'danger',
    icon: 'alert',
    danger: true,
    title: t('organization.tracking.cards.title.geciken'),
  }
}

/** E-05-52: not satırı boş ("Kanıt yüklendi…" yazılmaz). */
function pendingCard(c: TrackingCounts): CardView {
  return {
    key: 'onayda',
    label: t('organization.tracking.cards.pending'),
    value: fmt(c.pending),
    note: null,
    bar: percent(c.pending, c.open),
    tone: 'gold',
    icon: 'clock',
    danger: false,
    title: t('organization.tracking.cards.title.onayda'),
  }
}

/** Dört kart, tasarım sırasıyla (E-05-49…52). */
export function cardViews(c: TrackingCounts): CardView[] {
  return [completionCard(c), openCard(c), overdueCard(c), pendingCard(c)]
}

// --- Tablo (E-05-57…66) -------------------------------------------------------------------------

/** Durum noktası sınıf eki (`rp-dot--*`; `iade_edildi` = `back`, P5). */
export const STATUS_DOT: Readonly<Record<WorkItemStatus, string>> = {
  baslanmadi: 'todo',
  devam_ediyor: 'doing',
  onaya_sunuldu: 'review',
  iade_edildi: 'back',
  tamamlandi: 'done',
}

export function statusLabel(status: WorkItemStatus): string {
  return trackingText(`organization.tracking.table.status.${status}`)
}

export interface DueNote {
  text: string
  tone: 'danger' | 'faint'
}

/** E-05-65: gecikmiş (sunucu) / kalan (istemci) / tamamlanmış ya da geçmiş (yok). */
export function dueNote(item: TrackingItem, today: string): DueNote | null {
  if (!isOpen(item)) return null
  if (item.is_overdue) {
    return {
      text: trackingText('organization.tracking.table.overdue', { n: item.days_overdue }),
      tone: 'danger',
    }
  }
  const left = daysBetween(today, item.end_on)
  if (left === null || left < 0) return null
  return { text: trackingText('organization.tracking.table.remaining', { n: left }), tone: 'faint' }
}

export type GroupTone = 'danger' | 'ink' | 'muted'

export interface RowGroup<T> {
  key: string
  name: string
  tone: GroupTone
  rows: T[]
}

const collator = new Intl.Collator('tr-TR', { sensitivity: 'base' })

function byDue<T extends TrackingItem>(a: T, b: T): number {
  if (a.end_on !== b.end_on) return a.end_on < b.end_on ? -1 : 1
  return collator.compare(a.title, b.title)
}

/** Gruplu satırlar; boş grup çizilmez. */
export function groupRows<T extends TrackingItem>(
  items: readonly T[],
  grouping: TrackingGrouping,
  today: string,
): RowGroup<T>[] {
  const sorted = [...items].sort(byDue)
  if (grouping === 'durum') {
    const byStatus: RowGroup<T>[] = WORK_ITEM_STATUSES.map((status) => ({
      key: status,
      name: statusLabel(status),
      tone: 'muted',
      rows: sorted.filter((item) => item.status === status),
    }))
    return byStatus.filter((g) => g.rows.length > 0)
  }
  const weekEnd = weekBounds(today)?.end ?? today
  const groups: RowGroup<T>[] = [
    {
      key: 'overdue',
      name: trackingText('organization.tracking.table.group.overdue'),
      tone: 'danger',
      rows: [],
    },
    {
      key: 'thisWeek',
      name: trackingText('organization.tracking.table.group.thisWeek'),
      tone: 'ink',
      rows: [],
    },
    {
      key: 'later',
      name: trackingText('organization.tracking.table.group.later'),
      tone: 'muted',
      rows: [],
    },
  ]
  for (const item of sorted) {
    const index = isLate(item) ? 0 : item.end_on <= weekEnd ? 1 : 2
    groups[index]!.rows.push(item)
  }
  return groups.filter((g) => g.rows.length > 0)
}

// --- Takvim (E-05-68…72) ------------------------------------------------------------------------

export type DueKind = 'late' | 'soon'

export interface CalendarCell {
  /** Ay dışı boş hücrede `null`. */
  day: number | null
  kind: DueKind | null
  today: boolean
  past: boolean
  label: string
}

/** Pazartesi başlayan haftalar (7'şerli satırlar); açık görevlerin `end_on` günleri işaretli. */
export function calendarWeeks(
  month: string,
  items: readonly TrackingItem[],
  today: string,
): CalendarCell[][] {
  const [y, m] = month.split('-').map(Number) as [number, number]
  const first = Date.UTC(y, m - 1, 1)
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const lead = (new Date(first).getUTCDay() + 6) % 7
  const kinds = new Map<number, DueKind>()
  for (const item of items) {
    if (!isOpen(item) || monthOf(item.end_on) !== month) continue
    const day = Number(item.end_on.slice(8, 10))
    if (item.is_overdue) kinds.set(day, 'late')
    else if (!kinds.has(day)) kinds.set(day, 'soon')
  }
  const name = monthName(month)
  const blank = (): CalendarCell => ({
    day: null,
    kind: null,
    today: false,
    past: false,
    label: '',
  })
  const cells: CalendarCell[] = Array.from({ length: lead }, blank)
  for (let day = 1; day <= days; day += 1) {
    const iso = `${month}-${String(day).padStart(2, '0')}`
    const kind = kinds.get(day) ?? null
    const suffix = kind === null ? '' : trackingText(`organization.tracking.calendar.${kind}`)
    cells.push({
      day,
      kind,
      today: iso === today,
      past: iso < today,
      label: trackingText('organization.tracking.calendar.day', { day, month: name }) + suffix,
    })
  }
  while (cells.length % 7 !== 0) cells.push(blank())
  const weeks: CalendarCell[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

// --- Durum dağılımı (E-05-73…75) ----------------------------------------------------------------

/** Açık görevlerin dört durumu (P5: `iade_edildi` ayrı dilim, gizlenmez). */
export const OPEN_STATUSES = [
  'baslanmadi',
  'devam_ediyor',
  'onaya_sunuldu',
  'iade_edildi',
] as const satisfies readonly WorkItemStatus[]
export type OpenStatus = (typeof OPEN_STATUSES)[number]

export interface DistributionSlice {
  status: OpenStatus
  count: number
  /** Dilim genişliği 0–100. */
  share: number
}

export function distribution(items: readonly TrackingItem[]): {
  total: number
  slices: DistributionSlice[]
  label: string
} {
  const counts = new Map<WorkItemStatus, number>()
  for (const item of items) counts.set(item.status, (counts.get(item.status) ?? 0) + 1)
  const total = OPEN_STATUSES.reduce((sum, s) => sum + (counts.get(s) ?? 0), 0)
  const slices = OPEN_STATUSES.map((status) => {
    const count = counts.get(status) ?? 0
    return { status, count, share: percent(count, total) }
  })
  const parts = slices
    .map((s) => trackingText(`organization.tracking.distribution.part.${s.status}`, { n: s.count }))
    .join(', ')
  return {
    total,
    slices,
    label: trackingText('organization.tracking.distribution.aria', { n: total, parts }),
  }
}

// --- Türkçe ek -----------------------------------------------------------------------------------

const ONES = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz']
const TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan']
const SCALES: ReadonlyArray<[number, string]> = [
  [1_000_000_000, 'milyar'],
  [1_000_000, 'milyon'],
  [1_000, 'bin'],
  [100, 'yüz'],
]
const BACK_VOWELS = new Set(['a', 'ı', 'o', 'u'])
const ROUNDED = new Set(['o', 'u', 'ö', 'ü'])
const VOWELS = new Set(['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü'])

function lastSpokenWord(value: number): string {
  const n = Math.floor(Math.abs(value))
  if (n === 0) return 'sıfır'
  if (n % 10 !== 0) return ONES[n % 10]!
  if (n % 100 !== 0) return TENS[(n % 100) / 10]!
  for (const [unit, word] of SCALES) if (n % unit === 0) return word
  return 'yüz'
}

/**
 * Sayıya eklenecek 3. tekil iyelik eki ("9 görevin 0’ı bitti", "Açık görevlerin %44’ü"): sayının
 * okunuşunun son sözcüğüne göre dört yönlü ünlü uyumu; ünlüyle bitende kaynaştırma `s`.
 */
export function possessiveSuffix(value: number): string {
  const word = lastSpokenWord(value)
  const last = [...word].reverse().find((ch) => VOWELS.has(ch)) ?? 'i'
  const back = BACK_VOWELS.has(last)
  const vowel = ROUNDED.has(last) ? (back ? 'u' : 'ü') : back ? 'ı' : 'i'
  return `’${VOWELS.has(word.at(-1) ?? '') ? 's' : ''}${vowel}`
}
