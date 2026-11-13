// W142 · O3: durumlu sahte rapor sunucusu (bilet → tüketim, dönem/toplantı JSON'u, toplantılar).
// W82a harness'inin (`createBackend`) üstüne `server.use` ile eklenir; yetki çağıranın belirtecinden
// ve sunucu olgularından (admin bayrağı + üyelik satırları) hesaplanır, GÖRÜNÜRLÜK SÜZÜLMEDEN döner
// (istemci süzmesi kusurları görünsün). Bilet üretimi ve tüketim hataları ayrı anahtarlardır:
// `platform.rate_limited` bilet üretiminde, `reporting.*` (slot, doğrulama, yetki) tüketimde gelir.
import { http, HttpResponse } from 'msw'

import { envelope, fakeOrg, json, ORIGIN, type Account, type OrgDb } from './fake-org'
import { meetingBody, seasonBody } from './fake-reports-data'

export type IssueFault = 'ok' | 'rate_limited' | 'target_invalid'
export type RedeemFault =
  | 'ok'
  | 'export_in_progress'
  | 'rate_limited'
  | 'capacity_full'
  | 'input_invalid'
  | 'not_found'
  | 'ticket_invalid'
  | 'not_authorized'
export type SeasonFault =
  'ok' | 'empty' | 'export_in_progress' | 'rate_limited' | 'capacity_full' | 'error'

export interface FakeMeeting {
  meeting_id: string
  program_id: string
  title: string
  owner_department_id: string
  /** Dahil edilen departmanlar (sahip dahil). */
  department_ids: string[]
}

/** Üretilmiş bilet (tüketimde hesabın olguları ve hedef buradan okunur). */
export interface Issued {
  method: string
  path: string
  body: unknown
  program: string
  account: string
}

export interface ReportsState {
  issue: IssueFault
  redeem: RedeemFault
  season: SeasonFault
  filename: string
  /** Bilet kimliği → üretim isteği. */
  tickets: Map<string, Issued>
  /** Tüketilen bilet sayısı (ikinci bilet / tekrar tüketim yakalamak için). */
  redeemed: string[]
  meetings: FakeMeeting[]
  holds: Array<{ method: string; path: string; gate: Promise<void>; arrived: () => void }>
}

export function createReportsState(): ReportsState {
  return {
    issue: 'ok',
    redeem: 'ok',
    season: 'ok',
    filename: 'donem-raporu-2026.pdf',
    tickets: new Map(),
    redeemed: [],
    meetings: [],
    holds: [],
  }
}

const PDF = Uint8Array.from([37, 80, 68, 70, 45, 49, 46, 55])

function limited(code: string, retryAfter: string | null) {
  return HttpResponse.json(
    { code, message: 'x', request_id: 'r', fields: [] },
    { status: 429, headers: retryAfter ? { 'Retry-After': retryAfter } : {} },
  )
}

class Fake {
  constructor(
    readonly db: OrgDb,
    readonly state: ReportsState,
  ) {}
  me(request: Request): Account | null {
    return fakeOrg.actorOf(this.db, request)
  }
  coordinates(account: Account, program: string, departments: string[]): boolean {
    return this.db.memberships.some(
      (m) =>
        m.account_id === account.account_id &&
        m.program_id === program &&
        m.team === 'coordinator' &&
        departments.includes(m.department_id),
    )
  }
  /** Rapor yolunun çağıran için yetkisi: `null` = yetkili, yoksa hata yanıtı. */
  authorize(account: Account, program: string, path: string): Response | null {
    const deny = envelope('reporting.not_authorized', 403)
    if (account.admin) return null
    const meeting = /^\/v1\/reports\/meetings\/([^/]+)\/pdf$/.exec(path)
    if (meeting) {
      const found = this.state.meetings.find((m) => m.meeting_id === meeting[1])
      if (!found) return envelope('reporting.not_found', 404)
      return this.coordinates(account, program, found.department_ids) ? null : deny
    }
    const task = /^\/v1\/reports\/tasks\/([^/]+)\/pdf$/.exec(path)
    if (task) {
      const found = this.db.items.find((i) => i.work_item_id === task[1])
      if (!found) return envelope('reporting.not_found', 404)
      return this.coordinates(account, program, [found.department_id]) ? null : deny
    }
    return deny
  }
}

