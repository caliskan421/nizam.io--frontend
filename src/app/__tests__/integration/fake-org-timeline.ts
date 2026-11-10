// Sahte backend: zaman çizelgesi uçları (WEB-3 W97a). Üç Gantt yüzü, tarih yazmaları, tarih talebi
// ve bağımlılık uçları aynı durumlu veri kümesi (`OrgDb`) üstünde çalışır; yazma sonrası yeniden
// okuma GERÇEK sunucu durumunu görür. Sözleşme sadakati (pinli spec, 03c `backend.md`):
//  - Üç yüz yetkiyi çağıranın belirtecinden hesaplar: `adminGantt` (S2) yalnız yönetici,
//    `coordinatorGantt` (S3) yönetici ya da birimin koordinatörü, `memberGantt` (S3) birimde ekip
//    satırı olan hesap ve yalnız kendisine atananlar. İlk 200 kalem; kesilme sinyali yok (BE-019).
//  - Tarih yazımı `expected_dates_revision` ister; sürüm uyuşmazsa 409 `work.edit_conflict`.
//    Uzatma (`extend`) sürüm taşımaz. Bağımlıları zincirle öteler (`cascade_count`).
//  - Tarih talebi yalnız birimin KOORDİNATÖRÜNDEN açılır (yönetici tek başına 403); görevde
//    bekleyen talep varsa 409 `work.date_request_pending_exists`; onay/red yalnız yönetici.
//  - Anahtar (`Idempotency-Key`) hiçbir tarih/talep/bağımlılık ucunda yoktur.
import { http, HttpResponse } from 'msw'

import {
  envelope,
  fakeOrg as o,
  json,
  ORIGIN,
  type Account,
  type DateRequestRow,
  type Item,
  type OrgDb,
} from './fake-org'

const GANTT_CAP = 200
const DAY_MS = 86_400_000

export function addDays(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * DAY_MS).toISOString().slice(0, 10)
}

const departmentOf = (request: Request) => request.headers.get('X-Nizamio-Department') ?? ''

function lateness(i: Item) {
  return {
    is_overdue: i.is_overdue === true,
    days_overdue: Number(i.days_overdue ?? 0),
    is_completed_late: i.is_completed_late === true,
    days_late: Number(i.days_late ?? 0),
    is_completed_early: i.is_completed_early === true,
    days_early: Number(i.days_early ?? 0),
  }
}

/** `GanttTask` şekli: yalnız sözleşmedeki alanlar (kod, atanan adı, talep, sürüm YOK). */
function ganttTask(i: Item) {
  return {
    work_item_id: i.work_item_id,
    title: i.title,
    program_id: i.program_id,
    department_id: i.department_id,
    priority: i.priority,
    status: i.status,
    start_on: i.start_on,
    end_on: i.end_on,
    planned_end_on: (i.planned_end_on as string | undefined) ?? '',
    completed_on: (i.completed_on as string | undefined) ?? '',
    assignee_account_ids: i.assignee_account_ids,
    lateness: lateness(i),
  }
}

/** Bağ yalnız iki ucu da listelenen görevler arasında döner (WORK-K36). */
function ganttOf(db: OrgDb, items: Item[]) {
  const listed = items.slice(0, GANTT_CAP)
  const ids = new Set(listed.map((i) => i.work_item_id))
  const departmentOf = new Map(listed.map((i) => [i.work_item_id, i.department_id]))
  return {
    tasks: listed.map(ganttTask),
    links: db.dependencies
      .filter((d) => ids.has(d.work_item_id) && ids.has(d.depends_on_work_item_id))
      .map((d) => ({
        dependency_id: d.dependency_id,
        source: d.depends_on_work_item_id,
        target: d.work_item_id,
        cross_department:
          departmentOf.get(d.work_item_id) !== departmentOf.get(d.depends_on_work_item_id),
      })),
  }
}

const programItems = (db: OrgDb, program: string) =>
  db.items.filter((i) => i.program_id === program)

function ganttReads(db: OrgDb) {
  return [
    http.get(`${ORIGIN}/v1/work-items/gantt/admin`, ({ request }) => {
      const me = o.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      if (!me.admin) return envelope('work.not_authorized', 403)
      return json(ganttOf(db, programItems(db, o.programOf(request))))
    }),
    http.get(`${ORIGIN}/v1/work-items/gantt`, ({ request }) => {
      const me = o.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      const program = o.programOf(request)
      const department = departmentOf(request)
      if (!me.admin && o.teamIn(db, me.account_id, program, department) !== 'coordinator') {
        return envelope('work.not_authorized', 403)
      }
      const items = programItems(db, program).filter((i) => i.department_id === department)
      return json(ganttOf(db, items))
    }),
    http.get(`${ORIGIN}/v1/work-items/gantt/mine`, ({ request }) => {
      const me = o.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      const program = o.programOf(request)
      const department = departmentOf(request)
      if (o.teamIn(db, me.account_id, program, department) === null) {
        return envelope('work.not_authorized', 403)
      }
      const mine = programItems(db, program).filter(
        (i) => i.department_id === department && i.assignee_account_ids.includes(me.account_id),
      )
      return json(ganttOf(db, mine))
    }),
  ]
}

