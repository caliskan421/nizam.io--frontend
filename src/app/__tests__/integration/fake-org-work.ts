// Sahte backend: görevler (sunucu görünürlüğüyle), rapor panosu, program ve dönem aktarımı uçları.
// Ayrıntı ve sözleşme notları `fake-org.ts` başlığında.
import { http, HttpResponse } from 'msw'

import {
  envelope,
  fakeOrg as o,
  item,
  json,
  ORIGIN,
  PASSWORD,
  type Account,
  type Item,
  type OrgDb,
} from './fake-org'

/** Sunucu görünürlüğü (`listProgramWorkItems`): yönetici hepsi, koordinatör birimi, üye ataması. */
function visible(db: OrgDb, me: Account, i: Item): boolean {
  if (me.admin) return true
  const team = o.teamIn(db, me.account_id, i.program_id, i.department_id)
  return (
    team === 'coordinator' || (team === 'member' && i.assignee_account_ids.includes(me.account_id))
  )
}

/** Görünmeyen görev: birimde ekip satırı varsa 403 `work.not_assigned`, yoksa 404. */
function denied(db: OrgDb, me: Account, i: Item | undefined) {
  if (i && o.teamIn(db, me.account_id, i.program_id, i.department_id) !== null) {
    return envelope('work.not_assigned', 403)
  }
  return envelope('work.item_not_found', 404)
}

/** `is_overdue`: tamamlanmamış ve `end_on` bugünden önce (satır ve sayaç aynı kural; v0.13). */
function lateness(db: OrgDb, i: Item): Item {
  const late = i.status !== 'tamamlandi' && String(i.end_on) < db.today
  return late ? { ...i, is_overdue: true } : { ...i, is_overdue: false }
}

/** Bekleyen talep ayrıntısı yalnız yöneticiye ve görevin koordinatörüne dolar; üyede `null` (WORK-K82). */
function maskedItem(db: OrgDb, me: Account, i: Item): Item {
  const team = o.teamIn(db, me.account_id, i.program_id, i.department_id)
  const shaped = lateness(db, i)
  return me.admin || team === 'coordinator' ? shaped : { ...shaped, pending_date_request: null }
}

/** `department_id` (VE) ve tekrarlı `assignee_account_id` (VEYA) süzgeci; liste ve sayaç aynı. */
function filtered(db: OrgDb, request: Request, me: Account): Item[] {
  const query = new URL(request.url).searchParams
  const department = query.get('department_id')
  const assignees = query.getAll('assignee_account_id').filter((id) => id !== '')
  return db.items
    .filter(
      (i) =>
        i.program_id === o.programOf(request) &&
        (!department || i.department_id === department) &&
        (assignees.length === 0 || assignees.some((id) => i.assignee_account_ids.includes(id))) &&
        visible(db, me, i),
    )
    .map((i) => maskedItem(db, me, i))
}

/** `countProgramWorkItems` gövdesi (WORK-K87): toplam, beş durum, geciken, talepli. */
function countsOf(rows: Item[]) {
  const by_status = {
    baslanmadi: 0,
    devam_ediyor: 0,
    onaya_sunuldu: 0,
    iade_edildi: 0,
    tamamlandi: 0,
  }
  for (const i of rows) by_status[i.status as keyof typeof by_status] += 1
  return {
    total: rows.length,
    by_status,
    overdue: rows.filter((i) => i.is_overdue).length,
    pending_date_requests: rows.filter((i) => i.pending_date_request).length,
  }
}

function guardedItem(
  db: OrgDb,
  request: Request,
  id: unknown,
  ok: (i: Item) => Response,
): Response {
  const me = o.actorOf(db, request)
  if (!me) return envelope('platform.unauthenticated', 401)
  const found = db.items.find((i) => i.work_item_id === id && i.program_id === o.programOf(request))
  return found && visible(db, me, found) ? ok(found) : denied(db, me, found)
}

