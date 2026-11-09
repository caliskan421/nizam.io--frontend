/**
 * Alt görev görünüm yardımcıları (saf). Tarih biçimleri `ozellikler.md` §5: alt görev aralığı
 * `GG Aaa – GG Aaa` (en tire, boşluklu; Türkçe üç harfli ay), çakışma satırında `GG.AA.YYYY`.
 * Tarihler takvim günüdür (`YYYY-MM-DD`); saat dilimi dönüşümü yapılmaz. Alt görev tarihleri
 * "yalnız bilgi"dir; ana görev aralığına sınır doğrulaması yok (ADR-0024, BE-020 — F3).
 */
import type { UpdateSubtaskBody, WorkItem, WorkItemSubtask } from '../../model/types'

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

function parts(iso: string): [string, string, string] | null {
  const match = ISO_DATE.exec(iso)
  return match ? [match[1]!, match[2]!, match[3]!] : null
}

/** `2026-06-05` → `05 Haz`; biçimsiz değer aynen. */
export function shortDate(iso: string): string {
  const p = parts(iso)
  if (!p) return iso
  return `${p[2]} ${MONTHS[Number(p[1]) - 1] ?? p[1]}`
}

/** `2026-06-05` → `05.06.2026`; boş/biçimsiz değer aynen. */
export function fullDate(iso: string): string {
  const p = parts(iso)
  return p ? `${p[2]}.${p[1]}.${p[0]}` : iso
}

/** Tarih yuvası etiketi; tarih yoksa `null` (çağıran "Tarih yok" yazar). */
export function dateRangeLabel(s: Pick<WorkItemSubtask, 'start_on' | 'end_on'>): string | null {
  if (!s.start_on || !s.end_on) return null
  return `${shortDate(s.start_on)} – ${shortDate(s.end_on)}`
}

/** Satırdaki açılır (aynı anda tek açılır). */
export type SubtaskPop = 'date' | 'menu'

export interface SubtaskCounts {
  done: number
  total: number
}

/** Yüklenen alt görevlerden sayaç (E-03-21/30, E-03-60). */
export function countSubtasks(list: readonly Pick<WorkItemSubtask, 'done'>[]): SubtaskCounts {
  return { done: list.filter((s) => s.done).length, total: list.length }
}

/** Yönetim alanlarının karşılaştırılabilir değerleri (çakışma: taban / sunucu). */
export function subtaskValues(s: WorkItemSubtask): Record<string, string> {
  return {
    title: s.title,
    assignee_account_id: s.assignee_account_id ?? '',
    start_on: s.start_on ?? '',
    end_on: s.end_on ?? '',
  }
}

export interface PersonOption {
  value: string
  label: string
}

/**
 * Kişi seçenekleri (E-03-33): YALNIZ ana göreve atananlar (`assignees[]`; aksi 422
 * `work.subtask_assignee_not_assigned`). Alt görevin bugünkü atananı listede yoksa (atama
 * kaldırılmış) seçili değer görünsün diye eklenir. Ad `null` → `unknown`.
 */
export function personOptions(
  item: Pick<WorkItem, 'assignees'>,
  subtask: Pick<WorkItemSubtask, 'assignee_account_id' | 'assignee_full_name'>,
  unknown: string,
): PersonOption[] {
  const options = item.assignees.map((a) => ({
    value: a.account_id,
    label: a.full_name ?? unknown,
  }))
  const current = subtask.assignee_account_id
  if (current && !options.some((o) => o.value === current)) {
    options.push({ value: current, label: subtask.assignee_full_name ?? unknown })
  }
  return options
}

export type DatesProblem = 'pair' | 'order'

/** Tarih açılırı doğrulaması: ikisi birlikte (sözleşme) ve bitiş ≥ başlangıç (`min`). */
export function datesProblem(start: string, end: string): DatesProblem | null {
  if ((start === '') !== (end === '')) return 'pair'
  if (start !== '' && end < start) return 'order'
  return null
}

/**
 * "Tamam"da gönderilecek değişiklik (E-03-34): değer değişmediyse `null` (istek yok). Boş
 * çift = "tarihi kaldır" (boş dize; iki tarih de kalkar).
 */
export function datesChange(
  s: Pick<WorkItemSubtask, 'start_on' | 'end_on'>,
  start: string,
  end: string,
): UpdateSubtaskBody | null {
  if (start === (s.start_on ?? '') && end === (s.end_on ?? '')) return null
  return { start_on: start, end_on: end }
}

/**
 * Çakışma seçiminden sonra tarih çifti bütün kalır: sözleşme `start_on` + `end_on`'u birlikte
 * ister; seçim yalnız birini bıraktıysa öteki sunucunun değeriyle tamamlanır.
 */
export function keepDatePair(
  changes: UpdateSubtaskBody,
  server: Pick<WorkItemSubtask, 'start_on' | 'end_on'>,
): UpdateSubtaskBody {
  const hasStart = Object.hasOwn(changes, 'start_on')
  const hasEnd = Object.hasOwn(changes, 'end_on')
  if (hasStart === hasEnd) return changes
  return hasStart
    ? { ...changes, end_on: server.end_on ?? '' }
    : { ...changes, start_on: server.start_on ?? '' }
}
