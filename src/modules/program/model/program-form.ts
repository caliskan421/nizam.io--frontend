/**
 * Program formu (oluştur / düzenle; P3). Alanlar yalnız sözleşmedekiler: ad (zorunlu), yıl,
 * açıklama (`CreateProgramRequest` / `UpdateProgramRequest`). Kısa ad + renk yok (BE-001; formda
 * statik). Yıl seçenekleri PROGRAM-K10'dan: içinde bulunulan yıl ya da bir sonraki yıl;
 * düzenlemede kayıttaki yıl (pencere dışında kalmış olsa da) korunabilsin diye listede kalır.
 * Sunucu doğrulaması kesindir (`program.invalid_name` / `invalid_year` / `invalid_description`
 * → alan hatası).
 */
import { z } from 'zod'

import type { ApiError } from '@/shared/errors/api-error'
import { errorText } from '@/shared/i18n'

import { programText } from './messages'
import type { CreateProgramInput, Program, UpdateProgramInput } from './types'

z.config({ jitless: true })

export interface ProgramFormValues {
  name: string
  /** `''` ≡ yıl yok. */
  year: string
  description: string
}

export type ProgramFormField = keyof ProgramFormValues

export function programFormSchema() {
  return z.object({
    name: z.string().trim().min(1, programText('form.required')),
    year: z.string().regex(/^(\d{4})?$/),
    description: z.string(),
  })
}

/** Yıl seçenekleri: bu yıl, gelecek yıl ve (düzenlemede) kayıttaki yıl; artan sıra. */
export function yearOptions(now: Date, current: number | null = null): number[] {
  const thisYear = now.getFullYear()
  const years = new Set([thisYear, thisYear + 1])
  if (current !== null) years.add(current)
  return [...years].sort((a, b) => a - b)
}

export function emptyValues(): ProgramFormValues {
  return { name: '', year: '', description: '' }
}

export function valuesOf(program: Program): ProgramFormValues {
  return {
    name: program.name,
    year: program.year === undefined ? '' : String(program.year),
    description: program.description ?? '',
  }
}

export function createInput(values: ProgramFormValues): CreateProgramInput {
  const description = values.description.trim()
  return {
    name: values.name.trim(),
    ...(values.year ? { year: Number(values.year) } : {}),
    ...(description ? { description } : {}),
  }
}

/** Yalnız değişen alanlar; değişiklik yoksa `null` (istek atılmaz). */
export function updateInput(
  program: Program,
  values: ProgramFormValues,
): UpdateProgramInput | null {
  const before = valuesOf(program)
  const changes: UpdateProgramInput['changes'] = {}
  const name = values.name.trim()
  if (name !== before.name) changes.name = name
  if (values.year !== before.year) changes.year = values.year ? Number(values.year) : null
  const description = values.description.trim()
  if (description !== before.description.trim()) changes.description = description || null
  if (Object.keys(changes).length === 0) return null
  return { programId: program.program_id, changes }
}

const FIELD_CODES: Readonly<Record<string, ProgramFormField>> = {
  'program.invalid_name': 'name',
  'program.already_exists': 'name',
  'program.invalid_year': 'year',
  'program.invalid_description': 'description',
}

/** Sunucu hatasından alan hataları (alan kodu → i18n); eşlenemeyen hata boş döner. */
export function programFieldErrors(error: ApiError): Partial<Record<ProgramFormField, string>> {
  const out: Partial<Record<ProgramFormField, string>> = {}
  for (const f of error.fields) {
    const field = FIELD_CODES[f.code]
    if (field && !out[field]) out[field] = errorText(f)
  }
  const byCode = FIELD_CODES[error.code]
  if (byCode && !out[byCode]) out[byCode] = errorText(error)
  return out
}