function workReads(db: OrgDb) {
  return [
    http.get(`${ORIGIN}/v1/program/work-items`, ({ request }) => {
      const me = o.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      return json({ items: filtered(db, request, me) })
    }),
    http.get(`${ORIGIN}/v1/program/work-items/counts`, ({ request }) => {
      const me = o.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      return json(countsOf(filtered(db, request, me)))
    }),
    http.get(`${ORIGIN}/v1/work-items/:id`, ({ request, params }) =>
      guardedItem(db, request, params.id, (i) => json(maskedItem(db, o.actorOf(db, request)!, i))),
    ),
    http.get(`${ORIGIN}/v1/work-items/:id/files`, ({ request, params }) =>
      guardedItem(db, request, params.id, () => json({ files: [] })),
    ),
    http.get(`${ORIGIN}/v1/work-items/:id/subtasks`, ({ request, params }) =>
      guardedItem(db, request, params.id, () => {
        const subtasks = db.subtasks[String(params.id)] ?? []
        return json({ subtasks, total: subtasks.length })
      }),
    ),
    http.get(`${ORIGIN}/v1/work-items/:id/notes`, ({ request, params }) =>
      guardedItem(db, request, params.id, () => json({ notes: [], total: 0 })),
    ),
  ]
}

/** `transitionWorkItem` / `ownStatusWorkItem`: yönetici, birim koordinatörü ya da atanan üye. */
async function transition(
  db: OrgDb,
  { request, params }: { request: Request; params: Record<string, unknown> },
  own: boolean,
) {
  const me = o.actorOf(db, request)
  if (!me) return envelope('platform.unauthenticated', 401)
  const found = db.items.find((i) => i.work_item_id === params.id)
  if (!found || !visible(db, me, found)) return denied(db, me, found)
  const body = (await request.json()) as { to: string }
  const from = found.status
  found.status = body.to
  found.edit_revision = Number(found.edit_revision) + 1
  const team = o.teamIn(db, me.account_id, found.program_id, found.department_id)
  const actor =
    own || (team !== 'coordinator' && !me.admin) ? db.roles.member : db.roles.coordinator
  return json({ work_item_id: found.work_item_id, from, to: body.to, actor })
}

function workWrites(db: OrgDb) {
  return [
    http.post(`${ORIGIN}/v1/work-items`, async ({ request }) => {
      const me = o.actorOf(db, request)
      const program = o.programOf(request)
      const department = request.headers.get('X-Nizamio-Department') ?? ''
      const team = me ? o.teamIn(db, me.account_id, program, department) : null
      if (!me || (!me.admin && team !== 'coordinator')) return o.forbidden('work')
      const body = (await request.json()) as { title: string; assignee_account_id?: string }
      const assignee = db.accounts.find((a) => a.account_id === body.assignee_account_id) ?? null
      const created = item(o.next(db, 'w-yeni'), program, department, assignee, {
        title: body.title,
      })
      db.items.push(created)
      return json(created, 201)
    }),
    http.post(`${ORIGIN}/v1/work-items/:id/transitions`, (ctx) => transition(db, ctx, false)),
    http.patch(`${ORIGIN}/v1/work-items/:id/own-status`, (ctx) => transition(db, ctx, true)),
    http.post(`${ORIGIN}/v1/work-items/:id/assignments`, async ({ request, params }) => {
      const found = db.items.find((i) => i.work_item_id === params.id)
      if (!found) return envelope('work.item_not_found', 404)
      const body = (await request.json()) as { account_ids: string[] }
      for (const id of body.account_ids) {
        if (found.assignee_account_ids.includes(id)) continue
        found.assignee_account_ids.push(id)
        found.assignees.push({ account_id: id, full_name: o.accountName(db, id) })
      }
      return json({ added: body.account_ids.length })
    }),
  ]
}

