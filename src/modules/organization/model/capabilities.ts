/**
 * Organizasyon modülü eylem görünürlüğü (K1). Saf fonksiyonlar; girdi yalnız sunucu
 * OLGULARIDIR (`me.company_admin`, seçili programdaki ekip satırları, hedef hesabın kendisi olup
 * olmadığı, hedefin o departmandaki rolü). Mercek girdi DEĞİLDİR (ortak-kurallar §1, P1):
 * şirket yöneticisi Koordinatör/Üye merceğine geçince yetkileri ve Yönetim grubu korunur.
 * Gizleme güvenlik değildir: sunucu her istekte denetler, 403/404 gerçek sonuçtur. Yetkisiz
 * eylem GİZLENİR; hedef = çağıran ise yıkıcı eylemler gizlenir (ORGANIZATION-K20).
 *
 * Kaynak: `istemci-akislari.md` §4'te kullanıcı/hesap/üyelik/departman satırı YOKTUR (BE-036
 * madde 5, 6 kapanana dek K1 istisnası; 05/08 README satır dışı "Eylem görünürlüğü"). Kurallar
 * `docs/ekranlar/05-kullanicilar/backend.md` §3 ve `08-koordinatorlukler/backend.md` §3
 * tablolarından; her satırın yanında backend modül kural kimliği (ORGANIZATION-K*, PROGRAM-K*,
 * REPORTING-K*) yazılıdır. Ürün kararları: P13 (05 yalnız yönetici), P16 (08 yalnız yönetici).
 *
 * Rol DİZESİ karşılaştırması (`'koordinator'` / `'uye'`) yalnız bu dosyada yapılır (lint K1);
 * `memberships` etiketlerinin rol parçası `teamRoleOf` ile istemci tipine çevrilir.
 */
import type { TeamRole } from '@/shared/scope/standing-facts'
import { scopeFacts, type Standing } from '@/shared/scope/standing-facts'

// --- Sunucu rol değerleri (yalnız burada) ---------------------------------------------------

/** Sunucunun ekip satırı rolü → istemci tipi; bilinmeyen değer `null` (satır yok sayılır). */
export function teamRoleOf(raw: string): TeamRole | null {
  if (raw === 'koordinator') return 'coordinator'
  if (raw === 'uye') return 'member'
  return null
}

/** İstemci rolü → sunucu değeri (`AssignMembershipRequest.role`, `ChangeRoleRequest.role`). */
export function serverRoleOf(role: TeamRole): 'koordinator' | 'uye' {
  return role === 'coordinator' ? 'koordinator' : 'uye'
}

/**
 * 05 rol sekmesi (E-05-06) URL değerleri — `rol` süzgecinin değer kümesi (rota kataloğu buradan
 * okur; K1 lint: rol dizesi yalnız capability dosyasında).
 */
export const USER_ROLE_TABS = ['tumu', 'admin', 'koordinator', 'uye'] as const
export type UserRoleTab = (typeof USER_ROLE_TABS)[number]

/** `listUsers.role` değer kümesi (v0.14): şirket yöneticisi ya da "herhangi bir programda" rol. */
export type UserRoleFilter = 'company_admin' | ReturnType<typeof serverRoleOf>

/**
 * Sekmenin sunucu `role` süzgeci (BE-042/BE-011): "Tümü" süzgeçsizdir; "Admin" şirket olgusu
 * (`company_admin`); Koordinatör/Üye "herhangi bir programda bu rol" (ADR-0023 k.18). Sayaçlar
 * aynı yanıtın `role_counts`'undan (`countsByTab`), istemci süzmesi yoktur.
 */
export function userRoleFilterOf(tab: UserRoleTab): UserRoleFilter | null {
  if (tab === 'admin') return 'company_admin'
  const role = teamRoleOf(tab)
  return role === null ? null : serverRoleOf(role)
}

/** Hesap şirket yöneticisi mi (`KnownUser.company_admin`; okuma yalnız burada, K1). */
export const isCompanyAdmin = (user: { company_admin: boolean }): boolean => user.company_admin

