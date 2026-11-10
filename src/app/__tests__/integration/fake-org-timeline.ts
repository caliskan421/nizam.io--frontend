// Sahte backend: zaman çizelgesi uçları (WEB-3 W97a). Üç Gantt yüzü, tarih yazmaları, tarih talebi
// ve bağımlılık uçları aynı durumlu veri kümesi (`OrgDb`) üstünde çalışır; yazma sonrası yeniden
// okuma GERÇEK sunucu durumunu görür. Sözleşme sadakati (pinli spec, 03c `backend.md`):
//  - Üç yüz yetkiyi çağıranın belirtecinden hesaplar: `adminGantt` (S2) yalnız yönetici,
//    `coordinatorGantt` (S3) yönetici ya da birimin koordinatörü, `memberGantt` (S3) birimde ekip
//    satırı olan hesap ve yalnız kendisine atananlar. İlk 200 kalem; kesilme yalnız
//    `X-Result-Truncated: true` başlığıyla bildirilir (BE-019; tam 200 kalemde başlık YOK).
//    Satır `dates_revision`, `pending_date_request` (üye yüzünde yalnız yönetici/koordinatöre dolu),
//    `subtask_counts` taşır (BE-051/052/053; pin v0.15.0-api).
//  - Tarih yazımı `expected_dates_revision` ister; sürüm uyuşmazsa 409 `work.edit_conflict`.
//    Uzatma (`extend`) ve talep açma isteğe bağlı `expected_dates_revision` alır (BE-056); uzatma
//    yanıtı `dates_revision` + `replayed` taşır. Bağımlıları zincirle öteler (`cascade_count`).
//  - Tarih talebi yalnız birimin KOORDİNATÖRÜNDEN açılır (yönetici tek başına 403); görevde
//    bekleyen talep varsa 409 `work.date_request_pending_exists`; onay/red yalnız yönetici.
//  - Uzatma `days` tamsayı 1–90; dışı 422 `work.input_invalid` (alan kodu `work.extend_days_out_of_range`).
//    Bağımlılık ekleme: bağımlı başlangıç < ön görev bitişi → 422 `work.input_invalid` (alan kodu
//    `work.dependency_date_order`); silme 200 `StatusResult` (pin v0.15.0-api).
//  - `Idempotency-Key` yalnız `extend` ve `requestDateChange`'de (isteğe bağlı, 22–200 bayt; geçersiz
//    422 `work.input_invalid` alan `idempotency_key` kodu `work.request_key_invalid`): aynı anahtar +
//    aynı istek 200 + ilk sonuç (`replayed:true`), farklı istek 409 `work.idempotency_key_reused`.
//    Başka tarih/bağımlılık uçlarında anahtar yoktur. Sınama kancaları: `dropNextResponse(db)`
//    sonraki extend/talep yanıtını ağ hatasına çevirir (istek UYGULANIR; sonuç bilinmiyor).
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
const EXTEND_MIN = 1
const EXTEND_MAX = 90
const DAY_MS = 86_400_000

export function addDays(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * DAY_MS).toISOString().slice(0, 10)
}

interface Stored {
  fingerprint: string
  status: number
  body: Record<string, unknown>
}
/** Anahtar → ilk sonuç (aktör + uç kapsamı: anahtar ucu ve hesabı içerir). */
const KEYS = new WeakMap<OrgDb, Map<string, Stored>>()
/** Sınama kancası: sonraki extend/talep yanıtı ağ hatasına çevrilir (istek UYGULANMIŞTIR). */
const DROP_NEXT = new WeakMap<OrgDb, number>()

/** Sonraki `count` extend/talep yanıtını düşürür (sonuç bilinmiyor senaryosu). */
export function dropNextResponses(db: OrgDb, count = 1): void {
  DROP_NEXT.set(db, count)
}

const KEY_BYTES = /^.{22,200}$/

/**
 * `Idempotency-Key` işleyicisi (isteğe bağlı anahtar; ADR-0027). Anahtarsız istek `apply`'ı
 * doğrudan çalıştırır. Aynı anahtar + aynı istek ilk sonucu `replayed`/200 ile döndürür; farklı
 * istek 409 `work.idempotency_key_reused`; geçersiz uzunluk 422 `work.request_key_invalid`.
 */
