/**
 * 10c pencere formlarının saf modeli (E-10-77/78, E-10-87…90, E-10-94…98). Sayı sınırları
 * tasarım ve `ozellikler.md` §7.19 kararlarıdır (istemci sözleşmeden daha sıkıdır); sunucu
 * 422'si ayrıca alan altında gösterilir.
 */
import type { ChatCandidate, ChatMember, SendChatMessageRequest } from '../../model/types'

export const GROUP_NAME_MAX = 80
export const GROUP_MEMBERS_MAX = 200
export const POLL_QUESTION_MAX = 200
export const POLL_OPTION_MAX = 100
export const POLL_OPTIONS_MIN = 2
export const POLL_OPTIONS_MAX = 10
export const TASK_TITLE_MAX = 255
/** Yeni sohbet/üye aday listesinin sunucu tavanı (`truncated` notu). */
export const CANDIDATE_LIMIT = 200

const collator = new Intl.Collator('tr-TR', { sensitivity: 'base' })

/** Ada göre ("tr" büyük/küçük harf ve aksan duyarsız) içerir süzmesi; boş sorgu hepsini verir. */
export function filterByName<T extends { full_name: string }>(
  items: readonly T[],
  query: string,
): T[] {
  const needle = query.trim().toLocaleLowerCase('tr-TR')
  if (needle === '') return [...items]
  return items.filter((item) => item.full_name.toLocaleLowerCase('tr-TR').includes(needle))
}

export type CandidateLike = Pick<ChatCandidate | ChatMember, 'account_id' | 'full_name'>

/** Ada göre sıralı kopya (sunucu zaten ada göre verir; yerel ekleme/çıkarmada tutarlılık). */
export function sortedByName<T extends { full_name: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => collator.compare(a.full_name, b.full_name))
}

export type GroupError = 'nameRequired' | 'nameTooLong' | 'membersRequired' | 'membersTooMany'

export function validateGroup(name: string, memberIds: readonly string[]): GroupError | null {
  const trimmed = name.trim()
  if (trimmed === '') return 'nameRequired'
  if (trimmed.length > GROUP_NAME_MAX) return 'nameTooLong'
  if (memberIds.length === 0) return 'membersRequired'
  if (memberIds.length > GROUP_MEMBERS_MAX) return 'membersTooMany'
  return null
}

export type PollError =
  | 'questionRequired'
  | 'questionTooLong'
  | 'optionsMin'
  | 'optionTooLong'
  | 'optionsDuplicate'
  | 'closesInvalid'
  | 'closesPast'

export interface PollDraft {
  question: string
  options: readonly string[]
  multi: boolean
  /** `datetime-local` değeri (`YYYY-MM-DDTHH:mm`, yerel saat) ya da boş. */
  closesLocal: string
}

/** Yerel `datetime-local` dizesini UTC ISO'ya çevirir; geçersizse `null`. */
export function closesAtIso(local: string): string | null {
  if (local.trim() === '') return null
  const at = new Date(local)
  return Number.isNaN(at.getTime()) ? null : at.toISOString()
}

/** Boş satırlar sayılmaz; kalanlar kırpılır. */
export function filledOptions(options: readonly string[]): string[] {
  return options.map((o) => o.trim()).filter((o) => o !== '')
}

export function validatePoll(draft: PollDraft, nowMs: number): PollError | null {
  const question = draft.question.trim()
  if (question === '') return 'questionRequired'
  if (question.length > POLL_QUESTION_MAX) return 'questionTooLong'
  const options = filledOptions(draft.options)
  if (options.length < POLL_OPTIONS_MIN) return 'optionsMin'
  if (options.some((o) => o.length > POLL_OPTION_MAX)) return 'optionTooLong'
  if (new Set(options.map((o) => o.toLocaleLowerCase('tr-TR'))).size !== options.length) {
    return 'optionsDuplicate'
  }
  if (draft.closesLocal.trim() !== '') {
    const iso = closesAtIso(draft.closesLocal)
    if (iso === null) return 'closesInvalid'
    if (Date.parse(iso) <= nowMs) return 'closesPast'
  }
  return null
}

/** `sendChatMessage` gövdesi: soru = `body`, anket `poll` içinde (K38); anonim yoktur (BE-161). */
export function toPollBody(
  draft: PollDraft,
  clientMessageId: string,
): Pick<SendChatMessageRequest, 'body' | 'client_message_id' | 'poll'> {
  const closes = closesAtIso(draft.closesLocal)
  return {
    client_message_id: clientMessageId,
    body: draft.question.trim(),
    poll: {
      options: filledOptions(draft.options),
      multi: draft.multi,
      ...(closes ? { closes_at: closes } : {}),
    },
  }
}

export type TaskError =
  'titleTooLong' | 'departmentRequired' | 'dateInvalid' | 'startPast' | 'endBeforeStart'

export interface TaskDraft {
  title: string
  departmentId: string
  assigneeIds: readonly string[]
  startOn: string
  endOn: string
}

const DAY = /^\d{4}-\d{2}-\d{2}$/

/** Yerel takvim günü (`YYYY-MM-DD`). */
export function localDay(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** Alan başına en fazla bir hata (ilk bulunan); alan adı → hata. */
export function validateTask(draft: TaskDraft, today: string): Partial<Record<string, TaskError>> {
  const errors: Partial<Record<string, TaskError>> = {}
  if (draft.title.trim().length > TASK_TITLE_MAX) errors.title = 'titleTooLong'
  if (draft.departmentId === '') errors.departmentId = 'departmentRequired'
  if (!DAY.test(draft.startOn)) errors.startOn = 'dateInvalid'
  else if (draft.startOn < today) errors.startOn = 'startPast'
  if (!DAY.test(draft.endOn)) errors.endOn = 'dateInvalid'
  else if (DAY.test(draft.startOn) && draft.endOn < draft.startOn) errors.endOn = 'endBeforeStart'
  return errors
}

/** `createTaskFromChatMessage` gövdesi: boş başlık/atanan gönderilmez, öncelik tasarımda yok. */
export function toTaskBody(draft: TaskDraft) {
  const title = draft.title.trim()
  return {
    department_id: draft.departmentId,
    start_date: draft.startOn,
    end_date: draft.endOn,
    ...(title === '' ? {} : { title }),
    ...(draft.assigneeIds.length > 0 ? { assignee_account_ids: [...draft.assigneeIds] } : {}),
  }
}

/** Boyut metni ("<n> KB"); tasarım KB gösterir. */
export function sizeKb(bytes: number): number {
  return Math.max(1, Math.round(bytes / 1024))
}

/** "Arşivden" sekmesinde seçilen dosya (bağlantı olarak paylaşılır, kopyalanmaz). */
export interface PickedArchiveFile {
  fileId: string
  name: string
}
