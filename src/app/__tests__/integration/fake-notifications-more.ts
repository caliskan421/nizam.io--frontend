// W185: durumlu sahte bildirim sunucusunun v0.25 yüzü — kaldır, sessize al/listele/geri al (S1),
// satır içi karar uçları (tarih talebi incelemesi, görev geçişi; S3 başlıkları satırdan doğrulanır),
// sohbet okundu → sunucu sohbet bildirimlerini kapatır (BE-027; istemci ayrıca işaretlemez).
// `fake-notifications.ts` 250 satır sınırında olduğu için ayrı dosyadır.
import { http, HttpResponse } from 'msw'

import { fakeOrg, ORIGIN, envelope, json, type OrgDb } from './fake-org'
import type { FakeNotification, NotificationsState } from './fake-notifications'

const rowsOf = (state: NotificationsState, account: string): FakeNotification[] =>
  state.rows.get(account) ?? []
const setRows = (state: NotificationsState, account: string, rows: FakeNotification[]) =>
  state.rows.set(account, rows)

/** Konunun yeni olayı artık kayıt üretmez; mevcut satırların `muted` bayrağı konuya göre döner. */
function setMuted(state: NotificationsState, account: string, id: string, muted: boolean) {
  for (const row of rowsOf(state, account)) if (row.subject_ref.id === id) row.muted = muted
}

export interface DecisionLog {
  /** Alınan karar istekleri: yol + gövde + kapsam başlıkları. */
  calls: { path: string; body: unknown; program: string | null; department: string | null }[]
}

