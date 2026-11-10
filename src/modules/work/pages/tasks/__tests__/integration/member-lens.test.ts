// CX-F1-E-01 — Üye merceği "bana atananlar" (K3, P1/P3) uçtan uca: GERÇEK ana sayfa + görev
// sayfası + panel, sunucu görünürlüğünü uygulayan sahte backend. Pin v0.15.0-api'de
// `listProgramWorkItems` ve `countProgramWorkItems` `assignee_account_id` süzgeci alır (BE-038):
// daraltma SUNUCUDADIR (Üye merceğinde istek "ben" ile gider); liste, sekme sayaçları, talep
// sayısı, özet ve boş durum aynı süzgeçle okunan uçlardan. Mercek yetki değildir: derin
// bağlantıyla açılan atanmamış görevin paneli (yetki sunucuda) değişmez.
// Rol dizeleri yalnız burada (K1 lint).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { trTasksPage } from '@/shared/i18n/tr/work'

import { sent, server, workItem } from '../../../../model/__tests__/harness'
import type { StandingFixture } from '../page-harness'
import {
  backendHandlers,
  body,
  fakeWork,
  ME,
  mountApp,
  settle,
  unmountApps,
  type AppContext,
} from './harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => unmountApps())
afterAll(() => server.close())

const OTHER = 'acc-2'
const pending = { request_id: 'r1', new_start_on: '2026-11-01', new_end_on: '2026-11-20' }
const person = (id: string) => ({ account_id: id, full_name: id === ME ? 'Ayşe' : 'Bora' })

/** d1: iki benim (biri ortak atanmış), iki başkasının (biri talepli); d2: bir benim, bir başkası. */
function items() {
  const row = (id: string, department: string, ids: string[], over = {}) =>
    workItem({
      work_item_id: id,
      department_id: department,
      title: `Görev ${id}`,
      assignees: ids.map(person),
      assignee_account_ids: ids,
      ...over,
    })
  return [
    row('m1', 'd1', [ME], { status: 'devam_ediyor' }),
    row('m2', 'd1', [OTHER, ME], { status: 'onaya_sunuldu' }),
    row('o1', 'd1', [OTHER], { status: 'devam_ediyor', pending_date_request: pending }),
    row('o2', 'd1', [OTHER], { status: 'tamamlandi' }),
    row('x1', 'd2', [ME], { status: 'baslanmadi' }),
    row('x2', 'd2', [OTHER], { status: 'devam_ediyor' }),
  ]
}

/** Şirket yöneticisi + d1 üyesi (Üye merceği seçilebilir). */
const ADMIN_MEMBER: StandingFixture = {
  companyAdmin: true,
  rows: [{ department_id: 'd1', role: 'uye' }],
}
/** Birleşik rol: d1 koordinatörü + d2 üyesi. */
const COORD_MEMBER: StandingFixture = {
  companyAdmin: false,
  rows: [
    { department_id: 'd1', role: 'koordinator' },
    { department_id: 'd2', role: 'uye' },
  ],
}

async function app(
  standing: StandingFixture,
  lens: 'admin' | 'coordinator' | 'member',
  departmentId: string | null,
  path = '/gorevler',
  rows = items(),
): Promise<AppContext> {
  server.use(...backendHandlers(standing, fakeWork(rows)))
  return mountApp({ programId: 'p1', lens, departmentId }, path)
}

const listed = () =>
  body()
    .findAll('[data-work-item]')
    .map((row) => row.attributes('data-work-item'))
    .sort()

/** Sekme sayacı (etiket önekiyle; `Tümü (2)` → 2). */
function tabCount(label: string): number {
  const tab = body()
    .findAll('.rp-toolbar .rp-seg button')
    .find((b) => b.text().startsWith(label))
  if (!tab) throw new Error(`sekme yok: ${label}`)
  return Number(/\((\d+)\)/.exec(tab.text())?.[1] ?? NaN)
}

const tabs = () => ({
  tumu: tabCount('Tümü'),
  devam: tabCount('Devam ediyor'),
  onay: tabCount('Onay bekleyen'),
  tamam: tabCount('Tamamlanan'),
})

const summary = () => body().get('[data-testid="tasks-summary"]').text()
const band = () => body().find('.rp-reqbar')

async function switchLens(
  ctx: AppContext,
  lens: 'admin' | 'coordinator',
  departmentId: string | null,
) {
  ctx.store.commit({ programId: 'p1', lens, departmentId })
  await settle(ctx.queryClient)
}

