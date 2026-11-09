/**
 * "Kullanıcı oluştur" formu saf modeli (E-05-05; K11 zod). Alanlar `CreateUserRequest`:
 * e-posta (zorunlu), ad soyad (isteğe bağlı), koordinatörlük (seçili programın birimi), rol
 * (`koordinator`/`uye`; yalnız ŞY seçer). Parola alanı YOK: `createUser` parola almaz/döndürmez,
 * geçici parola ayrı adımdır (P14). E-posta biçimi istemcide kaba denetlenir; asıl kural sunucuda
 * (422 `identity.invalid_email`).
 */
import { z } from 'zod'

import type { TeamRole } from '@/shared/scope/standing-facts'

import { orgText } from './messages'

export const USER_ROLES = ['member', 'coordinator'] as const satisfies readonly TeamRole[]

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface UserValues {
  email: string
  fullName: string
  departmentId: string
  role: TeamRole
}

export function emptyUser(departmentId: string | null | undefined): UserValues {
  return { email: '', fullName: '', departmentId: departmentId ?? '', role: 'member' }
}

export function userSchema() {
  return z.object({
    email: z.string().trim().regex(EMAIL, orgText('orgForms.user.error.email')),
    fullName: z.string().trim(),
    departmentId: z.string().min(1, orgText('orgForms.user.error.department')),
    role: z.enum(USER_ROLES),
  })
}

/** Sunucu alan adı → form alanı (`fields[].field`). */
export const USER_FIELDS: Readonly<Record<string, keyof UserValues>> = {
  email: 'email',
  full_name: 'fullName',
  department_id: 'departmentId',
  role: 'role',
}

/** Alan listesi olmadan da bir alana bağlanan zarf kodları (05 `backend.md` §2). */
export const USER_CODES: Readonly<Record<string, keyof UserValues>> = {
  'identity.account_exists': 'email',
  'identity.account_email_deleted': 'email',
  'organization.department_not_linked': 'departmentId',
  'organization.department_not_found': 'departmentId',
}

/** Önseçim: mevcut seçim geçerliyse o, tek seçenekse o, değilse boş (ortak-kurallar §1). */
export function pickDepartment(current: string, options: readonly { value: string }[]): string {
  if (current !== '' && options.some((o) => o.value === current)) return current
  return options.length === 1 ? options[0]!.value : ''
}
