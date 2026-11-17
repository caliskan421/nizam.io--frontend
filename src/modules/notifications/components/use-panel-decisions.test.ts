// Satır içi karar (BE-146; P88): gerçek istemci + MSW; kabiliyet backend `action`'ından.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { makeNotification } from '@/shared/api/__tests__/defaults'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import {
  errorEnvelope,
  http,
  json,
  mountSetup,
  ORIGIN,
  resetAll,
  sent,
  server,
  settleQueries,
  signIn,
} from '../__tests__/harness'
import type { NotificationItem } from '../model/types'
import { usePanelDecisions } from './use-panel-decisions'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetAll()
  useToast().clear()
})
afterAll(() => server.close())
beforeEach(signIn)
const bodies: unknown[] = []
const REVIEW = `${ORIGIN}/v1/date-change-requests/r1/review`
const TRANSITION = `${ORIGIN}/v1/work-items/w9/transitions`
const result = { work_item_id: 'w9', status: 'tamamlandi' }
beforeEach(() => {
  bodies.length = 0
  server.use(
    http.get(`${ORIGIN}/v1/notifications`, () =>
      json({ items: [], awaiting_count: 0, unread_count: 0 }),
    ),
    http.get(`${ORIGIN}/v1/notifications/unread-count`, () =>
      json({ count: 0, awaiting_count: 0 }),
    ),
  )
})

const dateRequest = (over: Partial<NotificationItem> = {}) =>
  makeNotification({
    type: 'work.date_change.requested',
    program_id: 'p1',
    department_id: 'd1',
    subject_ref: { kind: 'work_item', id: 'w1' },
    action: { kind: 'review_date_request', request_id: 'r1', state: 'pending', resolution: null },
    ...over,
  })
const approveTask = (over: Partial<NotificationItem> = {}) =>
  makeNotification({
    type: 'work.item.transitioned',
    program_id: 'p9',
    department_id: 'd9',
    subject_ref: { kind: 'work_item', id: 'w9' },
    action: { kind: 'approve_task', request_id: null, state: 'pending', resolution: null },
    ...over,
  })

function setup() {
  const m = mountSetup(() => {
    useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
    return usePanelDecisions()
  })
  const seed = () => {
    m.client.setQueryData(queryKeys.notifications.list(), { seeded: true })
    m.client.setQueryData(queryKeys.notifications.unreadCount(), { seeded: true })
  }
  const stale = (key: readonly unknown[]) => m.client.getQueryState(key)?.isInvalidated
  return { ...m, seed, stale }
}

const record = (url: string, status = 200, payload: unknown = result) =>
  http.post(url, async ({ request }) => {
    bodies.push(await request.json())
    return json(payload as never, status)
  })

describe('tarih talebi kararı (review_date_request)', () => {
  it('Onayla/Reddet: S1 uç, başlıksız; gövde yalnız decision; liste + iki sayaç yenilenir', async () => {
    server.use(record(REVIEW, 200, { decision: 'approved' }))
    const m = setup()
    m.seed()
    expect(await m.result.decide(dateRequest(), 'approve')).toBe(true)
    expect(bodies).toEqual([{ decision: 'approved' }])
    const call = sent('POST', '/v1/date-change-requests/r1/review')[0]!
    expect(call.headers.get('X-Requested-With')).toBeTruthy()
    expect(call.headers.get('X-Nizamio-Program')).toBeNull()
    expect(useToast().queue.value.at(-1)!.message).toBe('Karar gönderildi')
    expect(m.stale(queryKeys.notifications.list())).toBe(true)
    expect(m.stale(queryKeys.notifications.unreadCount())).toBe(true)
    await m.result.decide(dateRequest(), 'reject')
    expect(bodies.at(-1)).toEqual({ decision: 'rejected' })
  })

  it('başkası karar verdi (409 already_reviewed): kanonik hata + liste/sayaç sunucudan okunur', async () => {
    server.use(http.post(REVIEW, () => errorEnvelope('work.date_request_already_reviewed', 409)))
    const m = setup()
    m.seed()
    expect(await m.result.decide(dateRequest(), 'approve')).toBe(false)
    expect(useToast().queue.value.at(-1)!.tone).toBe('danger')
    expect(m.stale(queryKeys.notifications.list())).toBe(true)
    expect(m.stale(queryKeys.notifications.unreadCount())).toBe(true)
  })

  it('403: sunucu cevabı kanonik; başarı bildirimi yok', async () => {
    server.use(http.post(REVIEW, () => errorEnvelope('platform.forbidden', 403)))
    const m = setup()
    m.seed()
    expect(await m.result.decide(dateRequest(), 'approve')).toBe(false)
    expect(useToast().queue.value.map((t) => t.message)).not.toContain('Karar gönderildi')
    expect(m.stale(queryKeys.notifications.list())).toBe(true)
  })
})