describe('CX-F1-E-01 · Üye merceği "bana atananlar" (liste, sayaçlar, boş durum)', () => {
  it('yönetici + Üye merceği: sunucu tüm d1 görevlerini döndürür, liste yalnız benimkiler', async () => {
    await app(ADMIN_MEMBER, 'member', 'd1')
    // Sunucu süzgeci (BE-038): liste ve sayaç AYNI süzgeçle ("ben" + seçili birim) okunur.
    const query = sent('GET', '/v1/program/work-items')[0]!.query
    expect([...query.keys()].sort()).toEqual(['assignee_account_id', 'department_id', 'limit'])
    expect(query.getAll('assignee_account_id')).toEqual([ME])
    const counts = sent('GET', '/v1/program/work-items/counts')[0]!.query
    expect([...counts.keys()].sort()).toEqual(['assignee_account_id', 'department_id'])
    expect(counts.getAll('assignee_account_id')).toEqual([ME])
    expect(listed()).toEqual(['m1', 'm2'])
    expect(tabs()).toEqual({ tumu: 2, devam: 1, onay: 1, tamam: 0 })
    expect(summary()).toContain('2 görev')
    expect(summary()).toContain('2 kişi')
    // Talepli görev başkasının → bant ve talep sayacı daraltılmış kümeden (0, bant gizli).
    expect(band().exists()).toBe(false)
    expect(tabCount('Tarih talebi')).toBe(0)
  })

  it('Üye → Admin merceği: küme genişler (başkalarının görevleri ve talep bandı gelir)', async () => {
    const ctx = await app(ADMIN_MEMBER, 'member', 'd1')
    expect(listed()).toEqual(['m1', 'm2'])
    await switchLens(ctx, 'admin', null)
    expect(listed()).toEqual(['m1', 'm2', 'o1', 'o2', 'x1', 'x2'])
    expect(tabs().tumu).toBe(6)
    expect(band().exists()).toBe(true)
  })

  it('birleşik rol (d1 koordinatör + d2 üye): Üye merceğinde yalnız benim; Koordinatör merceğinde birim tamamı', async () => {
    const ctx = await app(COORD_MEMBER, 'member', 'd2')
    expect(listed()).toEqual(['x1'])
    expect(tabs()).toEqual({ tumu: 1, devam: 0, onay: 0, tamam: 0 })
    await switchLens(ctx, 'coordinator', 'd1')
    expect(listed()).toEqual(['m1', 'm2', 'o1', 'o2'])
    expect(tabs()).toEqual({ tumu: 4, devam: 2, onay: 1, tamam: 1 })
    expect(band().exists()).toBe(true)
  })

  it('Üye merceğinde bana atanmış görev yoksa boş durum (başkalarının görevleri yüklense de)', async () => {
    const theirs = items().filter((i) => !i.assignee_account_ids.includes(ME))
    await app(ADMIN_MEMBER, 'member', 'd1', '/gorevler', theirs)
    expect(listed()).toEqual([])
    expect(body().get('[data-testid="tasks-page"] .rp-empty__title').text()).toBe(
      trTasksPage.tasksPage.empty.title,
    )
    expect(tabs()).toEqual({ tumu: 0, devam: 0, onay: 0, tamam: 0 })
  })

  it('derin bağlantı (?gorev=) başkasının görevine: liste daralır ama panel açılır (yetki sunucuda, mercek değil)', async () => {
    await app(ADMIN_MEMBER, 'member', 'd1', '/gorevler?gorev=o1')
    expect(listed()).toEqual(['m1', 'm2'])
    const panel = body().find('.rp-aside')
    expect(panel.exists()).toBe(true)
    expect(panel.text()).toContain('Görev o1')
    expect(panel.find('[role="alert"]').exists()).toBe(false)
  })

  it('ana sayfa KPI ↔ görev listesi aynı daraltılmış kümeyi sayar (Üye merceği)', async () => {
    const ctx = await app(ADMIN_MEMBER, 'member', 'd1', '/')
    const kpi = (key: string) => body().get(`[data-kpi="${key}"] [data-kpi-value]`).text()
    const open = kpi('open')
    const pendingApprovals = kpi('pending')
    expect(open).toBe('2')
    await ctx.router.push('/gorevler')
    await settle(ctx.queryClient)
    const t = tabs()
    expect(String(t.tumu - t.tamam)).toBe(open)
    expect(String(t.onay)).toBe(pendingApprovals)
  })
})
