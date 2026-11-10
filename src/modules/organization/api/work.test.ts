import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  ADMIN_SCOPE,
  byAssigneeQuery,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../__tests__/harness'
import { useDepartmentWorkItems, usePersonWorkItems } from './work'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

function item(id: string, assignees: string[], departmentId = 'd1') {
  return {
    work_item_id: id,
    program_id: 'p1',
    department_id: departmentId,
    title: id,
    priority: 'orta',
    status: 'baslanmadi',
    assignees: assignees.map((a) => ({ account_id: a, full_name: a })),
    assignee_account_ids: assignees,
    start_on: '2026-11-01',
    end_on: '2026-11-10',
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
  }
}

/** İki sayfalık liste: imleçsiz istek → c1; c1 → son sayfa (`gate` verilirse onu bekler). */
function twoPages(gate: Promise<void> = Promise.resolve()) {
  server.use(
    http.get(`${ORIGIN}/v1/program/work-items`, async ({ request }) => {
      if (new URL(request.url).searchParams.get('cursor') !== 'c1') {
        return json({ items: byAssigneeQuery([item('w1', ['u1'])], request), next_cursor: 'c1' })
      }
      await gate
      return json({
        items: byAssigneeQuery([item('w2', ['u2']), item('w3', ['u1', 'u2'])], request),
      })
    }),
  )
}

describe('organizasyon görev okuması (work sorgusu yeniden kullanımı; §9, §10)', () => {
  it('08b tek birim: department_id ile tek uç, sonuna dek sayfalama; departman başlığı yok', async () => {
    twoPages()
    const h = harness(ADMIN_SCOPE)
    const r = h.run(() => useDepartmentWorkItems('d1'))
    await vi.waitFor(() => expect(r.complete.value).toBe(true))

    expect(r.items.value.map((i) => i.work_item_id)).toEqual(['w1', 'w2', 'w3'])
    const reqs = sent('GET', '/v1/program/work-items')
    expect(reqs).toHaveLength(2)
    for (const req of reqs) {
      expect(req.query.get('department_id')).toBe('d1')
      expect(req.query.get('limit')).toBe('200')
      expect(req.headers.get('X-Nizamio-Program')).toBe('p1')
      expect(req.headers.get('X-Nizamio-Department')).toBeNull()
    }
  })

  it('kişi (05/05b): program geneli tek liste (department_id yok), sunucu assignee_account_id; çekim sürerken complete false', async () => {
    let release!: () => void
    twoPages(new Promise<void>((resolve) => (release = resolve)))
    const h = harness(ADMIN_SCOPE)
    const r = h.run(() => usePersonWorkItems('u1'))
    await vi.waitFor(() => expect(sent('GET', '/v1/program/work-items')).toHaveLength(2))
    expect(r.items.value.map((i) => i.work_item_id)).toEqual(['w1'])
    expect(r.complete.value).toBe(false)
    release()
    await vi.waitFor(() => expect(r.complete.value).toBe(true))
    expect(r.items.value.map((i) => i.work_item_id)).toEqual(['w1', 'w3'])
    for (const req of sent('GET', '/v1/program/work-items')) {
      expect(req.query.has('department_id')).toBe(false)
      expect(req.query.getAll('assignee_account_id')).toEqual(['u1'])
    }
  })

  it('05 paneli ve 05b aynı anahtarı paylaşır: iki tüketici, sayfa başına tek istek', async () => {
    twoPages()
    const h = harness(ADMIN_SCOPE)
    const a = h.run(() => usePersonWorkItems('u1'))
    h.run(() => usePersonWorkItems('u1'))
    await vi.waitFor(() => expect(a.complete.value).toBe(true))
    await h.flush()
    expect(sent('GET', '/v1/program/work-items')).toHaveLength(2)
  })
})