/** Tüketimde sunucu hatası (slot, doğrulama, yetki); yoksa `null` = PDF. */
function redeemFault(f: Fake, issued: Issued, account: Account): Response | null {
  const { db, state } = f
  const denied = f.authorize(account, issued.program, issued.path)
  if (denied) return denied
  const members = (issued.body as { member_ids?: string[] } | undefined)?.member_ids ?? []
  const unknown = members.filter((id) => !db.accounts.some((a) => a.account_id === id))
  if (unknown.length > 0 || state.redeem === 'input_invalid') {
    return envelope('reporting.input_invalid', 422, [
      { field: 'member_ids', code: 'reporting.member_invalid' },
    ])
  }
  switch (state.redeem) {
    case 'not_found':
      return envelope('reporting.not_found', 404)
    case 'not_authorized':
      // Yetki kaybı: hesap artık şirket yöneticisi değil (sonraki `me` bunu söyler).
      account.admin = false
      return envelope('reporting.not_authorized', 403)
    case 'export_in_progress':
      return limited('reporting.export_in_progress', '1')
    case 'rate_limited':
      return limited('platform.rate_limited', '60')
    case 'capacity_full':
      return envelope('reporting.capacity_full', 503)
    default:
      return null
  }
}

async function issue(f: Fake, request: Request): Promise<Response | undefined> {
  const { state } = f
  const body = (await request.clone().json()) as { method: string; path: string; body?: unknown }
  // Arşiv bileti rapor değildir: arşiv sahte sunucusuna düşer.
  if (!body.path.startsWith('/v1/reports/')) return undefined
  const account = f.me(request)
  if (!account) return envelope('platform.unauthenticated', 401)
  if (!request.headers.get('X-Requested-With')) return envelope('platform.csrf_required', 403)
  const program = request.headers.get('X-Nizamio-Program') ?? ''
  if (!program) return envelope('platform.scope_required', 400)
  if (state.issue === 'rate_limited') return limited('platform.rate_limited', '17')
  if (state.issue === 'target_invalid') return envelope('identity.download_target_invalid', 422)
  const ticket = `rt-${state.tickets.size + 1}`
  state.tickets.set(ticket, {
    method: body.method,
    path: body.path,
    body: body.body,
    program,
    account: account.account_id,
  })
  return json({ ticket, url: `/v1/downloads/${ticket}`, expires_at: '2026-11-13T10:01:00Z' })
}

function ticketHandlers(f: Fake) {
  const { db, state } = f
  return [
    http.post(`${ORIGIN}/v1/download-tickets`, ({ request }) => issue(f, request)),
    // Tüketim S0: kimlik bilettedir (başlık yok); yetki bileti üreten hesabın olgularından.
    http.get(`${ORIGIN}/v1/downloads/:ticket`, ({ params }) => {
      const key = String(params.ticket)
      const issued = state.tickets.get(key)
      if (!issued) return undefined
      const account = db.accounts.find((a) => a.account_id === issued.account)!
      state.redeemed.push(key)
      if (state.redeem === 'ticket_invalid') {
        return envelope('identity.download_ticket_invalid', 404)
      }
      state.tickets.delete(key)
      return (
        redeemFault(f, issued, account) ??
        new HttpResponse(PDF, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${state.filename}"`,
          },
        })
      )
    }),
  ]
}

