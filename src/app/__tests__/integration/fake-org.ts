// W82a entegrasyon turu: DURUMLU sahte NIZAM.IO backend'i (MSW). Bütün F2 + web-1 görev
// ekranlarının okuduğu/yazdığı uçlar tek veri kümesi üstünde çalışır; yazma sonrası yeniden okuma
// GERÇEK sunucu durumunu görür (önbellek tazelenmediyse ekran bayat kalır — testin aradığı da bu).
//
// Sözleşme sadakati (pinli spec, `istemci-akislari.md`):
//  - Yetki çağıranın erişim belirtecinden (giriş yapan hesap) hesaplanır; yetkili görünürlükte
//    SÜZMEDEN döner, yetkisizde 403 / liste dışlama uygular (yönetici uçları `*.not_authorized`,
//    üye yalnız kendisine atanan görevleri görür, görünmeyen görev 403 `work.not_assigned` / 404).
//  - `removeMember`, `removeCoordinator`, `updateMembershipRole`: kişinin bu birimde açık ataması
//    varsa onaysız istek 409 `organization.confirmation_required` (görev başlıkları `fields[]`);
//    onaylı istekte atamalar işlemi yapana devredilir (ORGANIZATION-K17/K18/K29).
//  - Rapor (`reportDashboard`) veri kümesinden her istekte yeniden hesaplanır.
// Rol DİZELERİ bu dosyada yazılmaz (K1 lint): test dosyası `roles` ile verir.
import { http, HttpResponse, type JsonBodyType } from 'msw'

import type { TeamRole } from '@/shared/scope/standing-facts'

export const ORIGIN = 'http://localhost'
export const PASSWORD = 'dogru-parola'

export type ServerRoles = Readonly<Record<TeamRole, string>>

export interface Account {
  account_id: string
  full_name: string
  email: string
  admin: boolean
  deleted?: boolean
  /** v0.14: hesap kapatılmış (`disableAccount`) / süren giriş kilidi. */
  disabled?: boolean
  locked?: boolean
}

export interface Membership {
  program_id: string
  department_id: string
  account_id: string
  team: TeamRole
  membership_id: string
}

export interface CatalogDepartment {
  department_id: string
  name: string
  kind: string
  code?: string
  description?: string
}

export interface Link {
  program_id: string
  department_id: string
  display_name: string
}

export interface ProgramRow {
  program_id: string
  name: string
  year?: number
}

/** Görev (sözleşme `WorkItem` şekli; yalnız testin değiştirdiği alanlar tipli). */
export interface Item {
  work_item_id: string
  program_id: string
  department_id: string
  title: string
  status: string
  assignees: { account_id: string; full_name: string }[]
  assignee_account_ids: string[]
  [field: string]: unknown
}

export interface DateRequestRow {
  request_id: string
  work_item_id: string
  status: 'pending' | 'approved' | 'rejected'
  old_start_on: string
  old_end_on: string
  new_start_on: string
  new_end_on: string
  reason?: string
  /** Talebi açan hesap (`myDateChangeRequests` yalnız kendisininkini döndürür). */
  requester: string
}

export interface DependencyRow {
  dependency_id: string
  work_item_id: string
  depends_on_work_item_id: string
}

export interface OrgDb {
  roles: ServerRoles
  accounts: Account[]
  programs: ProgramRow[]
  catalog: CatalogDepartment[]
  links: Link[]
  memberships: Membership[]
  items: Item[]
  transfers: Record<string, unknown>[]
  /** Tarih değişikliği talepleri (sözleşme `DateChangeRequest` + istemci olmayan `requester`). */
  dateRequests: DateRequestRow[]
  /** Görev bağımlılıkları: `work_item_id` `depends_on_work_item_id` bitmeden başlayamaz. */
  dependencies: DependencyRow[]
  /** Görev kimliği → alt görevler (sözleşme `WorkItemSubtask` şekli). */
  subtasks: Record<string, Record<string, unknown>[]>
  /** Erişim belirteci → hesap (yetki her istekte belirteçten). */
  tokens: Map<string, string>
  /** `true` ise sonraki `linkDepartment` 409 `program.department_link_name_exists` (bir kez). */
  failNextLink: boolean
  seq: number
}

export function createDb(roles: ServerRoles, seed: Partial<OrgDb> = {}): OrgDb {
  return {
    roles,
    accounts: [],
    programs: [],
    catalog: [],
    links: [],
    memberships: [],
    items: [],
    transfers: [],
    dateRequests: [],
    dependencies: [],
    subtasks: {},
    tokens: new Map(),
    failNextLink: false,
    seq: 0,
    ...seed,
  }
}

/** Görev listesi satırı (sözleşme şekli). */
export function item(
  id: string,
  programId: string,
  departmentId: string,
  assignee: Account | null,
  patch: Partial<Item> = {},
): Item {
  return {
    work_item_id: id,
    program_id: programId,
    department_id: departmentId,
    title: `Görev ${id}`,
    description: '',
    priority: 'orta',
    status: 'baslanmadi',
    assignees: assignee ? [{ account_id: assignee.account_id, full_name: assignee.full_name }] : [],
    assignee_account_ids: assignee ? [assignee.account_id] : [],
    start_on: '2026-11-01',
    end_on: '2026-12-10',
    is_overdue: false,
    days_overdue: 0,
    is_completed_late: false,
    days_late: 0,
    is_completed_early: false,
    days_early: 0,
    completion_evidence_required: false,
    subtask_counts: { total: 0, done: 0 },
    pending_date_request: null,
    created_at: '2026-11-01T08:00:00Z',
    created_by_account_id: 'acc-admin',
    created_by_full_name: 'Yönetici',
    edit_revision: 1,
    dates_revision: 1,
    ...patch,
  }
}

