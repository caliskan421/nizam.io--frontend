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

const program: Program = {
  program_id: 'p1',
  name: 'Teknofest',
  year: 2026,
  description: 'Eski',
  short_name: null,
  color: null,
}

describe('program formu', () => {
  it('ad zorunlu (boşluk kırpılır); yıl dört hane ya da boş', async () => {
    const schema = programFormSchema()
    expect((await schema.safeParseAsync({ ...emptyValues(), name: '  ' })).success).toBe(false)
    expect((await schema.safeParseAsync({ ...emptyValues(), name: 'A' })).success).toBe(true)
    expect((await schema.safeParseAsync({ ...emptyValues(), name: 'A', year: '26' })).success).toBe(
      false,
    )
  })

  it('kısa ad: kırpılmış 1–4 harf/rakam (Unicode), boş serbest; renk palet ya da boş', async () => {
    const schema = programFormSchema()
    const ok = (shortName: string, color: string = '') =>
      schema
        .safeParseAsync({ ...emptyValues(), name: 'A', shortName, color })
        .then((r) => r.success)
    for (const good of ['', ' ', ' ABCD ', 'ŞT', 'İz26', '٣٤'])
      expect(await ok(good), good).toBe(true)
    for (const bad of ['ABCDE', 'A B', 'A-1', 'A_', '🚀']) expect(await ok(bad), bad).toBe(false)
    expect(await ok('', 'slate')).toBe(true)
    expect(await ok('', 'pink')).toBe(false)
  })

  it('yıl seçenekleri: bu yıl + gelecek yıl (PROGRAM-K10), kayıttaki yıl korunur', () => {
    const now = new Date('2026-11-09T10:00:00Z')
    expect(yearOptions(now)).toEqual([2026, 2027])
    expect(yearOptions(now, 2024)).toEqual([2024, 2026, 2027])
    expect(yearOptions(now, 2027)).toEqual([2026, 2027])
  })

  it('oluşturma gövdesi yalnız dolu alanlar (BE-001: boş kısa ad/renk gönderilmez)', () => {
    expect(
      createInput({ ...emptyValues(), name: ' Yeni ', description: ' ', shortName: ' ' }),
    ).toEqual({ name: 'Yeni' })
    expect(
      createInput({
        name: 'Yeni',
        year: '2027',
        description: 'Açık',
        shortName: ' ABCD ',
        color: 'gold',
      }),
    ).toEqual({ name: 'Yeni', year: 2027, description: 'Açık', short_name: 'ABCD', color: 'gold' })
  })

  it('güncelleme yalnız değişen alanları gönderir; değişiklik yoksa null', () => {
    expect(updateInput(program, valuesOf(program))).toBeNull()
    expect(updateInput(program, { ...valuesOf(program), name: 'Yeni ad' })).toEqual({
      programId: 'p1',
      changes: { name: 'Yeni ad' },
    })
    expect(updateInput(program, { ...valuesOf(program), year: '', description: '' })).toEqual({
      programId: 'p1',
      changes: { year: null, description: null },
    })
  })

  it('kısa ad ve renk üç hâlli: değişmedi → yok, yazıldı → değer, temizlendi → açık null', () => {
    const set: Program = { ...program, short_name: 'TF', color: 'blue' }
    expect(updateInput(set, valuesOf(set))).toBeNull()
    expect(updateInput(set, { ...valuesOf(set), shortName: ' ' + 'T26' + ' ' })).toEqual({
      programId: 'p1',
      changes: { short_name: 'T26' },
    })
    expect(updateInput(set, { ...valuesOf(set), shortName: '  ', color: '' })).toEqual({
      programId: 'p1',
      changes: { short_name: null, color: null },
    })
    expect(updateInput(program, { ...valuesOf(program), color: 'red' })).toEqual({
      programId: 'p1',
      changes: { color: 'red' },
    })
    expect(valuesOf(set)).toMatchObject({ shortName: 'TF', color: 'blue' })
    expect(valuesOf(program)).toMatchObject({ shortName: '', color: '' })
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
    const rule = new ApiError({
      code: 'program.input_invalid',
      status: 422,
      fields: [
        {
          field: 'short_name',
          code: 'program.invalid_short_name',
          messageKey: 'errors.program.invalid_short_name',
        },
        {
          field: 'color',
          code: 'program.invalid_color',
          messageKey: 'errors.program.invalid_color',
        },
      ],
    })
    expect(programFieldErrors(rule)).toEqual({
      shortName: 'Kısa ad geçersiz.',
      color: 'Program rengi geçersiz.',
    })
    const exists = new ApiError({ code: 'program.already_exists', status: 409 })
    expect(programFieldErrors(exists)).toEqual({ name: 'Bu program zaten var.' })
    expect(programFieldErrors(new ApiError({ code: 'platform.internal', status: 500 }))).toEqual({})
  })
})
