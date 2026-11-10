/**
 * Panel tarih girdisi (E-03C-58/59): kullanıcı `gg.aa.yyyy` yazar, sözleşme `YYYY-MM-DD` ister.
 * Saf işlevler; geçersiz takvim günü (ör. 31.02.2026) kabul edilmez.
 */
import { dayDiff, dayNumber } from '../../model/dates'

const INPUT_DAY = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/

/** `YYYY-MM-DD` → `gg.aa.yyyy`; biçim dışı (boş dahil) `''`. */
export function formatInputDay(iso: string): string {
  const match = ISO_DAY.exec(iso)
  return match ? `${match[3]}.${match[2]}.${match[1]}` : ''
}

/** `gg.aa.yyyy` → `YYYY-MM-DD`; biçim ya da takvim günü geçersizse `null`. */
export function parseInputDay(text: string): string | null {
  const match = INPUT_DAY.exec(text.trim())
  if (!match) return null
  const iso = `${match[3]}-${match[2]!.padStart(2, '0')}-${match[1]!.padStart(2, '0')}`
  return dayNumber(iso) === null ? null : iso
}

export type DateInputError = 'dateInvalid' | 'order'

export interface DateDraft {
  startOn: string
  endOn: string
}

export interface DateDraftCheck {
  /** Geçerliyse ISO değerler. */
  value: DateDraft | null
  start: DateInputError | null
  end: DateInputError | null
}

/** İki girdiyi doğrular: her biri geçerli takvim günü, başlangıç ≤ bitiş. */
export function checkDraft(startText: string, endText: string): DateDraftCheck {
  const startOn = parseInputDay(startText)
  const endOn = parseInputDay(endText)
  const start: DateInputError | null = startOn === null ? 'dateInvalid' : null
  let end: DateInputError | null = endOn === null ? 'dateInvalid' : null
  if (startOn !== null && endOn !== null && (dayDiff(startOn, endOn) ?? 0) < 0) end = 'order'
  const ok = start === null && end === null && startOn !== null && endOn !== null
  return { value: ok ? { startOn, endOn } : null, start, end }
}
