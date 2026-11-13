// Ana sayfa testleri: GERÇEK API istemcisi (`@/shared/http`) + MSW sahte backend (istek kaydı),
// gerçek Pinia kapsam deposu, TanStack Query ve bellek router'ı (03 rotası adıyla). Oturum
// deposu test dosyasında taklit edilir (`useStanding` yalnız oturum açıkken okur).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { http, HttpResponse, type JsonBodyType } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import type { Component } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { settleQueries } from '@/shared/http/__tests__/settle'
import type { ScopeSelection } from '@/shared/scope/resolve'
import { useScopeStore } from '@/shared/scope/store'

import type { CoordinatorshipStat } from '../model/coordinatorships'
import type { WorkItem } from '@/modules/work/public'

import type { DashboardReport, KpiItem } from '../model/types'

export const ORIGIN = 'http://localhost'
export const LIST = '/v1/program/work-items'
export const DASHBOARD = '/v1/reports/dashboard'
export const COUNTS = '/v1/program/work-items/counts'

export interface Recorded {
  method: string
  path: string
  query: URLSearchParams
  headers: Headers
}

export const server = setupServer()
export const requests: Recorded[] = []

server.events.on('request:start', ({ request }) => {
  const url = new URL(request.url)
  requests.push({
    method: request.method,
    path: url.pathname,
    query: url.searchParams,
    headers: new Headers(request.headers),
  })
})

export const sent = (path: string) => requests.filter((r) => r.path === path)

export function json(body: JsonBodyType, status = 200) {
  return HttpResponse.json(body, { status })
}

export function errorEnvelope(code: string, status: number) {
  return HttpResponse.json(
    { code, message: 'sunucu iletisi', request_id: 'req-9', fields: [] },
    { status },
  )
}

export { http }

// --- Fikstürler ---------------------------------------------------------------------------

export interface StandingFixture {
  companyAdmin: boolean
  /** Ekip satırları; rol dizeleri test dosyalarında yazılır (K1 lint). */
  rows: { department_id: string; role: string }[]
  fullName?: string
}

export const ADMIN_SCOPE: ScopeSelection = { programId: 'p1', lens: 'admin', departmentId: null }
export const COORD_SCOPE: ScopeSelection = {
  programId: 'p1',
  lens: 'coordinator',
  departmentId: 'd1',
}
export const MEMBER_SCOPE: ScopeSelection = { programId: 'p1', lens: 'member', departmentId: 'd1' }

export function standingHandlers(fixture: StandingFixture) {
  return [
    http.get(`${ORIGIN}/v1/me`, () =>
      json({
        account_id: 'acc-1',
        company_admin: fixture.companyAdmin,
        email: 'kisi@example.test',
        full_name: fixture.fullName ?? 'Ayşe Nur Yılmaz',
      }),
    ),
    http.get(`${ORIGIN}/v1/me/departments`, () =>
      json({
        departments: fixture.rows.map((r) => ({
          ...r,
          program_id: 'p1',
          program_name: 'Program Bir',
          display_name: `Birim ${r.department_id}`,
        })),
      }),
    ),
    http.get(`${ORIGIN}/v1/programs`, () =>
      json({ programs: [{ program_id: 'p1', name: 'Program Bir', year: 2026 }] }),
    ),
  ]
}

export function dashboard(over: Partial<DashboardReport> = {}): DashboardReport {
  return {
    program_id: 'p1',
    program_name: 'Program Bir',
    generated_at: '2026-11-09T08:00:00Z',
    total_tasks: 79,
    completed_tasks: 39,
    active_tasks: 40,
    overdue_tasks: 15,
    pending_approvals: 3,
    pending_date_changes: 2,
    deleted_records: 127,
    total_users: 40,
    total_admins: 2,
    total_coordinators: 11,
    total_members: 30,
    total_coordinatorships: 11,
    task_status_distribution: {},
    priority_distribution: {},
    coordinatorship_stats: [],
    overdue_tasks_list: [],
    ...over,
  }
}