describe('görev onayı (approve_task) — program/departman satırdan', () => {
  it('çaprazprogram: başlıklar Notification.program_id/department_id, seçili program p1 DEĞİL', async () => {
    server.use(record(TRANSITION))
    const m = setup()
    m.seed()
    const target = { programId: 'p9', departmentId: 'd9', lens: 'admin' as const }
    const cache = queryKeys.workItems.item(target, 'w9')
    m.client.setQueryData(cache, { seeded: true })
    expect(await m.result.decide(approveTask(), 'approve')).toBe(true)
    const call = sent('POST', '/v1/work-items/w9/transitions')[0]!
    expect(call.headers.get('X-Nizamio-Program')).toBe('p9')
    expect(call.headers.get('X-Nizamio-Department')).toBe('d9')
    expect(bodies).toEqual([{ to: 'tamamlandi' }])
    expect(useScopeStore().programId).toBe('p1')
    expect(m.stale(cache)).toBe(true)
    expect(m.stale(queryKeys.notifications.list())).toBe(true)
  })

  it('Reddet = iade: gerekçe doluysa gönderilir, boşsa gerekçesiz', async () => {
    server.use(record(TRANSITION))
    const m = setup()
    await m.result.decide(approveTask(), 'reject', 'Eksik kanıt')
    await m.result.decide(approveTask(), 'reject')
    expect(bodies).toEqual([{ to: 'iade_edildi', reason: 'Eksik kanıt' }, { to: 'iade_edildi' }])
  })

  it('program ya da departman satırda yoksa istek HİÇ gitmez (seçili programdan tahmin yok)', async () => {
    server.use(record(TRANSITION))
    const m = setup()
    for (const over of [{ program_id: null }, { department_id: null }]) {
      expect(await m.result.decide(approveTask(over), 'approve')).toBe(false)
    }
    expect(sent('POST', '/v1/work-items/w9/transitions')).toHaveLength(0)
  })

  it('karar bekleyen olmayan satırda (resolved/action yok) istek gitmez', async () => {
    const m = setup()
    const resolved = approveTask({
      action: {
        kind: 'approve_task',
        request_id: null,
        state: 'resolved',
        resolution: { outcome: 'completed', decided_by: null, decided_at: null },
      },
    })
    expect(await m.result.decide(resolved, 'approve')).toBe(false)
    expect(await m.result.decide(makeNotification({ action: null }), 'approve')).toBe(false)
    expect(sent('POST', '/v1/work-items/w9/transitions')).toHaveLength(0)
  })

  it('409 subtasks_open → ortak onay → AYNI hedef close_subtasks:true; vazgeçilirse ikinci istek yok', async () => {
    let calls = 0
    server.use(
      http.post(TRANSITION, async ({ request }) => {
        bodies.push(await request.json())
        return ++calls === 1 ? errorEnvelope('work.subtasks_open', 409) : json(result)
      }),
    )
    const m = setup()
    const first = m.result.decide(approveTask(), 'approve')
    const dialog = useConfirm()
    await vi.waitFor(() => expect(dialog.current.value).not.toBeNull())
    expect(dialog.current.value!.options.title).toBe('Açık alt görevler kapatılsın mı?')
    await dialog.accept(dialog.current.value!.id)
    expect(await first).toBe(true)
    expect(bodies).toEqual([{ to: 'tamamlandi' }, { to: 'tamamlandi', close_subtasks: true }])

    bodies.length = 0
    calls = 0
    const second = m.result.decide(approveTask(), 'approve')
    await vi.waitFor(() => expect(dialog.current.value).not.toBeNull())
    dialog.cancel(dialog.current.value!.id)
    expect(await second).toBe(false)
    expect(bodies).toEqual([{ to: 'tamamlandi' }])
  })

  it('onay açıkken kapsam değişirse bayat bağlamla ikinci yazma GİTMEZ', async () => {
    server.use(http.post(TRANSITION, () => errorEnvelope('work.subtasks_open', 409)))
    const m = setup()
    const first = m.result.decide(approveTask(), 'approve')
    const dialog = useConfirm()
    await vi.waitFor(() => expect(dialog.current.value).not.toBeNull())
    useScopeStore().commit({ programId: 'p2', lens: 'admin', departmentId: null })
    const current = dialog.current.value
    if (current) await dialog.accept(current.id)
    await first
    expect(sent('POST', '/v1/work-items/w9/transitions')).toHaveLength(1)
  })

  it('karar sürerken ikinci karar yok sayılır (tek seferde bir karar); busy kimlikli', async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    server.use(
      http.post(TRANSITION, async () => {
        await gate
        return json(result)
      }),
    )
    const m = setup()
    const item = approveTask({ id: 'n-busy' })
    const first = m.result.decide(item, 'approve')
    await vi.waitFor(() => expect(m.result.busy.value).toBe('n-busy'))
    expect(await m.result.decide(approveTask({ id: 'other' }), 'approve')).toBe(false)
    release()
    expect(await first).toBe(true)
    await settleQueries(m.client)
    expect(m.result.busy.value).toBeNull()
    expect(sent('POST', '/v1/work-items/w9/transitions')).toHaveLength(1)
  })

  it('sahibi sökülmüş geç sonuç bildirim üretmez', async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    server.use(
      http.post(TRANSITION, async () => {
        await gate
        return errorEnvelope('platform.internal', 500)
      }),
    )
    const m = setup()
    const done = m.result.decide(approveTask(), 'approve')
    await vi.waitFor(() => expect(sent('POST', '/v1/work-items/w9/transitions')).toHaveLength(1))
    m.wrapper.unmount()
    release()
    expect(await done).toBe(false)
    expect(useToast().queue.value).toHaveLength(0)
  })
})
