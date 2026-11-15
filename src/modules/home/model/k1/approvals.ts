/**
 * Onay kartı alt yazısı (E-K1-15; BE-137): "Kanıt yüklendi" iddiası yalnız listelenen HER onay
 * satırında `file_count > 0` iken kurulur (görev başına dosya listesi okunmaz); "en eskisi" en eski
 * `submitted_at`'tir (eski gönderimde null → yok sayılır, zaman uydurulmaz).
 */
import { agoText } from '../role/ago'
import { homeText } from '../messages'
import type { WorkRow } from '../role/common'

export function approvalsNote(items: readonly WorkRow[], now: Date, timeZone: string): string {
  const evidence = items.length > 0 && items.every((i) => i.file_count > 0)
  const base = homeText(evidence ? 'home.k1.approvals.noteEvidence' : 'home.k1.approvals.note')
  const times = items
    .map((i) => i.submitted_at)
    .filter((at): at is string => at !== null && !Number.isNaN(new Date(at).getTime()))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
  const when = times.length > 0 ? agoText(times[0]!, now, timeZone) : null
  return when ? `${base} · ${homeText('home.k1.approvals.oldest', { when })}` : base
}

/** Satır etiketleri: "gönderildi ‹n› önce" ve "‹n› dosya"; alan yoksa/0 ise `null` (gizli). */
export function approvalRowParts(
  item: WorkRow,
  now: Date,
  timeZone: string,
): { sent: string | null; files: string | null } {
  const when = item.submitted_at === null ? null : agoText(item.submitted_at, now, timeZone)
  return {
    sent: when ? homeText('home.k1.approvals.sent', { when }) : null,
    files: item.file_count > 0 ? homeText('home.k1.approvals.files', { n: item.file_count }) : null,
  }
}
