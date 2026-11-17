/**
 * Anket kartı sayıları (E-10-35, BE-161). Kendi oyum `results[].mine`'dandır (`voters`'tan aranmaz:
 * anonimde `voters` herkese `[]`). İsimli ankette oy veren sayısı `voters` birleşiminin tekil
 * sayısıdır (çoklu seçimde yüzde toplamı %100'ü aşabilir). Anonimde kişi sayısı `voters`'tan
 * türetilemez: tek seçimde her oy bir kişidir (Σ`count`); çoklu seçimde kişi sayısı bilinmez →
 * yüzde/"kişi oy verdi" gösterilmez, seçenek başına oy sayısı gösterilir (en büyük sayıya oranlı çubuk).
 */
import type { Poll } from '../../model/types'

export interface PollView {
  anonymous: boolean
  /** Seçili seçenekler (`mine`). */
  mine: ReadonlySet<number>
  /** Oy veren kişi sayısı; bilinmiyorsa `null` (anonim + çoklu seçim). */
  voters: number | null
  /** Seçenek yüzdesi; `voters` bilinmiyorsa `null`. */
  percent: (count: number) => number | null
  /** Çubuk genişliği (0–100). */
  bar: (count: number) => number
}

export function pollView(poll: Poll): PollView {
  const mine = new Set(poll.results.filter((r) => r.mine).map((r) => r.option_index))
  const total = poll.results.reduce((sum, r) => sum + r.count, 0)
  const largest = Math.max(0, ...poll.results.map((r) => r.count))
  let voters: number | null
  if (!poll.anonymous) {
    voters = new Set(poll.results.flatMap((r) => r.voters.map((v) => v.account_id))).size
  } else {
    voters = poll.multi ? null : total
  }
  const percent = (count: number): number | null =>
    voters === null ? null : voters === 0 ? 0 : Math.round((count / voters) * 100)
  const bar = (count: number): number => {
    const p = percent(count)
    if (p !== null) return Math.min(100, p)
    return largest === 0 ? 0 : Math.round((count / largest) * 100)
  }
  return { anonymous: poll.anonymous, mine, voters, percent, bar }
}