/** `UserList.role_counts` → sekme sayaçları. */
export function countsByTab(counts: {
  all: number
  company_admin: number
  koordinator: number
  uye: number
}): Record<UserRoleTab, number> {
  return {
    tumu: counts.all,
    admin: counts.company_admin,
    koordinator: counts.koordinator,
    uye: counts.uye,
  }
}

// --- Olgular ---------------------------------------------------------------------------------

/** Yönetim ekranlarının (05, 05b, 08, 08b) ve kenar menüsü Yönetim grubunun kapısı. */
export interface AdministrationFacts {
  /** Standing geldi mi (`me` + `me/departments`); gelmeden Yönetim gösterilmez (E-00-11). */
  ready: boolean
  companyAdmin: boolean
}

/** Bir departman (ve isteğe bağlı hedef hesap) için çağıranın olguları. */
export interface OrganizationActorFacts {
  companyAdmin: boolean
  /** Çağıran bu departmanın SEÇİLİ PROGRAMDAKİ koordinatörü mü. */
  coordinator: boolean
  /** Hedef hesap çağıranın kendisi mi (yıkıcı eylemler gizli; ORGANIZATION-K20). */
  self: boolean
  /** Hedefin bu departmandaki rolü; bilinmiyorsa `null` (en dar güvenli davranış). */
  targetRole: TeamRole | null
  /** Çağıran seçili programda herhangi bir departmanın koordinatörü mü (05 `deleteUser`, K). */
  coordinatesAny: boolean
}

export function administrationFacts(standing: Standing | null): AdministrationFacts {
  return { ready: standing !== null, companyAdmin: standing?.companyAdmin === true }
}

/**
 * Departman / hedef hesap olguları: yetki SEÇİLİ PROGRAMDAKİ `(program, departman)` satırından
 * (mercekten bağımsız, P1). Standing yoksa her olgu `false` (eylem gizli).
 */
export function organizationFacts(
  standing: Standing | null,
  programId: string | null,
  target: {
    departmentId?: string | null
    accountId?: string | null
    targetRole?: TeamRole | null
  } = {},
): OrganizationActorFacts {
  const facts = scopeFacts(standing, programId, target.departmentId ?? null)
  const coordinatesAny =
    standing !== null &&
    programId !== null &&
    standing.rows.some((row) => row.programId === programId && row.role === 'coordinator')
  return {
    companyAdmin: facts.companyAdmin,
    coordinator: facts.coordinator,
    self: standing !== null && target.accountId != null && target.accountId === standing.accountId,
    targetRole: target.targetRole ?? null,
    coordinatesAny,
  }
}

// --- Yetenekler ------------------------------------------------------------------------------

export type OrganizationCapability =
  | 'createUser'
  | 'setTemporaryPassword'
  | 'unlockAccount'
  | 'changeAccountStatus'
  | 'deleteUser'
  | 'changeCompanyAdmin'
  | 'assignMembership'
  | 'chooseMembershipRole'
  | 'changeMembershipRole'
  | 'removeMember'
  | 'assignCoordinator'
  | 'removeCoordinator'
  | 'viewTeam'
  | 'createDepartment'
  | 'editDepartment'
  | 'readReport'