/** Yönetici ya da görevin birimindeki koordinatör (tarih/bağımlılık yazma yetkisi; s.139). */
function manages(db: OrgDb, me: Account, i: Item): boolean {
  return me.admin || o.teamIn(db, me.account_id, i.program_id, i.department_id) === 'coordinator'
}

function itemOf(db: OrgDb, id: unknown): Item | undefined {
  return db.items.find((i) => i.work_item_id === id)
}

/** Bağımlılar (bu görevi ön görev sayanlar) ve ön görevler. */
function dependentsOf(db: OrgDb, id: string): Item[] {
  return db.dependencies
    .filter((d) => d.depends_on_work_item_id === id)
    .flatMap((d) => itemOf(db, d.work_item_id) ?? [])
}

function bump(i: Item): void {
  i.dates_revision = Number(i.dates_revision) + 1
}

/** Zincir: bitişi yeni ön görev bitişinden önce başlayan bağımlıları öteler; kaç görev kaydı. */
function cascade(db: OrgDb, changed: Item, seen = new Set<string>()): number {
  let moved = 0
  for (const dep of dependentsOf(db, changed.work_item_id)) {
    if (seen.has(dep.work_item_id)) continue
    seen.add(dep.work_item_id)
    const shortBy = Math.round(
      (Date.parse(changed.end_on as string) - Date.parse(dep.start_on as string)) / DAY_MS,
    )
    if (shortBy < 0) continue
    const shift = shortBy + 1
    dep.start_on = addDays(dep.start_on as string, shift)
    dep.end_on = addDays(dep.end_on as string, shift)
    bump(dep)
    moved += 1 + cascade(db, dep, seen)
  }
  return moved
}

function dateWrites(db: OrgDb) {
  return [
    http.patch(`${ORIGIN}/v1/work-items/:id`, async ({ request, params }) => {
      const me = o.actorOf(db, request)
      const found = itemOf(db, params.id)
      if (!me) return envelope('platform.unauthenticated', 401)
      if (!found) return envelope('work.item_not_found', 404)
      if (!manages(db, me, found)) return envelope('work.not_authorized', 403)
      const body = (await request.json()) as {
        start_on?: string
        end_on?: string
        planned_end_on?: string
        expected_dates_revision?: number
      }
      if (body.expected_dates_revision !== found.dates_revision) {
        return envelope('work.edit_conflict', 409, [
          { field: 'expected_dates_revision', code: 'work.edit_conflict' },
        ])
      }
      for (const key of ['start_on', 'end_on', 'planned_end_on'] as const) {
        if (body[key] !== undefined) found[key] = body[key]
      }
      bump(found)
      cascade(db, found)
      return json(found)
    }),
    http.post(`${ORIGIN}/v1/work-items/:id/extend`, async ({ request, params }) => {
      const me = o.actorOf(db, request)
      const found = itemOf(db, params.id)
      if (!me) return envelope('platform.unauthenticated', 401)
      if (!found) return envelope('work.item_not_found', 404)
      if (!manages(db, me, found)) return envelope('work.not_authorized', 403)
      if (found.status === 'tamamlandi') return envelope('work.item_completed', 409)
      const { days } = (await request.json()) as { days: number }
      found.end_on = addDays(found.end_on as string, days)
      bump(found)
      return json({ cascade_count: cascade(db, found), new_end_on: found.end_on })
    }),
  ]
}

/** Talep satırı → sözleşme `DateChangeRequest` (istemci olmayan `requester` düşer). */
function requestShape(row: DateRequestRow) {
  return Object.fromEntries(Object.entries(row).filter(([field]) => field !== 'requester'))
}