function jsonHandlers(f: Fake) {
  const { db, state } = f
  const adminOnly = (request: Request) => {
    const account = f.me(request)
    if (!account) return envelope('platform.unauthenticated', 401)
    return account.admin ? null : envelope('reporting.not_authorized', 403)
  }
  return [
    http.get(`${ORIGIN}/v1/reports/season`, ({ request }) => {
      const denied = adminOnly(request)
      if (denied) return denied
      switch (state.season) {
        case 'export_in_progress':
          return limited('reporting.export_in_progress', '1')
        case 'rate_limited':
          return limited('platform.rate_limited', '60')
        case 'capacity_full':
          return envelope('reporting.capacity_full', 503)
        case 'error':
          return envelope('platform.internal', 500)
      }
      const program = fakeOrg.programOf(request)
      const base = seasonBody(
        program,
        db.programs.find((p) => p.program_id === program)?.name ?? '',
      )
      if (state.season === 'ok') return json(base)
      return json({
        ...base,
        coordinatorship_performance: [],
        monthly_activity: [],
        tasks: [],
        stats: { ...base.stats, total_tasks: 0, completed_tasks: 0, overdue_tasks: 0 },
      })
    }),
    http.get(`${ORIGIN}/v1/reports/meetings/:id`, ({ request, params }) => {
      const denied = adminOnly(request)
      if (denied) return denied
      const found = state.meetings.find((m) => m.meeting_id === params.id)
      if (!found) return envelope('reporting.not_found', 404)
      return json(meetingBody(found.meeting_id, found.title))
    }),
  ]
}

function meetingHandlers(f: Fake) {
  const { db, state } = f
  const shape = (m: FakeMeeting, account: Account) => ({
    meeting_id: m.meeting_id,
    program_id: m.program_id,
    title: m.title,
    meeting_date: '2026-11-11T10:00:00Z',
    created_at: '2026-11-10T10:00:00Z',
    updated_at: '2026-11-10T10:00:00Z',
    created_by_account_id: 'acc-admin',
    created_by_role: 'admin',
    invite_mode: 'coordinatorship',
    owner_department_id: m.owner_department_id,
    departments: m.department_ids.map((id) => ({
      department_id: id,
      department_name: db.links.find((l) => l.department_id === id)?.display_name ?? id,
    })),
    members_included: true,
    place: null,
    agenda: [],
    participants: [],
    notes: { items: [], next_cursor: '' },
    viewer_role: account.admin
      ? 'admin'
      : f.coordinates(account, m.program_id, m.department_ids)
        ? 'coordinator'
        : 'member',
  })
  const known = (request: Request) => f.me(request)
  return [
    http.get(`${ORIGIN}/v1/meetings/deleted`, () => json({ items: [], next_cursor: '' })),
    http.get(`${ORIGIN}/v1/meetings`, ({ request }) => {
      const account = known(request)
      if (!account) return envelope('platform.unauthenticated', 401)
      return json({ items: state.meetings.map((m) => shape(m, account)), next_cursor: '' })
    }),
    http.get(`${ORIGIN}/v1/meetings/:id`, ({ request, params }) => {
      const account = known(request)
      const found = state.meetings.find((m) => m.meeting_id === params.id)
      if (!account) return envelope('platform.unauthenticated', 401)
      return found ? json(shape(found, account)) : envelope('meetings.not_found', 404)
    }),
    http.get(`${ORIGIN}/v1/meetings/:id/notes`, () => json({ items: [], next_cursor: '' })),
  ]
}

export function reportsHandlers(db: OrgDb, state: ReportsState) {
  const f = new Fake(db, state)
  const holdHandler = http.all(`${ORIGIN}/v1/*`, async ({ request }) => {
    const path = new URL(request.url).pathname
    const at = state.holds.findIndex((h) => h.method === request.method && h.path === path)
    if (at < 0) return undefined
    const [hold] = state.holds.splice(at, 1)
    hold!.arrived()
    await hold!.gate
    return undefined
  })
  return [holdHandler, ...ticketHandlers(f), ...jsonHandlers(f), ...meetingHandlers(f)]
}

/** `method path` isteğini sunucuya ulaştığı anda bekletir; `release()` yanıtı bırakır. */
export function holdReports(state: ReportsState, method: string, path: string) {
  let release!: () => void
  let arrived!: () => void
  const gate = new Promise<void>((resolve) => (release = resolve))
  const reached = new Promise<void>((resolve) => (arrived = resolve))
  state.holds.push({ method, path, gate, arrived })
  return { release, arrived: reached }
}