// --- Yardımcılar ----------------------------------------------------------------------------

export function json(body: JsonBodyType, status = 200, headers: Record<string, string> = {}) {
  return HttpResponse.json(body, { status, headers })
}

export function envelope(code: string, status: number, fields: unknown[] = []) {
  return HttpResponse.json(
    { code, message: 'iç metin gösterilmez', request_id: `req-${code}`, fields },
    { status },
  )
}

const forbidden = (domain: string) => envelope(`${domain}.not_authorized`, 403)

function next(db: OrgDb, prefix: string): string {
  db.seq += 1
  return `${prefix}-${db.seq}`
}

/** Sunucunun rol dizesi → istemci tipi (eşleşmeyen dize `null`). */
function teamOf(db: OrgDb, raw: unknown): TeamRole | null {
  const teams = Object.keys(db.roles) as TeamRole[]
  return teams.find((team) => db.roles[team] === raw) ?? null
}

/** Çağıran hesap (Bearer belirteci); belirteç yoksa / bilinmiyorsa `null`. */
function actorOf(db: OrgDb, request: Request): Account | null {
  const match = /^Bearer (.+)$/.exec(request.headers.get('Authorization') ?? '')
  const id = match ? db.tokens.get(match[1]!) : undefined
  return db.accounts.find((a) => a.account_id === id && !a.deleted) ?? null
}

const programOf = (request: Request) => request.headers.get('X-Nizamio-Program') ?? ''

function rowsOf(db: OrgDb, accountId: string, programId?: string): Membership[] {
  return db.memberships.filter(
    (m) => m.account_id === accountId && (programId === undefined || m.program_id === programId),
  )
}

function teamIn(db: OrgDb, accountId: string, programId: string, departmentId: string) {
  return (
    db.memberships.find(
      (m) =>
        m.account_id === accountId &&
        m.program_id === programId &&
        m.department_id === departmentId,
    )?.team ?? null
  )
}

const accountName = (db: OrgDb, id: string) =>
  db.accounts.find((a) => a.account_id === id)?.full_name ?? id

const isOpen = (i: Item) => i.status !== 'tamamlandi'

// --- Kimlik ve standing ---------------------------------------------------------------------

function authHandlers(db: OrgDb) {
  return [
    http.get(`${ORIGIN}/v1/instance/profile`, () =>
      json({
        display_name: 'Deneme A.Ş.',
        brand_color: '#1F4E79',
        timezone: 'Europe/Istanbul',
        api_version: 'v1',
        minimum_mobile_version: '0.0.0',
      }),
    ),
    http.post(`${ORIGIN}/v1/auth/login`, async ({ request }) => {
      const body = (await request.json()) as { email: string; password: string }
      const account = db.accounts.find((a) => a.email === body.email && !a.deleted)
      if (!account || body.password !== PASSWORD) {
        return envelope('identity.credentials_invalid', 401)
      }
      const token = `tok-${String(db.tokens.size + 1).padStart(16, '0')}`
      db.tokens.set(token, account.account_id)
      const now = Math.floor(Date.now() / 1000)
      return json({
        token,
        account_id: account.account_id,
        expires_at: now + 900,
        force_password_change: false,
      })
    }),
    http.post(`${ORIGIN}/v1/auth/logout`, () => new HttpResponse(null, { status: 204 })),
    http.post(`${ORIGIN}/v1/auth/refresh`, () => envelope('identity.session_invalid', 401)),
    http.get(`${ORIGIN}/v1/notifications/unread-count`, () => json({ count: 0 })),
  ]
}

function standingHandlers(db: OrgDb) {
  return [
    http.get(`${ORIGIN}/v1/me`, ({ request }) => {
      const me = actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      return json({
        account_id: me.account_id,
        email: me.email,
        full_name: me.full_name,
        company_admin: me.admin,
      })
    }),
    http.get(`${ORIGIN}/v1/me/departments`, ({ request }) => {
      const me = actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      return json({
        departments: rowsOf(db, me.account_id).map((m) => ({
          program_id: m.program_id,
          program_name: db.programs.find((p) => p.program_id === m.program_id)?.name ?? '',
          department_id: m.department_id,
          display_name: linkOf(db, m.program_id, m.department_id)?.display_name ?? '',
          role: db.roles[m.team],
        })),
      })
    }),
    http.get(`${ORIGIN}/v1/programs`, ({ request }) => {
      const me = actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      if (me.admin) return json({ programs: db.programs })
      const mine = new Set(rowsOf(db, me.account_id).map((m) => m.program_id))
      if (mine.size === 0) return envelope('organization.membership_required', 403)
      return json({ programs: db.programs.filter((p) => mine.has(p.program_id)) })
    }),
    http.get(`${ORIGIN}/v1/program/departments`, ({ request }) => {
      const me = actorOf(db, request)
      const program = programOf(request)
      if (!me || (!me.admin && rowsOf(db, me.account_id, program).length === 0)) {
        return forbidden('organization')
      }
      return json({ departments: programDepartments(db, program) })
    }),
  ]
}

function linkOf(db: OrgDb, programId: string, departmentId: string): Link | undefined {
  return db.links.find((l) => l.program_id === programId && l.department_id === departmentId)
}

function programDepartments(db: OrgDb, programId: string) {
  return db.links
    .filter((l) => l.program_id === programId)
    .map((l) => {
      const code = db.catalog.find((c) => c.department_id === l.department_id)?.code
      return { department_id: l.department_id, display_name: l.display_name, ...(code && { code }) }
    })
}

export const fakeOrg = {
  authHandlers,
  standingHandlers,
  actorOf,
  teamOf,
  teamIn,
  rowsOf,
  linkOf,
  next,
  accountName,
  isOpen,
  forbidden,
  programOf,
}