function requestHandlers(db: OrgDb) {
  return [
    http.post(`${ORIGIN}/v1/date-change-requests`, async ({ request }) => {
      const me = o.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      const body = (await request.json()) as {
        work_item_id: string
        new_start_on: string
        new_end_on: string
        reason?: string
      }
      const found = itemOf(db, body.work_item_id)
      if (!found) return envelope('work.item_not_found', 404)
      // Yönetici tek başına talep açamaz; yalnız görevin birimindeki koordinatör.
      if (o.teamIn(db, me.account_id, found.program_id, found.department_id) !== 'coordinator') {
        return envelope('work.not_authorized', 403)
      }
      if (found.pending_date_request) return envelope('work.date_request_pending_exists', 409)
      const row: DateRequestRow = {
        request_id: o.next(db, 'dr'),
        work_item_id: found.work_item_id,
        status: 'pending',
        old_start_on: found.start_on as string,
        old_end_on: found.end_on as string,
        new_start_on: body.new_start_on,
        new_end_on: body.new_end_on,
        ...(body.reason ? { reason: body.reason } : {}),
        requester: me.account_id,
      }
      db.dateRequests.push(row)
      found.pending_date_request = {
        request_id: row.request_id,
        new_start_on: row.new_start_on,
        new_end_on: row.new_end_on,
      }
      return json(requestShape(row), 201)
    }),
    http.get(`${ORIGIN}/v1/date-change-requests`, ({ request }) => {
      const me = o.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      if (!me.admin) return envelope('work.not_authorized', 403)
      const pendingOnly = new URL(request.url).searchParams.get('status') === 'pending'
      const rows = db.dateRequests.filter((r) => !pendingOnly || r.status === 'pending')
      return json({ requests: rows.map(requestShape), total: rows.length })
    }),
    http.get(`${ORIGIN}/v1/date-change-requests/mine`, ({ request }) => {
      const me = o.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      const rows = db.dateRequests.filter((r) => r.requester === me.account_id)
      return json({ requests: rows.map(requestShape), total: rows.length })
    }),
  ]
}

function reviewHandler(db: OrgDb) {
  return http.post(`${ORIGIN}/v1/date-change-requests/:id/review`, async ({ request, params }) => {
    const me = o.actorOf(db, request)
    if (!me) return envelope('platform.unauthenticated', 401)
    if (!me.admin) return envelope('work.not_authorized', 403)
    const row = db.dateRequests.find((r) => r.request_id === params.id)
    if (!row) return envelope('work.item_not_found', 404)
    if (row.status !== 'pending') return envelope('work.date_request_already_reviewed', 409)
    const { decision } = (await request.json()) as { decision: 'approved' | 'rejected' }
    const found = itemOf(db, row.work_item_id)!
    row.status = decision
    found.pending_date_request = null
    let affected = 0
    if (decision === 'approved') {
      found.start_on = row.new_start_on
      found.end_on = row.new_end_on
      bump(found)
      affected = cascade(db, found)
    }
    return json({ affected_tasks_count: affected })
  })
}

function dependencyHandlers(db: OrgDb) {
  const reaches = (from: string, target: string, seen = new Set<string>()): boolean => {
    if (from === target) return true
    if (seen.has(from)) return false
    seen.add(from)
    return db.dependencies
      .filter((d) => d.depends_on_work_item_id === from)
      .some((d) => reaches(d.work_item_id, target, seen))
  }
  return [
    http.get(`${ORIGIN}/v1/work-items/:id/dependencies`, ({ request, params }) => {
      const me = o.actorOf(db, request)
      const found = itemOf(db, params.id)
      if (!me) return envelope('platform.unauthenticated', 401)
      if (!found) return envelope('work.item_not_found', 404)
      if (!manages(db, me, found)) return envelope('work.not_authorized', 403)
      return json({
        dependencies: db.dependencies.filter((d) => d.work_item_id === found.work_item_id),
        dependents: db.dependencies.filter((d) => d.depends_on_work_item_id === found.work_item_id),
      })
    }),
    http.post(`${ORIGIN}/v1/work-items/:id/dependencies`, async ({ request, params }) => {
      const me = o.actorOf(db, request)
      const found = itemOf(db, params.id)
      if (!me) return envelope('platform.unauthenticated', 401)
      if (!found) return envelope('work.item_not_found', 404)
      if (!manages(db, me, found)) return envelope('work.not_authorized', 403)
      const { depends_on_work_item_id: pre } = (await request.json()) as {
        depends_on_work_item_id: string
      }
      if (!itemOf(db, pre)) return envelope('work.item_not_found', 404)
      const duplicate = db.dependencies.some(
        (d) => d.work_item_id === found.work_item_id && d.depends_on_work_item_id === pre,
      )
      if (duplicate) return envelope('work.dependency_duplicate', 409)
      if (reaches(found.work_item_id, pre)) return envelope('work.dependency_cycle', 409)
      const edge = {
        dependency_id: o.next(db, 'dep'),
        work_item_id: found.work_item_id,
        depends_on_work_item_id: pre,
      }
      db.dependencies.push(edge)
      return json(edge, 201)
    }),
    http.delete(`${ORIGIN}/v1/work-items/:id/dependencies/:depId`, ({ request, params }) => {
      const me = o.actorOf(db, request)
      const found = itemOf(db, params.id)
      if (!me) return envelope('platform.unauthenticated', 401)
      if (!found) return envelope('work.item_not_found', 404)
      if (!manages(db, me, found)) return envelope('work.not_authorized', 403)
      db.dependencies = db.dependencies.filter((d) => d.dependency_id !== params.depId)
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}

export function timelineHandlers(db: OrgDb) {
  return [
    ...ganttReads(db),
    ...dateWrites(db),
    ...requestHandlers(db),
    reviewHandler(db),
    ...dependencyHandlers(db),
  ]
}
