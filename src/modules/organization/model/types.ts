/**
 * Organizasyon modülü tipleri. Sunucu şekilleri YALNIZ üretilmiş şemadan (`schema.d.ts`) adla
 * türetilir (elle DTO yok); burada yalnız istemcinin eylem değişkenleri ve görünüm modelleri
 * durur. `api/` katmanı tip bildirmez (lint), buradan içe aktarır.
 */
import type { components } from '@/shared/api/schema'
import type { TeamRole } from '@/shared/scope/standing-facts'

type Schemas = components['schemas']

export type KnownUser = Schemas['KnownUser']
export type UserList = Schemas['UserList']
export type UserResult = Schemas['UserResult']
export type AccountResult = Schemas['AccountResult']
export type RosterList = Schemas['RosterList']
export type RosterMember = Schemas['RosterMember']
export type AssignableList = Schemas['AssignableList']
export type AssignableAccount = Schemas['AssignableAccount']
export type Membership = Schemas['Membership']
export type MembershipChange = Schemas['MembershipChange']
export type CoordinatorResult = Schemas['CoordinatorResult']
export type Department = Schemas['Department']
export type DepartmentList = Schemas['DepartmentList']
export type DeletedDepartment = Schemas['DeletedDepartment']
export type DeletedDepartmentList = Schemas['DeletedDepartmentList']
export type ProgramDepartment = Schemas['ProgramDepartment']
export type ProgramDepartmentList = Schemas['ProgramDepartmentList']
export type ProgramDepartmentLink = Schemas['ProgramDepartmentLink']
export type DashboardReport = Schemas['DashboardReport']
export type CoordinatorshipStat = Schemas['CoordinatorshipStat']
export type CreateUserRequest = Schemas['CreateUserRequest']
export type CreateDepartmentRequest = Schemas['CreateDepartmentRequest']
export type UpdateDepartmentRequest = Schemas['UpdateDepartmentRequest']
export type DepartmentKind = CreateDepartmentRequest['kind']

// --- Eylem değişkenleri (düz nesne; KESİN 15) ------------------------------------------------

/**
 * S2 uçlarının program hedefi: eylem anındaki seçili program. İstek başlığı
 * (`X-Nizamio-Program`) bundan yazılır; departman YOL parametresidir, `X-Nizamio-Department`
 * gönderilmez (05 backend §6 "Kapsam sınıfları karışık").
 */
export interface ProgramRef {
  programId: string
}

export interface DepartmentRef extends ProgramRef {
  departmentId: string
}

export interface MemberRef extends DepartmentRef {
  accountId: string
}

export interface AssignMembershipInput extends DepartmentRef {
  accountId: string
  /** Koordinatörde sunucu `uye`'ye zorlar (ORGANIZATION-K14). */
  role: TeamRole
}

export interface ChangeRoleInput extends MemberRef {
  role: TeamRole
}

export interface AssignCoordinatorInput extends DepartmentRef {
  accountId: string
}

export interface CreateUserInput {
  email: string
  fullName?: string
  programId: string
  departmentId: string
  role: TeamRole
  /** 409 `organization.transfer_available` sonrası "mevcut hesabı bu departmana ekle". */
  transferAccountId?: string
}

export interface UpdateUserInput {
  accountId: string
  changes: {
    fullName?: string
    email?: string
    companyAdmin?: boolean
  }
}

/** Geçici parola (05 satır dışı, P14): YALNIZ form belleğinde; önbelleğe/sonuca girmez. */
export interface TemporaryPasswordInput {
  accountId: string
  password: string
}

export interface AccountRef {
  accountId: string
}

export interface CreateDepartmentInput {
  name: string
  kind: DepartmentKind
  code?: string
  description?: string
}

export interface LinkDepartmentInput extends DepartmentRef {
  /** Programdaki ad (2–120); verilmezse katalog adı. */
  displayName?: string
  copyMembersFromProgramId?: string
}

/** Yeni koordinatörlük = katalog kaydı + programa bağ (E-08-05; iki adım, atomik değil). */
export interface CreateCoordinatorshipInput extends ProgramRef {
  department: CreateDepartmentInput
  displayName?: string
}

export interface RenameDepartmentLinkInput extends DepartmentRef {
  displayName: string
}

export interface UpdateDepartmentInput {
  departmentId: string
  changes: UpdateDepartmentRequest
}

// --- Görünüm modelleri ------------------------------------------------------------------------

/** `memberships[]` etiketinin (`program:departman:rol`) ayrıştırılmış hâli (G16). */
export interface MembershipLabel {
  programId: string
  departmentId: string
  role: TeamRole
}

/** Kişi seçici seçeneği (W74 `PersonPicker`). */
export interface PersonOption {
  accountId: string
  fullName: string
}

/** 08 kartı: program bağı (`listProgramDepartments`) ⋈ rapor satırı (`coordinatorship_stats`). */
export interface CoordinatorshipView {
  departmentId: string
  /** Programdaki ad (`display_name`; her yerde bu, G13). */
  displayName: string
  /** `code` yoksa `null` (rozet baş harflerden, E-08-28). */
  code: string | null
  /** Raporda olmayan birim (yarış) → `null`; sayılar "—" (08 backend §4). */
  stat: CoordinatorshipStat | null
}

/** Sonsuz liste özeti: yüklenen küme tam mı, sunucu kesti mi (§10, GAP-027). */
export interface ListCompleteness {
  /** İmleç bitti: sayaçlar kesin ("Toplam N" yazılabilir). */
  complete: boolean
  /** `X-Result-Truncated: true` — "liste eksik olabilir". */
  truncated: boolean
}

/** `listUsers` süzgeçleri (S1; anahtar `['users', filters]`). Rol süzgeci sunucuya GİTMEZ (ret). */
export interface UserListFilters {
  /** Sunucu `search` (yalnız ad, Türkçe katlamalı; E-05-07); boş/`null` → gönderilmez. */
  search: string | null
  /** `sort_by=name` açıkça; yön (E-05-10). */
  sortOrder: SortOrder
}

export type SortOrder = 'asc' | 'desc'

/** Sayfa + sunucu kesme bayrağı (`X-Result-Truncated`). */
export interface UserPage {
  page: UserList
  truncated: boolean
}

/** openapi-fetch sonucu (yalnız başlık okuma yardımcısı için). */
export interface FetchResultLike<D> {
  data?: D
  error?: unknown
  response: Response
}