function stat(db: OrgDb, programId: string, departmentId: string) {
  const catalog = db.catalog.find((c) => c.department_id === departmentId)
  const rows = db.memberships.filter(
    (m) => m.program_id === programId && m.department_id === departmentId,
  )
  const items = db.items.filter(
    (i) => i.program_id === programId && i.department_id === departmentId,
  )
  const completed = items.filter((i) => !o.isOpen(i)).length
  return {
    department_id: departmentId,
    name: catalog?.name ?? departmentId,
    kind: catalog?.kind ?? 'koordinatorluk',
    coordinators: rows
      .filter((m) => m.team === 'coordinator')
      .map((m) => ({ account_id: m.account_id, full_name: o.accountName(db, m.account_id) })),
    member_count: rows.length,
    total_tasks: items.length,
    completed_tasks: completed,
    in_progress_tasks: 0,
    not_started_tasks: items.length - completed,
    overdue_tasks: 0,
    completion_rate: items.length === 0 ? 0 : Math.round((completed / items.length) * 1000) / 10,
    meeting_count: 0,
    last_activity_at: '2026-11-08T09:00:00Z',
  }
}

function dashboard(db: OrgDb, programId: string) {
  const links = db.links.filter((l) => l.program_id === programId)
  const items = db.items.filter((i) => i.program_id === programId)
  const people = new Set(
    db.memberships.filter((m) => m.program_id === programId).map((m) => m.account_id),
  )
  return {
    program_id: programId,
    program_name: db.programs.find((p) => p.program_id === programId)?.name ?? '',
    generated_at: '2026-11-09T09:00:00Z',
    total_tasks: items.length,
    completed_tasks: items.filter((i) => !o.isOpen(i)).length,
    active_tasks: items.filter(o.isOpen).length,
    overdue_tasks: items.filter((i) => lateness(db, i).is_overdue).length,
    overdue_tasks_list: [],
    pending_approvals: 0,
    pending_date_changes: items.filter((i) => i.pending_date_request).length,
    deleted_records: 0,
    priority_distribution: {},
    task_status_distribution: {},
    total_admins: db.accounts.filter((a) => a.admin && !a.deleted).length,
    total_coordinators: 0,
    total_coordinatorships: links.length,
    total_members: people.size,
    total_users: people.size,
    coordinatorship_stats: links.map((l) => stat(db, programId, l.department_id)),
  }
}

const PALETTE = ['violet', 'gold', 'blue', 'teal', 'green', 'orange', 'red', 'slate']

/** PROGRAM-K46: kısa ad kırpılmış 1–4 harf/rakam; boş dizge temizleme DEĞİL (yalnız `null`). */
function invalidProgramField(body: Record<string, unknown>) {
  const short = body.short_name
  if (typeof short === 'string' && !/^[\p{L}\p{N}]{1,4}$/u.test(short.trim())) {
    return envelope('program.input_invalid', 422, [
      { field: 'short_name', code: 'program.invalid_short_name' },
    ])
  }
  const color = body.color
  if (typeof color === 'string' && !PALETTE.includes(color)) {
    return envelope('program.input_invalid', 422, [
      { field: 'color', code: 'program.invalid_color' },
    ])
  }
  return null
}

