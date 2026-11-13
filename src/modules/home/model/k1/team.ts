/**
 * K1 ekip yükü (E-K1-26…28, mekanizma §9.2): üye başına açık = devam + onayda + geciken + iade
 * (atanmış, tamamlanmamış); çubuk dilimi görev sayısı × %25 (kişi başı 4 görev = %100; tasarım
 * sabiti). Atanmamış görev kimsenin yüküne girmez. Sıra: açık azalan, eşitlikte ad.
 */
import { collator, isOpen, type WorkRow } from '../role/common'

export interface TeamMember {
  accountId: string
  fullName: string
  /** Koordinatör satırı mı (rol noktası). */
  coordinator: boolean
}

export interface LoadRow {
  member: TeamMember
  me: boolean
  doing: number
  review: number
  late: number
  back: number
  open: number
  /** Dilim genişlikleri, yüzde (0–100; toplam 100'ü aşmaz). */
  widths: { doing: number; review: number; late: number; back: number }
}

export const LOAD_FULL_TASKS = 4
const SLICE_PERCENT = 100 / LOAD_FULL_TASKS

type Slice = 'doing' | 'review' | 'late' | 'back' | null

/** Tek görevin bu kişi için dilimi: iade > geciken > onayda > devam; başlanmamış çizilmez. */
export function sliceOf(item: Pick<WorkRow, 'status' | 'is_overdue'>): Slice {
  if (item.status === 'iade_edildi') return 'back'
  if (item.is_overdue) return 'late'
  if (item.status === 'onaya_sunuldu') return 'review'
  if (item.status === 'devam_ediyor') return 'doing'
  return null
}

function widthsOf(c: { doing: number; review: number; late: number; back: number }) {
  const clamp = (n: number) => Math.min(100, n * SLICE_PERCENT)
  const widths = {
    doing: clamp(c.doing),
    review: clamp(c.review),
    late: clamp(c.late),
    back: clamp(c.back),
  }
  let used = 0
  for (const key of ['doing', 'review', 'late', 'back'] as const) {
    widths[key] = Math.min(widths[key], 100 - used)
    used += widths[key]
  }
  return widths
}

export function teamLoad(
  members: readonly TeamMember[],
  items: readonly WorkRow[],
  meId: string | null,
): LoadRow[] {
  const open = items.filter(isOpen)
  return members
    .map((member) => {
      const mine = open.filter((i) => i.assignee_account_ids.includes(member.accountId))
      const c = { doing: 0, review: 0, late: 0, back: 0 }
      for (const item of mine) {
        const slice = sliceOf(item)
        if (slice) c[slice] += 1
      }
      return {
        member,
        me: meId !== null && member.accountId === meId,
        ...c,
        open: c.doing + c.review + c.late + c.back,
        widths: widthsOf(c),
      }
    })
    .sort((a, b) => b.open - a.open || collator.compare(a.member.fullName, b.member.fullName))
}

/** Başlık: atanmış açık görev sayısı (tekil görev; birden çok kişiye atanan bir kez sayılır). */
export function assignedOpenCount(items: readonly WorkRow[]): number {
  return items.filter((i) => isOpen(i) && i.assignee_account_ids.length > 0).length
}
