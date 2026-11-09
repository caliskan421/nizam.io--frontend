/**
 * Koordinatörlük formu saf modeli (E-08-05 oluştur, E-08-63/70 düzenle; K11 zod). Ad iki
 * kavramdır (G17): programdaki ad (`renameDepartmentLink`, S2) ≠ katalog ad/kod/açıklama/tür
 * (`updateDepartment`, S1, şirket geneli).
 *
 *  - Kod: yalnız ASCII harf/rakam, 2–10 karakter; büyük harfe çevrilir (`^[A-Z0-9]{2,10}$`).
 *    Türkçe harf (ç, ğ, ı, İ, ö, ş, ü) istemcide reddedilir — `toUpperCase` 'ı'yı sessizce 'I'
 *    yapmasın diye denetim çevirmeden ÖNCE yapılır.
 *  - Düzenlemede mevcut kod boşaltılamaz (ORGANIZATION-K10).
 *  - Programdaki ad 2–120 (openapi `display_name`).
 */
import { z } from 'zod'

import type { DepartmentKind, UpdateDepartmentRequest } from '../../model/types'
import { orgText } from './messages'

export const KINDS = [
  'koordinatorluk',
  'calisma_grubu',
] as const satisfies readonly DepartmentKind[]

const CODE_INPUT = /^[A-Za-z0-9]{2,10}$/

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase()
}

/** Türkçe katlamalı ad karşılaştırması (`department_exists` eşleşmesi; K7). */
export function foldName(name: string): string {
  return name.trim().toLocaleLowerCase('tr-TR')
}

export interface CreateValues {
  name: string
  kind: DepartmentKind
  code: string
  description: string
}

export function emptyCreate(): CreateValues {
  return { name: '', kind: 'koordinatorluk', code: '', description: '' }
}

function codeField() {
  return z
    .string()
    .trim()
    .refine((v) => v === '' || CODE_INPUT.test(v), orgText('forms.department.error.code'))
}

export function createSchema() {
  return z.object({
    name: z.string().trim().min(1, orgText('forms.department.error.name')),
    kind: z.enum(KINDS),
    code: codeField(),
    description: z.string(),
  })
}

export interface EditValues {
  displayName: string
  kind: DepartmentKind
  code: string
  description: string
}

export function displayNameField() {
  return z
    .string()
    .trim()
    .refine((v) => v.length >= 2 && v.length <= 120, orgText('forms.department.error.displayName'))
}

/** Düzenleme şeması; `hadCode`: katalogda kod vardı → boşaltılamaz. */
export function editSchema(hadCode: () => boolean) {
  return z.object({
    displayName: displayNameField(),
    kind: z.enum(KINDS),
    code: codeField().refine(
      (v) => !(hadCode() && v === ''),
      orgText('forms.department.error.codeRequired'),
    ),
    description: z.string(),
  })
}

/** Bağ formu: programdaki ad isteğe bağlı (boş → katalog adı). */
export function linkSchema() {
  return z.object({
    displayName: z
      .string()
      .trim()
      .refine(
        (v) => v === '' || (v.length >= 2 && v.length <= 120),
        orgText('forms.department.error.displayName'),
      ),
  })
}

/** Katalog değişiklikleri (yalnız değişen alanlar; gönderilmeyen değişmez). */
export function catalogChanges(
  before: Pick<EditValues, 'kind' | 'code' | 'description'>,
  after: Pick<EditValues, 'kind' | 'code' | 'description'>,
): UpdateDepartmentRequest {
  const changes: UpdateDepartmentRequest = {}
  if (after.kind !== before.kind) changes.kind = after.kind
  const code = normalizeCode(after.code)
  if (code !== normalizeCode(before.code)) changes.code = code
  const description = after.description.trim()
  if (description !== before.description.trim()) changes.description = description
  return changes
}

/** Sunucu alan adı → oluşturma formu alanı. */
export const CREATE_FIELDS: Readonly<Record<string, keyof CreateValues>> = {
  name: 'name',
  kind: 'kind',
  code: 'code',
  description: 'description',
}

/** Alan listesi olmadan da bir alana bağlanan kodlar (oluşturma / katalog güncelleme). */
export const CATALOG_CODES: Readonly<Record<string, 'name' | 'code' | 'kind'>> = {
  'organization.department_code_conflict': 'code',
  'organization.invalid_code': 'code',
  'organization.invalid_name': 'name',
  'organization.invalid_kind': 'kind',
}

export const LINK_NAME_CODES: Readonly<Record<string, 'displayName'>> = {
  'program.department_link_name_exists': 'displayName',
}