/** Her kararın kaynağı (denetim izi; tablo testi bunu okur). */
export const ORGANIZATION_CAPABILITY_SOURCES: Readonly<Record<OrganizationCapability, string>> = {
  createUser:
    '05 backend §3 E-05-05 — createUser: ŞY; K yalnız koordine ettiği departmana, rol uye (ORGANIZATION README POST /v1/admin/users)',
  setTemporaryPassword:
    '05 backend §3 E-05-05 ek — updateAccount {password}: yalnız ŞY (ORGANIZATION-K36); P14',
  unlockAccount:
    '05 backend §3 E-05-35 — unlockAccount: yalnız ŞY; koşul satırdaki `login_locked` (BE-044, v0.14)',
  changeAccountStatus:
    '05 backend §3 E-05-35 — disableAccount / enableAccount: yalnız ŞY (BE-012, v0.14); hedef ≠ çağıran (kendini kapatma kilitlenme)',
  deleteUser:
    '05 backend §3 E-05-36 — deleteUser: ŞY ∨ K (K koşulu istemcide hesaplanamaz → 403 ile karşılanır, ORGANIZATION-K26/K27); hedef ≠ çağıran (K20)',
  changeCompanyAdmin:
    '05 backend §3 E-05-31 — updateUser {company_admin}: ŞY; hedef ≠ çağıran (son yönetici 409 last_admin)',
  assignMembership:
    "05/08 backend §3 E-05-33, E-08-79 — assignMembership: ŞY ∨ bu departmanın K (rol uye'ye zorlanır, ORGANIZATION-K14)",
  chooseMembershipRole:
    "08 backend §2 E-08-79 — rol seçici: yalnız ŞY (K'nin gönderdiği rol sunucuda uye'ye zorlanır; K formunda seçici yok)",
  changeMembershipRole:
    '05/08 backend §3 — updateMembershipRole: yalnız ŞY; hedef ≠ çağıran (ORGANIZATION-K20)',
  removeMember:
    '05/08 backend §3 E-05-32 — removeMember: ŞY ∨ (bu departmanın K ∧ hedef uye; ORGANIZATION-K14/K47); hedef ≠ çağıran (K20)',
  assignCoordinator:
    '08 backend §3 E-08-33 — assignCoordinator: yalnız ŞY (openapi "Yalnız şirket yöneticisi")',
  removeCoordinator:
    '05/08 backend §3 — removeCoordinator: yalnız ŞY; hedef ≠ çağıran (GAP-089, ORGANIZATION-K46)',
  viewTeam:
    '08 backend §3 E-08-59/E-08-78 — listMembers: ŞY ∨ bu departmanın K (ORGANIZATION-K15); Ü yok (P16)',
  createDepartment:
    '08 backend §3 E-08-05 — createDepartment + linkDepartment: ŞY (ORGANIZATION-K08, PROGRAM-K04)',
  editDepartment:
    '08 backend §3 E-08-63/E-08-70 — renameDepartmentLink / updateDepartment: ŞY (ORGANIZATION-K08)',
  readReport: '08 backend §3 — reportDashboard tabanlı sayılar: yalnız ŞY (REPORTING-K01)',
}

/** Yönetim grubu ve 05/05b/08/08b rota kapısı (P1, P13, P16; E-00-23/24): yalnız ŞY olgusu. */
export function canSeeAdministration(f: AdministrationFacts): boolean {
  return f.ready && f.companyAdmin
}

const notSelf = (f: OrganizationActorFacts) => !f.self

export const ORGANIZATION_CAPABILITIES: Readonly<
  Record<OrganizationCapability, (f: OrganizationActorFacts) => boolean>
> = {
  createUser: (f) => f.companyAdmin || f.coordinator,
  setTemporaryPassword: (f) => f.companyAdmin,
  unlockAccount: (f) => f.companyAdmin,
  changeAccountStatus: (f) => f.companyAdmin && notSelf(f),
  deleteUser: (f) => (f.companyAdmin || f.coordinatesAny) && notSelf(f),
  changeCompanyAdmin: (f) => f.companyAdmin && notSelf(f),
  assignMembership: (f) => f.companyAdmin || f.coordinator,
  chooseMembershipRole: (f) => f.companyAdmin,
  changeMembershipRole: (f) => f.companyAdmin && notSelf(f),
  removeMember: (f) =>
    notSelf(f) && (f.companyAdmin || (f.coordinator && f.targetRole === 'member')),
  assignCoordinator: (f) => f.companyAdmin,
  removeCoordinator: (f) => f.companyAdmin && notSelf(f),
  viewTeam: (f) => f.companyAdmin || f.coordinator,
  createDepartment: (f) => f.companyAdmin,
  editDepartment: (f) => f.companyAdmin,
  readReport: (f) => f.companyAdmin,
}

/** Tek yetenek sorgusu (bileşenler `can('removeMember', facts)` biçiminde okur). */
export function can(capability: OrganizationCapability, facts: OrganizationActorFacts): boolean {
  return ORGANIZATION_CAPABILITIES[capability](facts)
}
