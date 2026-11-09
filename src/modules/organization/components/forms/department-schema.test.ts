// @vitest-environment node
import { describe, expect, it } from 'vitest'

import {
  catalogChanges,
  createSchema,
  editSchema,
  emptyCreate,
  foldName,
  linkSchema,
  normalizeCode,
} from './department-schema'

describe('koordinatörlük formu şeması (E-08-05, E-08-63; G17)', () => {
  it('kod: ASCII harf/rakam 2–10; Türkçe harf ve sınır dışı ret; boş serbest', () => {
    const ok = (code: string) =>
      createSchema().safeParse({ ...emptyCreate(), name: 'A', code }).success
    expect(ok('')).toBe(true)
    expect(ok('yz')).toBe(true)
    expect(ok('AB12345678')).toBe(true)
    expect(ok('A')).toBe(false)
    expect(ok('AB123456789')).toBe(false)
    for (const tr of ['ıb', 'İB', 'ŞB', 'çğ', 'ÖÜ', 'A-B']) expect(ok(tr), tr).toBe(false)
  })

  it('kod büyük harfe çevrilir; ad Türkçe katlamalı karşılaştırılır', () => {
    expect(normalizeCode(' yz1 ')).toBe('YZ1')
    expect(foldName(' YAZILIM ')).toBe(foldName('yazılım'))
    expect(foldName('İletişim')).toBe(foldName('iletişim'))
    expect(foldName('Yazılım')).not.toBe(foldName('Yazilim'))
  })

  it('ad zorunlu; tür kapalı küme', () => {
    expect(createSchema().safeParse({ ...emptyCreate(), name: '  ' }).success).toBe(false)
    expect(createSchema().safeParse({ ...emptyCreate(), name: 'A', kind: 'x' }).success).toBe(false)
  })

  it('düzenleme: mevcut kod boşaltılamaz; programdaki ad 2–120', () => {
    const base = { displayName: 'Ad', kind: 'koordinatorluk', code: '', description: '' }
    expect(editSchema(() => true).safeParse(base).success).toBe(false)
    expect(editSchema(() => false).safeParse(base).success).toBe(true)
    expect(editSchema(() => false).safeParse({ ...base, displayName: 'A' }).success).toBe(false)
    expect(
      editSchema(() => false).safeParse({ ...base, displayName: 'A'.repeat(121) }).success,
    ).toBe(false)
    expect(linkSchema().safeParse({ displayName: '' }).success).toBe(true)
    expect(linkSchema().safeParse({ displayName: 'A' }).success).toBe(false)
  })

  it('katalog değişiklikleri yalnız değişen alanlar', () => {
    const before = { kind: 'koordinatorluk', code: 'YZ', description: 'x' } as const
    expect(catalogChanges(before, { ...before })).toEqual({})
    expect(catalogChanges(before, { ...before, code: 'yz' })).toEqual({})
    expect(
      catalogChanges(before, { kind: 'calisma_grubu', code: 'ab', description: ' y ' }),
    ).toEqual({ kind: 'calisma_grubu', code: 'AB', description: 'y' })
  })
})