/** Koordinatörlük satırı (şemanın zorunlu alanları); bölgeler 08/F6 fikstürüyle sınanır. */
export function stat(
  departmentId: string,
  name: string,
  over: Partial<CoordinatorshipStat> = {},
): CoordinatorshipStat {
  return {
    department_id: departmentId,
    name,
    kind: 'koordinatorluk',
    coordinators: [{ account_id: `lead-${departmentId}`, full_name: 'Abdullah Ateş' }],
    total_tasks: 10,
    completed_tasks: 4,
    in_progress_tasks: 3,
    not_started_tasks: 2,
    overdue_tasks: 0,
    completion_rate: 40,
    member_count: 5,
    meeting_count: 0,
    last_activity_at: null,
    ...over,
  }
}

export const dashboardHandler = (report: DashboardReport = dashboard()) =>
  http.get(`${ORIGIN}${DASHBOARD}`, () => json(report))

let seq = 0
/** Liste satırı: KPI alanları + şemanın zorunlu alanları. */
export function row(status: KpiItem['status'], over: Partial<WorkItem> = {}): WorkItem {
  seq += 1
  return {
    work_item_id: `w${seq}`,
    program_id: 'p1',
    department_id: 'd1',
    title: `Görev ${seq}`,
    priority: 'orta' as const,
    status,
    assignees: [],
    assignee_account_ids: ['acc-1'],
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
    created_by_account_id: 'acc-9',
    created_by_full_name: null,
    edit_revision: 1,
    dates_revision: 1,
    ...over,
  }
}

/**
 * Sayaç ucu (`countProgramWorkItems`, BE-003): `rows` görünür kümedir; sunucu atanan süzgeci
 * (`assignee_account_id`, VEYA; BE-038) uygulanır, `department_id` bu sahtede süzülmez.
 */
export function countsHandler(rows: ReturnType<typeof row>[]) {
  return http.get(`${ORIGIN}${COUNTS}`, ({ request }) => {
    const ids = new URL(request.url).searchParams.getAll('assignee_account_id')
    const kept = rows.filter(
      (r) => ids.length === 0 || ids.some((id) => r.assignee_account_ids.includes(id)),
    )
    const by_status = {
      baslanmadi: 0,
      devam_ediyor: 0,
      onaya_sunuldu: 0,
      iade_edildi: 0,
      tamamlandi: 0,
    }
    for (const r of kept) by_status[r.status] += 1
    return json({
      total: kept.length,
      by_status,
      overdue: kept.filter((r) => r.is_overdue && r.status !== 'tamamlandi').length,
      pending_date_requests: 0,
    })
  })
}

// --- Bağlama ------------------------------------------------------------------------------

const mounted: VueWrapper[] = []
const clients: QueryClient[] = []

export interface Mounted {
  wrapper: VueWrapper
  router: Router
  store: ReturnType<typeof useScopeStore>
  queryClient: QueryClient
}

/** Bileşeni `selection` kapsamıyla bağlar ve ilk okumaları bekler. */
export async function mountWith(
  component: Component,
  selection: ScopeSelection | null,
  props: Record<string, unknown> = {},
): Promise<Mounted> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  if (selection) store.commit(selection)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const empty = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: empty },
      { path: '/gorevler', name: 'work.tasks', component: empty },
      { path: '/silinen-kayitlar', name: 'deleted-records.list', component: empty },
      { path: '/arsiv', name: 'archive.folders', component: empty },
      { path: '/arsiv/:klasorId', name: 'archive.folder', component: empty },
      { path: '/kullanicilar', name: 'organization.users', component: empty },
      { path: '/koordinatorlukler', name: 'organization.coordinatorships', component: empty },
      {
        path: '/koordinatorlukler/:departmentId',
        name: 'organization.coordinatorship',
        component: empty,
      },
      { path: '/toplantilar', name: 'collaboration.meetings', component: empty },
    ],
  })
  await router.push('/')
  const wrapper = mount(component, {
    props,
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }], router] },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  clients.push(queryClient)
  await settle()
  return { wrapper, router, store, queryClient }
}

/**
 * Bağlı bütün istemcilerde sorgu/yazma yerleşene dek (koşul/olay tabanlı; sabit tur ya da
 * süre tahmini yok — `@/shared/http/__tests__/settle`).
 */
export function settle(): Promise<void> {
  return settleQueries(clients)
}

export function resetAll(): void {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  clients.length = 0
  requests.length = 0
  server.resetHandlers()
  document.body.innerHTML = ''
}
