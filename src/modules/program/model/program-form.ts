/**
 * Program formu (oluştur / düzenle; P3). Alanlar yalnız sözleşmedekiler: ad (zorunlu), yıl,
 * açıklama, dönem, konum, kısa ad, renk (`CreateProgramRequest` / `UpdateProgramRequest`; BE-001, PROGRAM-K46).
 * Kısa ad kırpıldıktan sonra 1–4 Unicode harf/rakam; boş = verilmemiş (`null`). Renk sekiz
 * palet anahtarından biri ya da yok. `updateProgram` üç hâllidir: değişmeyen alan gönderilmez,
 * temizlenen alan açık `null` gider. Yıl seçenekleri PROGRAM-K10'dan: içinde bulunulan yıl ya da bir sonraki yıl;
 * düzenlemede kayıttaki yıl (pencere dışında kalmış olsa da) korunabilsin diye listede kalır.
 * Sunucu doğrulaması kesindir (`program.invalid_name` / `invalid_year` / `invalid_description`
 * → alan hatası).
 */
import { z } from 'zod'

import type { ApiError } from '@/shared/errors/api-error'
import { errorText } from '@/shared/i18n'

import { programText } from './messages'
import type { CreateProgramInput, Program, ProgramColor, UpdateProgramInput } from './types'

z.config({ jitless: true })

export interface ProgramFormValues {
  name: string
  /** `''` ≡ yıl yok. */
  year: string
  description: string
  periodStart: string
  periodEnd: string
  location: string
  /** `''` ≡ kısa ad yok. */
  shortName: string
  /** `''` ≡ renk yok. */
  color: ProgramColor | ''
}

/** Sözleşme paleti (`Program.color` enum'u; sıra spec'teki gibi). */
export const PROGRAM_COLORS = [
  'violet',
  'gold',
  'blue',
  'teal',
  'green',
  'orange',
  'red',
  'slate',
] as const satisfies readonly ProgramColor[]

/** Kırpılmış kısa ad kuralı (PROGRAM-K46): 1–4 Unicode harf ya da rakam. */
const SHORT_NAME = /^[\p{L}\p{N}]{1,4}$/u

export type ProgramFormField = keyof ProgramFormValues

export function programFormSchema() {
  const day = z.union([z.literal(''), z.iso.date(programText('form.periodInvalid'))])
  return z
    .object({
      name: z.string().trim().min(1, programText('form.required')),
      year: z.string().regex(/^(\d{4})?$/),
      description: z.string(),
      periodStart: day,
      periodEnd: day,
      location: z.string().refine((value) => {
        const trimmed = value.trim()
        return [...trimmed].length <= 120 && !/\p{Cc}/u.test(trimmed)
      }, programText('form.locationInvalid')),
      shortName: z
        .string()
        .refine(
          (v) => v.trim() === '' || SHORT_NAME.test(v.trim()),
          programText('form.shortNameInvalid'),
        ),
      color: z.union([z.literal(''), z.enum(PROGRAM_COLORS)]),
    })
    .refine(
      ({ periodStart, periodEnd }) => !periodStart || !periodEnd || periodStart <= periodEnd,
      { path: ['periodEnd'], message: programText('form.periodOrder') },
    )
}

/** Yıl seçenekleri: bu yıl, gelecek yıl ve (düzenlemede) kayıttaki yıl; artan sıra. */
export function yearOptions(now: Date, current: number | null = null): number[] {
  const thisYear = now.getFullYear()
  const years = new Set([thisYear, thisYear + 1])
  if (current !== null) years.add(current)
  return [...years].sort((a, b) => a - b)
}

export function emptyValues(): ProgramFormValues {
  return {
    name: '',
    year: '',
    description: '',
    shortName: '',
    color: '',
    periodStart: '',
    periodEnd: '',
    location: '',
  }
}

export function valuesOf(program: Program): ProgramFormValues {
  return {
    name: program.name,
    year: program.year === undefined ? '' : String(program.year),
    description: program.description ?? '',
    periodStart: program.period_start_on ?? '',
    periodEnd: program.period_end_on ?? '',
    location: program.location ?? '',
    shortName: program.short_name ?? '',
    color: program.color ?? '',
  }
}

export function createInput(values: ProgramFormValues): CreateProgramInput {
  const description = values.description.trim()
  const shortName = values.shortName.trim()
  const location = values.location.trim()
  return {
    name: values.name.trim(),
    ...(values.year ? { year: Number(values.year) } : {}),
    ...(description ? { description } : {}),
    ...(shortName ? { short_name: shortName } : {}),
    ...(values.color ? { color: values.color } : {}),
    ...(values.periodStart ? { period_start_on: values.periodStart } : {}),
    ...(values.periodEnd ? { period_end_on: values.periodEnd } : {}),
    ...(location ? { location } : {}),
  }
}

function periodChanges(
  before: ProgramFormValues,
  values: ProgramFormValues,
): UpdateProgramInput['changes'] {
  const changes: UpdateProgramInput['changes'] = {}
  if (values.periodStart !== before.periodStart)
    changes.period_start_on = values.periodStart || null
  if (values.periodEnd !== before.periodEnd) changes.period_end_on = values.periodEnd || null
  const location = values.location.trim()
  if (location !== before.location.trim()) changes.location = location || null
  return changes
}

/** Yalnız değişen alanlar; değişiklik yoksa `null` (istek atılmaz). */
export function updateInput(
  program: Program,
  values: ProgramFormValues,
): UpdateProgramInput | null {
  const before = valuesOf(program)
  const changes = periodChanges(before, values)
  const name = values.name.trim()
  if (name !== before.name) changes.name = name
  if (values.year !== before.year) changes.year = values.year ? Number(values.year) : null
  const description = values.description.trim()
  if (description !== before.description.trim()) changes.description = description || null
  const shortName = values.shortName.trim()
  if (shortName !== before.shortName) changes.short_name = shortName || null
  if (values.color !== before.color) changes.color = values.color || null
  if (Object.keys(changes).length === 0) return null
  return { programId: program.program_id, changes }
}

const FIELD_CODES: Readonly<Record<string, ProgramFormField>> = {
  'program.invalid_name': 'name',
  'program.already_exists': 'name',
  'program.invalid_year': 'year',
  'program.invalid_description': 'description',
  'program.invalid_short_name': 'shortName',
  'program.invalid_color': 'color',
  'program.invalid_location': 'location',
  'program.invalid_period': 'periodEnd',
}

/** Sunucu hatasından alan hataları (alan kodu → i18n); eşlenemeyen hata boş döner. */
export function programFieldErrors(error: ApiError): Partial<Record<ProgramFormField, string>> {
  const out: Partial<Record<ProgramFormField, string>> = {}
  for (const f of error.fields) {
    const field =
      f.code === 'program.invalid_period' && f.field === 'period_start_on'
        ? 'periodStart'
        : FIELD_CODES[f.code]
    if (field && !out[field]) out[field] = errorText(f)
  }
  const byCode = FIELD_CODES[error.code]
  if (byCode && !out[byCode]) out[byCode] = errorText(error)
  return out
}
