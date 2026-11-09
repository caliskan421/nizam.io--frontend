import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { queryKeys } from '@/shared/http/query-keys'

import {
  ADMIN_SCOPE,
  harness,
  http,
  json,
  ORIGIN,
  requests,
  resetHarness,
  sent,
  server,
} from '../__tests__/harness'
import { useCoordinatorships } from './reports'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

function stat(departmentId: string, totalTasks: number) {
  return {
    department_id: departmentId,
    name: departmentId,
    kind: 'koordinatorluk',
    completed_tasks: 0,
    completion_rate: 0,
    coordinators: [],
    in_progress_tasks: 0,
    last_activity_at: null,
    meeting_count: 0,
    member_count: 0,
    not_started_tasks: 0,
    overdue_tasks: 0,
    total_tasks: totalTasks,
  }
}

const DASHBOARD = {
  active_tasks: 0,
  completed_tasks: 1,
  coordinatorship_stats: [stat('d1', 3)],
  deleted_records: 0,
  generated_at: '2026-11-09T08:00:00Z',
  overdue_tasks: 0,
  overdue_tasks_list: [],
  pending_approvals: 0,
  pending_date_changes: 0,
  priority_distribution: {},
  program_id: 'p1',
  program_name: 'Program',
  task_status_distribution: {},
  total_admins: 1,
  total_coordinators: 1,
  total_coordinatorships: 2,
  total_members: 3,
  total_tasks: 4,
  total_users: 5,
}

function routes() {
  server.use(
    http.get(`${ORIGIN}/v1/program/departments`, () =>
      json({
        departments: [
          { department_id: 'd2', display_name: 'Şasi' },
          { department_id: 'd1', display_name: 'Aviyonik', code: 'AV' },
        ],
      }),
    ),
    http.get(`${ORIGIN}/v1/reports/dashboard`, () => json(DASHBOARD)),
  )
}

describe('useCoordinatorships (08 ızgarası; K3)', () => {
  it('ŞY: tek listProgramDepartments + tek reportDashboard; birim başına istek yok; birleşim', async () => {
    routes()
    const h = harness(ADMIN_SCOPE)
    const r = h.run(() => useCoordinatorships(true))
    await vi.waitFor(() => expect(r.loading.value).toBe(false))
    await h.flush()

    expect(r.views.value.map((v) => [v.displayName, v.stat?.total_tasks ?? null])).toEqual([
      ['Aviyonik', 3],
      ['Şasi', null],
    ])
    expect(sent('GET', '/v1/program/departments')).toHaveLength(1)
    expect(sent('GET', '/v1/reports/dashboard')).toHaveLength(1)
    expect(sent('GET', '/v1/reports/dashboard')[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    // Birim başına istek yok (ekip / görev listesi fan-out'u).
    expect(requests.filter((r) => /^\/v1\/departments\/[^/]+\//.test(r.path))).toEqual([])
    expect(sent('GET', '/v1/program/work-items')).toHaveLength(0)
    // Pano ana sayfayla AYNI anahtarda (paylaşım).
    expect(h.queryClient.getQueryData(queryKeys.report.dashboard(h.store.snapshot))).toBeTruthy()
  })

  it('aynı sayfada iki tüketici (ızgara + başlık) yine tek istek atar', async () => {
    routes()
    const h = harness(ADMIN_SCOPE)
    const a = h.run(() => useCoordinatorships(true))
    h.run(() => useCoordinatorships(true))
    await vi.waitFor(() => expect(a.loading.value).toBe(false))
    await h.flush()
    expect(sent('GET', '/v1/program/departments')).toHaveLength(1)
    expect(sent('GET', '/v1/reports/dashboard')).toHaveLength(1)
  })

  it('rapor kapalıyken (yönetici değil) pano istenmez; kartlar statsız', async () => {
    routes()
    const h = harness(ADMIN_SCOPE)
    const r = h.run(() => useCoordinatorships(false))
    await vi.waitFor(() => expect(r.views.value).toHaveLength(2))
    expect(r.views.value.every((v) => v.stat === null)).toBe(true)
    expect(sent('GET', '/v1/reports/dashboard')).toHaveLength(0)
  })
})
