import type { AuditCategory, AuditEntry } from './types'

const categories: Record<AuditCategory, string> = {
  task: 'Görev',
  file: 'Dosya',
  meeting: 'Toplantı',
  message: 'Mesaj',
  account: 'Hesap',
  system: 'Sistem',
}

const ACTIONS: Readonly<Record<string, string>> = {
  'work.item.created': 'Görev oluşturuldu',
  'work.item.updated': 'Görev güncellendi',
  'work.item.transitioned': 'Görev durumu değişti',
  'work.item.deleted': 'Görev silindi',
  'work.item.restored': 'Görev geri yüklendi',
  'work.item.assigned': 'Görev atandı',
  'records.file.attached': 'Dosya eklendi',
  'records.file.renamed': 'Dosya yeniden adlandırıldı',
  'records.file.deleted': 'Dosya silindi',
  'records.file.moved': 'Dosya taşındı',
  'collaboration.meeting.created': 'Toplantı oluşturuldu',
  'messaging.message.sent': 'Mesaj gönderildi',
  'identity.login.succeeded': 'Oturum açıldı',
  'identity.login.denied': 'Oturum açılamadı',
  'reporting.report_downloaded': 'Rapor indirildi',
  'audit.entries.exported': 'İşlem geçmişi dışa aktarıldı',
}

export const categoryLabel = (value: AuditCategory): string => categories[value]
export const actionLabel = (code: string): string => ACTIONS[code] ?? code
export const actorLabel = (event: AuditEntry): string =>
  event.actor_full_name || (event.actor_account_id === null ? 'Sistem' : 'Adı bilinmeyen kişi')

export function auditDay(at: Date | string, zone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(at))
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function auditTime(at: string, zone: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(at))
}

export function dayLabel(day: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${day}T00:00:00Z`))
}

export function shiftDay(day: string, adjustment: number): string {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + adjustment)
  return date.toISOString().slice(0, 10)
}

export function validDay(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false
  const date = new Date(`${day}T00:00:00Z`)
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === day
}

/** Find the first instant on the local day, including time zone transitions around midnight. */
export function localDayStart(day: string, zone: string): string {
  const center = Date.parse(`${day}T00:00:00Z`)
  let lower = center - 129_600_000
  let upper = center + 129_600_000
  while (lower < upper) {
    const point = Math.floor((lower + upper) / 2)
    if (auditDay(new Date(point), zone) < day) lower = point + 1
    else upper = point
  }
  return new Date(lower).toISOString()
}
