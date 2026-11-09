// 08b bileşen testleri: GERÇEK API istemcisi + MSW (organizasyon harness'ının sunucusu ve istek
// kaydı), gerçek Pinia kapsam deposu, TanStack Query ve bellek router'ı. W74 form bileşenleri
// (`DepartmentForm`, `MemberAddDialog`) sözleşme adlarıyla TASLAKLANIR (O4/W82 entegrasyon
// turunun girdisi). Sunucu yanıtları sözleşme şekliyle ve yetkiyle süzülmeden döner.
import { VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import { defineComponent, h, type Component } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import type { ScopeSelection } from '@/shared/scope/resolve'

import { harness, http, json, ORIGIN, rosterMember } from '../../../__tests__/harness'
import { serverRoleOf } from '../../../model/capabilities'

export const ACCOUNT = 'acc-me'

export interface StandingFixture {
  companyAdmin: boolean
  rows: { department_id: string; role: string }[]
}

export const ADMIN: StandingFixture = { companyAdmin: true, rows: [] }

export const DEPARTMENTS = [
  { department_id: 'd1', display_name: 'Altyapı ve tesisat', code: 'ALT' },
  { department_id: 'd2', display_name: 'İdari işler' },
]

export function stat(departmentId: string, overrides: Record<string, unknown> = {}) {
  return {
    department_id: departmentId,
    name: departmentId,
    kind: 'koordinatorluk',
    completed_tasks: 7,
    completion_rate: 58.3,
    coordinators: [],
    in_progress_tasks: 2,
    last_activity_at: null,
    meeting_count: 0,
    member_count: 3,
    not_started_tasks: 3,
    overdue_tasks: 3,
    total_tasks: 12,
    description: 'Temiz su ve atıksu altyapısını kurar.',
    ...overrides,
  }
}

export function dashboard(stats: unknown[], overrides: Record<string, unknown> = {}) {
  return {
    active_tasks: 0,
    completed_tasks: 41,
    coordinatorship_stats: stats,
    deleted_records: 0,
    generated_at: '2026-11-09T08:00:00Z',
    overdue_tasks: 0,
    overdue_tasks_list: [],
    pending_approvals: 0,
    pending_date_changes: 0,
    priority_distribution: {},
    program_id: 'p1',
    program_name: 'Program Bir',
    task_status_distribution: {},
    total_admins: 1,
    total_coordinators: 1,
    total_coordinatorships: 2,
    total_members: 3,
    total_tasks: 100,
    total_users: 5,
    ...overrides,
  }
}

let seq = 0
export function workItem(overrides: Record<string, unknown> = {}) {
  seq += 1
  return {
    work_item_id: `w${seq}`,
    program_id: 'p1',
    department_id: 'd1',
    title: `Görev ${seq}`,
    status: 'devam_ediyor',
    priority: 'orta',
    start_on: '2026-09-01',
    end_on: '2026-10-01',
    assignee_account_ids: [],
    assignees: [],
    completion_evidence_required: false,
    created_at: '2026-09-01T08:00:00Z',
    created_by_account_id: ACCOUNT,
    created_by_full_name: 'Deneme Kişi',
    dates_revision: 1,
    edit_revision: 1,
    days_early: 0,
    days_late: 0,
    days_overdue: 0,
    is_overdue: false,
    is_completed_early: false,
    is_completed_late: false,
    pending_date_request: null,
    ...overrides,
  }
}

/** Sunucu rol değerleri capability dosyasından (K1: rol dizesi yalnız orada). */
const MEMBER = serverRoleOf('member')
const COORDINATOR = serverRoleOf('coordinator')

export const ROSTER = [
  rosterMember('a1', 'Zeynep Arslan', MEMBER),
  rosterMember('a2', 'Ali Avcı', COORDINATOR),
  rosterMember('a3', 'Çağrı Demir', MEMBER),
  rosterMember('a4', 'Eski Üye', MEMBER, 'deleted'),
]

export interface ServerFixture {
  standing?: StandingFixture
  departments?: unknown[]
  stats?: unknown[]
  roster?: unknown[]
  /** İlk sayfa + (varsa) sonraki sayfa; `nextCursor` verilirse ikinci istek `next`'i alır. */
  items?: unknown[]
  nextCursor?: string
  next?: unknown[]
}

/** Standing (S1) + departman listesi + rapor + ekip + görev listesi uçları. */
export function serverHandlers(f: ServerFixture = {}) {
  const standing = f.standing ?? ADMIN
  return [
    http.get(`${ORIGIN}/v1/me`, () =>
      json({
        account_id: ACCOUNT,
        company_admin: standing.companyAdmin,
        email: 'kisi@example.test',
        full_name: 'Deneme Kişi',
      }),
    ),
    http.get(`${ORIGIN}/v1/me/departments`, () =>
      json({
        departments: standing.rows.map((r) => ({
          ...r,
          program_id: 'p1',
          program_name: 'Program Bir',
          display_name: 'Birim',
        })),
      }),
    ),
    http.get(`${ORIGIN}/v1/programs`, () =>
      json({ programs: [{ program_id: 'p1', name: 'Program Bir', year: 2026 }] }),
    ),
    http.get(`${ORIGIN}/v1/program/departments`, () =>
      json({ departments: f.departments ?? DEPARTMENTS }),
    ),
    http.get(`${ORIGIN}/v1/reports/dashboard`, () =>
      json(dashboard(f.stats ?? [stat('d1'), stat('d2', { description: undefined })])),
    ),
    http.get(`${ORIGIN}/v1/departments/:id/members`, () => json({ members: f.roster ?? ROSTER })),
    http.get(`${ORIGIN}/v1/program/work-items`, ({ request }) => {
      const cursor = new URL(request.url).searchParams.get('cursor')
      if (cursor) return json({ items: f.next ?? [] })
      return json({ items: f.items ?? [], ...(f.nextCursor ? { next_cursor: f.nextCursor } : {}) })
    }),
  ]
}

const stub = (name: string, props: string[], render: (p: Record<string, unknown>) => unknown) =>
  defineComponent({
    name,
    props: Object.fromEntries(props.map((p) => [p, { type: null }])),
    emits: ['update:open', 'saved', 'added'],
    setup: (p) => () => render(p),
  })

/** TASLAK: W74 formları (sözleşme adı + prop'lar). */
export const FORM_STUBS = {
  DepartmentForm: stub('DepartmentForm', ['open', 'departmentId'], (p) =>
    h('div', {
      'data-form': 'department',
      'data-open': String(p.open),
      'data-dept': p.departmentId,
    }),
  ),
  MemberAddDialog: stub('MemberAddDialog', ['open', 'departmentId'], (p) =>
    h('div', { 'data-form': 'member', 'data-open': String(p.open), 'data-dept': p.departmentId }),
  ),
}

const mounted: VueWrapper[] = []

export interface DetailContext {
  wrapper: VueWrapper
  router: Router
  h: ReturnType<typeof harness>
}

export const ADMIN_LENS: ScopeSelection = { programId: 'p1', lens: 'admin', departmentId: null }

/** Bileşeni (`component`, `props`) bellek router'ı ve gerçek kapsamla bağlar. */
export async function mountWith(
  component: Component,
  props: Record<string, unknown>,
  path = '/koordinatorlukler/d1',
  selection: ScopeSelection = ADMIN_LENS,
): Promise<DetailContext> {
  const h = harness(selection)
  const empty = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: empty },
      { path: '/gorevler', name: 'work.tasks', component: empty },
      { path: '/zaman-cizelgesi', name: 'work.timeline', component: empty },
      { path: '/kullanicilar', name: 'organization.users', component: empty },
      { path: '/kullanicilar/:accountId', name: 'organization.user', component: empty },
      { path: '/koordinatorlukler', name: 'organization.coordinatorships', component: empty },
      {
        path: '/koordinatorlukler/:departmentId',
        name: 'organization.coordinatorship',
        component: empty,
      },
    ],
  })
  await router.push(path)
  const wrapper = mount(component, {
    props,
    global: {
      plugins: [getActivePinia()!, [VueQueryPlugin, { queryClient: h.queryClient }], router],
      stubs: FORM_STUBS,
    },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  await settle()
  return { wrapper, router, h }
}

/** Ağ + render turlarını boşaltır. */
export async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

export function unmountAll(): void {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  document.body.innerHTML = ''
}