function programWrites(db: OrgDb) {
  const admin = (request: Request) => o.actorOf(db, request)?.admin === true
  return [
    http.post(`${ORIGIN}/v1/programs`, async ({ request }) => {
      if (!admin(request)) return o.forbidden('program')
      const body = (await request.json()) as { name: string; year?: number }
      const created = { program_id: o.next(db, 'p-yeni'), ...body }
      db.programs.push(created)
      return json({ ...created, created: true }, 201)
    }),
    http.get(`${ORIGIN}/v1/program`, ({ request }) => {
      const me = o.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      const found = db.programs.find((p) => p.program_id === o.programOf(request))
      if (!found) return envelope('work.program_scope_invalid', 404)
      return json({ ...found, short_name: found.short_name ?? null, color: found.color ?? null })
    }),
    http.patch(`${ORIGIN}/v1/programs/:id`, async ({ request, params }) => {
      const found = db.programs.find((p) => p.program_id === params.id)
      if (!admin(request) || !found) return o.forbidden('program')
      const body = (await request.json()) as Record<string, unknown>
      const bad = invalidProgramField(body)
      if (bad) return bad
      Object.assign(found, body) // üç hâlli: alan yoksa değişmez, `null` temizler
      return json({ ...found, short_name: found.short_name ?? null, color: found.color ?? null })
    }),
    http.delete(`${ORIGIN}/v1/programs/:id`, async ({ request, params }) => {
      if (!admin(request)) return o.forbidden('program')
      const body = (await request.json()) as { password?: string }
      if (body.password !== PASSWORD) return envelope('program.password_invalid', 401)
      db.programs = db.programs.filter((p) => p.program_id !== params.id)
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}

interface TransferBody {
  source_program_id: string
  target_program_id: string
  department_id: string
  work_item_ids: string[]
}

/** Aktarım: görevler hedef programa geçer; bağ ve atanan ekip satırları eklenir (K28, K42). */
function transfer(db: OrgDb, body: TransferBody, id: string) {
  const moved = db.items.filter((i) => body.work_item_ids.includes(i.work_item_id))
  const granted: { account_id: string; department_id: string }[] = []
  for (const i of moved) {
    i.program_id = body.target_program_id
    for (const accountId of i.assignee_account_ids) {
      if (o.teamIn(db, accountId, body.target_program_id, body.department_id) !== null) continue
      db.memberships.push({
        program_id: body.target_program_id,
        department_id: body.department_id,
        account_id: accountId,
        team: 'member',
        membership_id: o.next(db, 'm'),
      })
      granted.push({ account_id: accountId, department_id: body.department_id })
    }
  }
  const source = o.linkOf(db, body.source_program_id, body.department_id)
  const linked = o.linkOf(db, body.target_program_id, body.department_id) !== undefined
  if (!linked && source) db.links.push({ ...source, program_id: body.target_program_id })
  db.transfers.unshift({
    transfer_id: id,
    created_at: '2026-11-09T09:00:00Z',
    source_program_id: body.source_program_id,
    target_program_id: body.target_program_id,
    department_id: body.department_id,
    work_item_ids: body.work_item_ids,
    granted_memberships: granted,
    moved_item_count: moved.length,
    moved_file_count: 0,
    cut_dependency_count: 0,
    restored_dependency_count: 0,
  })
  return { moved, granted, newLink: !linked }
}

function transferHandlers(db: OrgDb) {
  const admin = (request: Request) => o.actorOf(db, request)?.admin === true
  return [
    http.get(`${ORIGIN}/v1/program-transfers`, () => json({ transfers: db.transfers })),
    http.post(`${ORIGIN}/v1/program-transfers/preview`, async ({ request }) => {
      if (!admin(request)) return o.forbidden('program')
      const body = (await request.json()) as TransferBody
      return json({
        blockers: [],
        can_execute: true,
        file_count: 0,
        file_total_bytes: 0,
        granted_memberships: [],
        missing_access: false,
        preserved_dependency_count: 0,
        preview_fingerprint: `fp-${body.work_item_ids.join('-')}`,
        resolved_work_item_ids: body.work_item_ids,
        warnings: [],
      })
    }),
    http.post(`${ORIGIN}/v1/program-transfers`, async ({ request }) => {
      if (!admin(request)) return o.forbidden('program')
      const body = (await request.json()) as TransferBody
      const id = o.next(db, 'tr')
      const done = transfer(db, body, id)
      return json({
        transfer_id: id,
        moved_work_item_ids: done.moved.map((i) => i.work_item_id),
        moved_file_count: 0,
        granted_memberships: done.granted,
        granted_links: done.newLink ? [body.department_id] : [],
        retained_links: [],
        revoked_links: [],
        cut_dependency_count: 0,
        restored_dependency_count: 0,
        replayed: false,
      })
    }),
  ]
}

export function workHandlers(db: OrgDb) {
  return [
    ...workReads(db),
    ...workWrites(db),
    http.get(`${ORIGIN}/v1/reports/dashboard`, ({ request }) =>
      o.actorOf(db, request)?.admin
        ? json(dashboard(db, o.programOf(request)))
        : o.forbidden('reporting'),
    ),
    ...programWrites(db),
    ...transferHandlers(db),
  ]
}