function keyed(
  db: OrgDb,
  request: Request,
  scope: string,
  fingerprint: string,
  apply: () => Response | Stored,
  replayShape: (stored: Stored) => Record<string, unknown>,
): Response {
  const key = request.headers.get('Idempotency-Key')?.trim() ?? null
  if (key !== null && !KEY_BYTES.test(key)) return invalidKey()
  const store = KEYS.get(db) ?? new Map<string, Stored>()
  KEYS.set(db, store)
  const slot = key === null ? null : `${scope}:${key}`
  const seen = slot === null ? undefined : store.get(slot)
  if (seen) return replayOf(seen, fingerprint, replayShape)
  const result = apply()
  if (result instanceof Response) return result
  if (slot !== null) store.set(slot, { ...result, fingerprint })
  return dropped(db) ? HttpResponse.error() : json(result.body, result.status)
}

/** Aynı anahtar: aynı istek ilk sonucu (tekrar), farklı istek 409 `work.idempotency_key_reused`. */
function replayOf(
  seen: Stored,
  fingerprint: string,
  replayShape: (stored: Stored) => Record<string, unknown>,
): Response {
  return seen.fingerprint === fingerprint
    ? json(replayShape(seen))
    : envelope('work.idempotency_key_reused', 409)
}

function invalidKey(): Response {
  return envelope('work.input_invalid', 422, [
    { field: 'idempotency_key', code: 'work.request_key_invalid' },
  ])
}

/** Sınama kancası: bekleyen düşürme varsa bir hak harcar. */
function dropped(db: OrgDb): boolean {
  const left = DROP_NEXT.get(db) ?? 0
  if (left > 0) DROP_NEXT.set(db, left - 1)
  return left > 0
}

