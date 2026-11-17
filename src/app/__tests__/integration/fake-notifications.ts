// W160 · O3: durumlu sahte bildirim sunucusu (zil sayacı, panel listesi, okundu, tümünü okundu,
// Web Push anahtarı ve cihaz kaydı). Hesap başına satırlar; yanıt METİNSİZDİR (`type` +
// `subject_ref`). Sayaç ve liste aynı veriden hesaplanır (türev tutarlılığı). W82a harness'inin
// üstüne `server.use` ile eklenir; `fake-org` yer tutucu sayaç (`count: 0`) bunun önüne geçer.
import { http, HttpResponse } from 'msw'

import {
  makeNotification,
  makeNotificationList,
  makeNotificationUnreadCount,
} from '@/shared/api/__tests__/defaults'
import type { components } from '@/shared/api/schema'

import { envelope, fakeOrg, json, ORIGIN, type OrgDb } from './fake-org'

type Notification = components['schemas']['Notification']
export type FakeNotification = Notification

export interface PushFault {
  status: number
  code: string
}

export interface NotificationsState {
  /** Hesap → satırlar (en yeni önce). */
  rows: Map<string, FakeNotification[]>
  seq: number
  vapid: { enabled: boolean; public_key: string }
  /** Sonraki `registerPushTarget` bu hatayı döndürür (bir kez). */
  registerFault: PushFault | null
  targets: Map<string, { account: string; endpoint: string }>
  /** Kayıt (ve çıkış) istekleri, sırayla. */
  registered: string[]
  unregistered: string[]
}

export const VAPID_KEY =
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'

export function createNotificationsState(): NotificationsState {
  return {
    rows: new Map(),
    seq: 0,
    vapid: { enabled: false, public_key: '' },
    registerFault: null,
    targets: new Map(),
    registered: [],
    unregistered: [],
  }
}

/** Bildirim ekler (en yeniye): `ageMin` dakika önce üretilmiş sayılır. */
export function notify(
  state: NotificationsState,
  account: string,
  type: string,
  subject: { kind: string; id: string },
  patch: Partial<FakeNotification> = {},
  ageMin = 5,
): FakeNotification {
  state.seq += 1
  const row: FakeNotification = makeNotification({
    id: `n${state.seq}`,
    type,
    subject_ref: subject,
    is_read: false,
    created_at: new Date(Date.now() - ageMin * 60_000).toISOString(),
    ...patch,
  })
  state.rows.set(account, [row, ...(state.rows.get(account) ?? [])])
  return row
}

const rowsOf = (state: NotificationsState, account: string): FakeNotification[] =>
  state.rows.get(account) ?? []

const unreadOf = (state: NotificationsState, account: string): number =>
  rowsOf(state, account).filter((n) => !n.is_read).length

const notFound = () => envelope('notifications.notification_not_found', 404)

function readHandlers(db: OrgDb, state: NotificationsState) {
  return [
    http.get(`${ORIGIN}/v1/notifications/unread-count`, ({ request }) => {
      const me = fakeOrg.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      return json(makeNotificationUnreadCount({ count: unreadOf(state, me.account_id) }))
    }),
    http.get(`${ORIGIN}/v1/notifications`, ({ request }) => {
      const me = fakeOrg.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      const query = new URL(request.url).searchParams
      const limit = Number(query.get('limit') ?? 50)
      const from = Number(query.get('cursor') || 0)
      const rows = rowsOf(state, me.account_id)
      const next = from + limit < rows.length ? { next_cursor: String(from + limit) } : {}
      return json({
        ...makeNotificationList({ unread_count: unreadOf(state, me.account_id) }),
        items: rows.slice(from, from + limit),
        ...next,
      })
    }),
    http.get(`${ORIGIN}/v1/notifications/vapid-public-key`, ({ request }) => {
      if (!fakeOrg.actorOf(db, request)) return envelope('platform.unauthenticated', 401)
      return json(state.vapid)
    }),
  ]
}

function writeHandlers(db: OrgDb, state: NotificationsState) {
  return [
    http.post(`${ORIGIN}/v1/notifications/read-all`, ({ request }) => {
      const me = fakeOrg.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      const unread = rowsOf(state, me.account_id).filter((n) => !n.is_read)
      for (const row of unread) row.is_read = true
      return json({ marked_count: unread.length })
    }),
    http.post(`${ORIGIN}/v1/notifications/:id/read`, ({ request, params }) => {
      const me = fakeOrg.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      const row = rowsOf(state, me.account_id).find((n) => n.id === params.id)
      if (!row) return notFound()
      row.is_read = true
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}

function targetHandlers(db: OrgDb, state: NotificationsState) {
  return [
    http.post(`${ORIGIN}/v1/notifications/targets`, async ({ request }) => {
      const me = fakeOrg.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      const body = (await request.json()) as { endpoint: string }
      state.registered.push(body.endpoint)
      const fault = state.registerFault
      if (fault) {
        state.registerFault = null
        return envelope(fault.code, fault.status)
      }
      state.seq += 1
      const id = `t${state.seq}`
      state.targets.set(id, { account: me.account_id, endpoint: body.endpoint })
      return json({ status: 'registered', target_id: id })
    }),
    http.delete(`${ORIGIN}/v1/notifications/targets/:targetId`, ({ request, params }) => {
      const me = fakeOrg.actorOf(db, request)
      if (!me) return envelope('platform.unauthenticated', 401)
      const id = String(params.targetId)
      if (state.targets.get(id)?.account !== me.account_id) {
        return envelope('notifications.subscription_not_found', 404)
      }
      state.targets.delete(id)
      state.unregistered.push(id)
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}

export function notificationHandlers(db: OrgDb, state: NotificationsState) {
  return [...readHandlers(db, state), ...writeHandlers(db, state), ...targetHandlers(db, state)]
}
