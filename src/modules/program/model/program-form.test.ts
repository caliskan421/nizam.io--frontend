import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'

import {
  createInput,
  emptyValues,
  programFieldErrors,
  programFormSchema,
  updateInput,
  valuesOf,
  yearOptions,
} from './program-form'
import type { Program } from './types'

const program: Program = { program_id: 'p1', name: 'Teknofest', year: 2026, description: 'Eski' }

describe('program formu', () => {
  it('ad zorunlu (boşluk kırpılır); yıl dört hane ya da boş', async () => {
    const schema = programFormSchema()
    expect((await schema.safeParseAsync({ ...emptyValues(), name: '  ' })).success).toBe(false)
    expect((await schema.safeParseAsync({ ...emptyValues(), name: 'A' })).success).toBe(true)
    expect((await schema.safeParseAsync({ name: 'A', year: '26', description: '' })).success).toBe(
      false,
    )
  })

  it('yıl seçenekleri: bu yıl + gelecek yıl (PROGRAM-K10), kayıttaki yıl korunur', () => {
    const now = new Date('2026-11-09T10:00:00Z')
    expect(yearOptions(now)).toEqual([2026, 2027])
    expect(yearOptions(now, 2024)).toEqual([2024, 2026, 2027])
    expect(yearOptions(now, 2027)).toEqual([2026, 2027])
  })

  it('oluşturma gövdesi yalnız dolu alanlar (kısa ad/renk yok, BE-001)', () => {
    expect(createInput({ name: ' Yeni ', year: '', description: ' ' })).toEqual({ name: 'Yeni' })
    expect(createInput({ name: 'Yeni', year: '2027', description: 'Açık' })).toEqual({
      name: 'Yeni',
      year: 2027,
      description: 'Açık',
    })
  })

  it('güncelleme yalnız değişen alanları gönderir; değişiklik yoksa null', () => {
    expect(updateInput(program, valuesOf(program))).toBeNull()
    expect(updateInput(program, { ...valuesOf(program), name: 'Yeni ad' })).toEqual({
      programId: 'p1',
      changes: { name: 'Yeni ad' },
    })
    expect(updateInput(program, { name: 'Teknofest', year: '', description: '' })).toEqual({
      programId: 'p1',
      changes: { year: null, description: null },
    })
  })

  it('sunucu alan kodları forma; eşlenemeyen hata boş', () => {
    const invalid = new ApiError({
      code: 'program.input_invalid',
      status: 422,
      fields: [
        { field: 'year', code: 'program.invalid_year', messageKey: 'errors.program.invalid_year' },
      ],
    })
    expect(programFieldErrors(invalid)).toEqual({ year: 'Yıl geçersiz.' })
    const exists = new ApiError({ code: 'program.already_exists', status: 409 })
    expect(programFieldErrors(exists)).toEqual({ name: 'Bu program zaten var.' })
    expect(programFieldErrors(new ApiError({ code: 'platform.internal', status: 500 }))).toEqual({})
  })
})
