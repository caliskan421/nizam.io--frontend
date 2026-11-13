/**
 * K1 kuyrukları (E-K1-14…25): yüklenen görev kümesinden süzülür (KESİN 21; ayrı süzme kodu ve
 * ek istek yok). Sıralar kararlıdır (bitiş günü, sonra başlık).
 */
import type { DateChangeRequest } from '@/modules/timeline/public'

import { byTitle, isOpen, type WorkRow } from '../role/common'

const byEnd = (a: WorkRow, b: WorkRow) => a.end_on.localeCompare(b.end_on) || byTitle(a, b)

/** Onay bekleyenler (`status = onaya_sunuldu`). */
export function approvalsOf(items: readonly WorkRow[]): WorkRow[] {
  return items.filter((i) => i.status === 'onaya_sunuldu').sort(byEnd)
}

/** Atanmamış açık görevler (`assignee_account_ids = []`; E-K1-12). */
export function unassignedOf(items: readonly WorkRow[]): WorkRow[] {
  return items.filter((i) => isOpen(i) && i.assignee_account_ids.length === 0).sort(byEnd)
}

export interface AttentionRow {
  item: WorkRow
  /** Görevde bekleyen tarih talebi var. */
  requestPending: boolean
  /** Yüklenen taleplerde bu görevin son talebi reddedilmiş (E-K1-24). */
  requestRejected: boolean
}

/** Son talep durumu: görev başına `request_id` sırası bilinmez → bekleyen > reddedilen. */
function rejectedIds(requests: readonly DateChangeRequest[]): Set<string> {
  const pending = new Set(requests.filter((r) => r.status === 'pending').map((r) => r.work_item_id))
  return new Set(
    requests
      .filter((r) => r.status === 'rejected' && !pending.has(r.work_item_id))
      .map((r) => r.work_item_id),
  )
}

/** Geciken açık görevler, en uzun gecikme önde (E-K1-23/24). */
export function attentionOf(
  items: readonly WorkRow[],
  requests: readonly DateChangeRequest[],
): AttentionRow[] {
  const rejected = rejectedIds(requests)
  return items
    .filter((i) => isOpen(i) && i.is_overdue)
    .sort((a, b) => b.days_overdue - a.days_overdue || byTitle(a, b))
    .map((item) => ({
      item,
      requestPending: item.pending_date_request !== null,
      requestRejected: item.pending_date_request === null && rejected.has(item.work_item_id),
    }))
}

export interface RequestRow {
  request: DateChangeRequest
  /** Başlık yüklenen görev kümesinden; bulunamazsa `null` (başlık uydurulmaz). */
  title: string | null
}

/** Tarih taleplerim (E-K1-38/39): bekleyenler önde; başlık yüklenen kümeden. */
export function requestRows(
  requests: readonly DateChangeRequest[],
  items: readonly WorkRow[],
): { rows: RequestRow[]; pending: number; decided: number } {
  const titles = new Map(items.map((i) => [i.work_item_id, i.title]))
  const rank = (r: DateChangeRequest) => (r.status === 'pending' ? 0 : 1)
  const rows = requests
    .map((request) => ({ request, title: titles.get(request.work_item_id) ?? null }))
    .sort((a, b) => rank(a.request) - rank(b.request))
  const pending = requests.filter((r) => r.status === 'pending').length
  return { rows, pending, decided: requests.length - pending }
}