/** Bayat `expected_dates_revision` → 409 `work.edit_conflict` (yoksa `null`). */
function staleRevision(found: Item, expected: number | undefined): Response | null {
  if (expected === undefined || expected === found.dates_revision) return null
  return envelope('work.edit_conflict', 409, [
    { field: 'expected_dates_revision', code: 'work.edit_conflict' },
  ])
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

/** `GanttTask` şekli: yalnız sözleşmedeki alanlar (kod ve atanan adı YOK). */
function ganttTask(db: OrgDb, i: Item, seesRequest: boolean) {
  const subtasks = db.subtasks[i.work_item_id] ?? []
  return {
    dates_revision: Number(i.dates_revision ?? 1),
    pending_date_request: seesRequest ? (i.pending_date_request ?? null) : null,
    subtask_counts: {
      total: subtasks.length,
      done: subtasks.filter((s) => s.done === true).length,
    },
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
function ganttOf(db: OrgDb, items: Item[], seesRequest: boolean) {
  const listed = items.slice(0, GANTT_CAP)
  const ids = new Set(listed.map((i) => i.work_item_id))
  const departmentOf = new Map(listed.map((i) => [i.work_item_id, i.department_id]))
  return {
    tasks: listed.map((i) => ganttTask(db, i, seesRequest)),
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

/** Gantt yanıtı: 200'den fazla kalem varsa `X-Result-Truncated: true` (tam 200'de başlık yok). */
function ganttJson(db: OrgDb, items: Item[], seesRequest: boolean) {
  const truncated = items.length > GANTT_CAP
  return json(
    ganttOf(db, items, seesRequest),
    200,
    truncated ? { 'X-Result-Truncated': 'true' } : {},
  )
}

const programItems = (db: OrgDb, program: string) =>
  db.items.filter((i) => i.program_id === program)

function ganttReads(db: OrgDb) {
  return [
    http.get(`${ORIGIN}/v1/work-items/gantt/admin`, ({ request }) => {
      const me = o.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      if (!me.admin) return envelope('work.not_authorized', 403)
      return ganttJson(db, programItems(db, o.programOf(request)), true)
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
      return ganttJson(db, items, true)
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
      const seesRequest =
        me.admin || o.teamIn(db, me.account_id, program, department) === 'coordinator'
      return ganttJson(db, mine, seesRequest)
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

function extendHandler(db: OrgDb) {
  return http.post(`${ORIGIN}/v1/work-items/:id/extend`, async ({ request, params }) => {
    const me = o.actorOf(db, request)
    const found = itemOf(db, params.id)
    if (!me) return envelope('platform.unauthenticated', 401)
    if (!found) return envelope('work.item_not_found', 404)
    if (!manages(db, me, found)) return envelope('work.not_authorized', 403)
    const body = (await request.json()) as { days: unknown; expected_dates_revision?: number }
    const { days } = body
    const fingerprint = JSON.stringify([found.work_item_id, days, body.expected_dates_revision])
    return keyed(
      db,
      request,
      `extend:${me.account_id}`,
      fingerprint,
      () => {
        if (found.status === 'tamamlandi') return envelope('work.item_completed', 409)
        // Pin (ExtendRequest): tamsayı 1–90; aksi 422 `work.input_invalid` + alan kodu.
        if (
          !Number.isInteger(days) ||
          (days as number) < EXTEND_MIN ||
          (days as number) > EXTEND_MAX
        ) {
          return envelope('work.input_invalid', 422, [
            { field: 'days', code: 'work.extend_days_out_of_range' },
          ])
        }
        const stale = staleRevision(found, body.expected_dates_revision)
        if (stale) return stale
        found.end_on = addDays(found.end_on as string, days as number)
        bump(found)
        const result = { cascade_count: cascade(db, found), new_end_on: found.end_on }
        return {
          fingerprint,
          status: 200,
          body: { ...result, dates_revision: found.dates_revision, replayed: false },
        }
      },
      (stored) => ({ ...stored.body, replayed: true }),
    )
  })
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
    extendHandler(db),
  ]
}

/** Talep satırı → sözleşme `DateChangeRequest` (istemci olmayan `requester` düşer). */
function requestShape(row: DateRequestRow) {
  return Object.fromEntries(Object.entries(row).filter(([field]) => field !== 'requester'))
}

function createRequestHandler(db: OrgDb) {
  return http.post(`${ORIGIN}/v1/date-change-requests`, async ({ request }) => {
    const me = o.actorOf(db, request)
    if (!me) return envelope('platform.unauthenticated', 401)
    const body = (await request.json()) as {
      work_item_id: string
      new_start_on: string
      new_end_on: string
      reason?: string
      expected_dates_revision?: number
    }
    const found = itemOf(db, body.work_item_id)
    if (!found) return envelope('work.item_not_found', 404)
    // Yönetici tek başına talep açamaz; yalnız görevin birimindeki koordinatör.
    if (o.teamIn(db, me.account_id, found.program_id, found.department_id) !== 'coordinator') {
      return envelope('work.not_authorized', 403)
    }
    return keyed(
      db,
      request,
      `request:${me.account_id}`,
      JSON.stringify(body),
      () => {
        if (found.pending_date_request) return envelope('work.date_request_pending_exists', 409)
        const stale = staleRevision(found, body.expected_dates_revision)
        if (stale) return stale
        const row = openRequest(db, me, found, body)
        return { fingerprint: '', status: 201, body: requestShape(row) }
      },
      (stored) => {
        // Tekrar: talebin BUGÜNKÜ hâli (arada karara bağlanmış olabilir).
        const row = db.dateRequests.find((r) => r.request_id === stored.body.request_id)
        return row ? requestShape(row) : stored.body
      },
    )
  })
}

/** Talebi açar ve görevin bekleyen talebini işaretler. */
function openRequest(
  db: OrgDb,
  me: Account,
  found: Item,
  body: { new_start_on: string; new_end_on: string; reason?: string },
): DateRequestRow {
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
  return row
}

function requestHandlers(db: OrgDb) {
  return [
    createRequestHandler(db),
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
      // Pin (domain `ValidateDependencyDate`): bağımlı görev, ön görevin bitişinden ÖNCE başlayamaz.
      // Sıra: kendine bağ/tekrar/döngü sonra tarih önkoşulu → 422 `work.input_invalid` + alan kodu.
      if (String(found.start_on) < String(itemOf(db, pre)!.end_on)) {
        return envelope('work.input_invalid', 422, [
          { field: 'start_on', code: 'work.dependency_date_order' },
        ])
      }
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
      // Pin (removeDependency): 200 `StatusResult` (204 değil).
      return json({ status: 'removed' })
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