function muteHandlers(db: OrgDb, state: NotificationsState) {
  const mine = (request: Request) => fakeOrg.actorOf(db, request)
  return [
    http.get(`${ORIGIN}/v1/notifications/subject-mutes`, ({ request }) => {
      const me = mine(request)
      if (!me) return envelope('platform.unauthenticated', 401)
      const q = new URL(request.url).searchParams
      const limit = Number(q.get('limit') ?? 50)
      const from = Number(q.get('cursor') || 0)
      const all = state.mutes.get(me.account_id) ?? []
      const items = all
        .slice(from, from + limit)
        .map((m) => ({ subject_kind: m.kind, subject_id: m.id, created_at: m.created_at }))
      return json({ items, next_cursor: from + limit < all.length ? String(from + limit) : null })
    }),
    http.put(`${ORIGIN}/v1/notifications/subject-mutes/:kind/:id`, ({ request, params }) => {
      const me = mine(request)
      if (!me) return envelope('platform.unauthenticated', 401)
      const kind = String(params.kind)
      if (kind !== 'work_item' && kind !== 'meeting')
        return envelope('notifications.input_invalid', 422)
      const list = state.mutes.get(me.account_id) ?? []
      if (!list.some((m) => m.kind === kind && m.id === params.id)) {
        list.unshift({ kind, id: String(params.id), created_at: new Date().toISOString() })
      }
      state.mutes.set(me.account_id, list)
      setMuted(state, me.account_id, String(params.id), true)
      return new HttpResponse(null, { status: 204 })
    }),
    http.delete(`${ORIGIN}/v1/notifications/subject-mutes/:kind/:id`, ({ request, params }) => {
      const me = mine(request)
      if (!me) return envelope('platform.unauthenticated', 401)
      const list = state.mutes.get(me.account_id) ?? []
      state.mutes.set(
        me.account_id,
        list.filter((m) => !(m.kind === params.kind && m.id === params.id)),
      )
      setMuted(state, me.account_id, String(params.id), false)
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}

/** "Kaldır": kayıt (birleştirilmişse grubuyla) kalıcı silinir; başkasının/olmayan 404. */
function dismissHandler(db: OrgDb, state: NotificationsState) {
  return http.delete(`${ORIGIN}/v1/notifications/:id`, ({ request, params }) => {
    const me = fakeOrg.actorOf(db, request)
    if (!me) return envelope('platform.unauthenticated', 401)
    const rows = rowsOf(state, me.account_id)
    if (!rows.some((n) => n.id === params.id)) {
      return envelope('notifications.notification_not_found', 404)
    }
    setRows(
      state,
      me.account_id,
      rows.filter((n) => n.id !== params.id),
    )
    return new HttpResponse(null, { status: 204 })
  })
}

/** Sohbet okundu → sunucu o sohbetin bildirimlerini kapatır; `undefined` döner: sohbet sunucusu sürer. */
function chatReadObservers(db: OrgDb, state: NotificationsState) {
  const close = (account: string, chatId: string | null) => {
    for (const n of rowsOf(state, account)) {
      if (n.subject_ref.kind === 'chat' && (chatId === null || n.subject_ref.id === chatId)) {
        n.is_read = true
      }
    }
  }
  return [
    http.post(`${ORIGIN}/v1/chats/read-all`, ({ request }) => {
      const me = fakeOrg.actorOf(db, request)
      if (me) close(me.account_id, null)
      return undefined
    }),
    http.post(`${ORIGIN}/v1/chats/:chatId/read`, ({ request, params }) => {
      const me = fakeOrg.actorOf(db, request)
      if (me) close(me.account_id, String(params.chatId))
      return undefined
    }),
  ]
}

/** Karar uçları: satırın `action` kaydı sunucu gerçeğidir; kapsam başlıkları satırla eşleşmezse 403. */
function decisionHandlers(db: OrgDb, state: NotificationsState, log: DecisionLog) {
  const find = (account: string, match: (n: FakeNotification) => boolean) =>
    rowsOf(state, account).find(match)
  const resolve = (
    row: FakeNotification,
    by: string,
    outcome: 'approved' | 'rejected' | 'completed' | 'returned',
  ) => {
    row.action = {
      kind: row.action!.kind,
      request_id: row.action!.request_id,
      state: 'resolved',
      resolution: {
        outcome,
        decided_by: { account_id: by, full_name: null },
        decided_at: new Date().toISOString(),
      },
    }
  }
  return [
    http.post(`${ORIGIN}/v1/date-change-requests/:id/review`, async ({ request, params }) => {
      const me = fakeOrg.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      const body = (await request.json()) as { decision: 'approved' | 'rejected' }
      log.calls.push({ path: new URL(request.url).pathname, body, program: null, department: null })
      const row = find(me.account_id, (n) => n.action?.request_id === params.id)
      if (!row || row.action?.state === 'resolved') {
        return envelope('work.date_request_already_reviewed', 409)
      }
      resolve(row, me.account_id, body.decision)
      return json({ decision: body.decision })
    }),
    http.post(`${ORIGIN}/v1/work-items/:id/transitions`, async ({ request, params }) => {
      const me = fakeOrg.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      const body = (await request.json()) as { to: string }
      const program = request.headers.get('X-Nizamio-Program')
      const department = request.headers.get('X-Nizamio-Department')
      log.calls.push({ path: new URL(request.url).pathname, body, program, department })
      const row = find(
        me.account_id,
        (n) => n.action?.kind === 'approve_task' && n.subject_ref.id === params.id,
      )
      if (!row || row.program_id !== program || row.department_id !== department) {
        return envelope('platform.forbidden', 403)
      }
      if (row.action?.state === 'resolved') return envelope('work.invalid_transition', 409)
      resolve(row, me.account_id, body.to === 'tamamlandi' ? 'completed' : 'returned')
      return json({ work_item_id: params.id, status: body.to })
    }),
  ]
}

export function notificationMoreHandlers(db: OrgDb, state: NotificationsState, log: DecisionLog) {
  return [
    ...muteHandlers(db, state),
    dismissHandler(db, state),
    ...chatReadObservers(db, state),
    ...decisionHandlers(db, state, log),
  ]
}
