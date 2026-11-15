// W128 · 12 Silinen kayıtlar entegrasyonu (KESİN 29): ana sayfa E-01-02 düğmesi ve sayaç →
// ekran → geri yükle/kalıcı sil → türetilmiş kaynakların (pano `deleted_records`, görev listesi,
// toplantı listesi, `me/departments`, kullanıcı listesi) önce-sonra yenilenmesi; kapsam değişimi.
// GERÇEK uygulama kökü (kabuk, router, onay yuvası) + durumlu sahte backend; silinen uçları bu
// dosyada eklenir (durum: `deleted`).
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  boot,
  byText,
  click,
  createBackend,
  idle,
  PEOPLE,
  seedWorld,
  switchScope,
  teardown,
  toasts,
  until,
} from './harness'
import {
  withDeletedAccountDefaults,
  withDeletedDepartmentDefaults,
  withDeletedTaskDefaults,
} from '@/shared/api/__tests__/defaults'

import { item, ORIGIN } from './fake-org'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const ADMIN = { email: PEOPLE.admin.email, scope: { programId: 'p1', lens: 'admin' as const } }
const COORD = {
  email: PEOPLE.coord.email,
  scope: { programId: 'p1', lens: 'coordinator' as const, departmentId: 'd1' },
}

interface Deleted {
  tasks: string[]
  meetings: string[]
  departments: string[]
  accounts: string[]
}
let deleted: Deleted = { tasks: [], meetings: [], departments: [], accounts: [] }

const fresh = (): Deleted => ({
  tasks: ['wd'],
  meetings: ['md'],
  departments: ['dd'],
  accounts: ['acc-dead'],
})
const total = () =>
  deleted.tasks.length +
  deleted.meetings.length +
  deleted.departments.length +
  deleted.accounts.length

const meetingRow = (id: string) => ({
  meeting_id: id,
  program_id: 'p1',
  title: 'Silinmiş toplantı',
  meeting_date: '2026-10-24T07:00:00Z',
  created_at: '2026-10-01T07:00:00Z',
  updated_at: '2026-10-01T07:00:00Z',
  created_by_account_id: PEOPLE.admin.account_id,
  created_by_role: 'admin',
  invite_mode: 'coordinatorship',
  members_included: false,
  owner_department_id: 'd1',
  departments: [{ department_id: 'd1', department_name: 'Mekanik' }],
  place: null,
  deleted_at: '2026-11-11T09:00:00Z',
  deleted_by: { account_id: PEOPLE.admin.account_id, full_name: PEOPLE.admin.full_name },
})
let restoredMeetings: string[] = []

/** Silinen listeleri + yaşam döngüsü uçları; pano sayacı bu duruma bağlıdır. */
function install(): void {
  const lifecycle = (
    segment: string,
    list: keyof Deleted,
    field: string,
    onRestore?: (id: string) => void,
  ) => [
    http.patch(`${ORIGIN}/v1/admin/restore/${segment}/:id`, ({ params }) => {
      const id = String(params.id)
      deleted[list] = deleted[list].filter((x) => x !== id)
      onRestore?.(id)
      return HttpResponse.json({ [field]: id, status: 'restored' })
    }),
    http.delete(`${ORIGIN}/v1/admin/permanent/${segment}/:id`, ({ params }) => {
      const id = String(params.id)
      deleted[list] = deleted[list].filter((x) => x !== id)
      return HttpResponse.json({ [field]: id, status: 'purged', files_deleted: 0 })
    }),
  ]
  backend.server.use(
    http.get(`${ORIGIN}/v1/reports/dashboard`, () =>
      HttpResponse.json({
        program_id: 'p1',
        program_name: 'Teknofest 2026',
        generated_at: '2026-11-09T09:00:00Z',
        total_tasks: backend.db.items.length,
        completed_tasks: 0,
        active_tasks: backend.db.items.length,
        overdue_tasks: 0,
        overdue_tasks_list: [],
        pending_approvals: 0,
        pending_date_changes: 0,
        deleted_records: total(),
        priority_distribution: {},
        task_status_distribution: {},
        total_admins: 1,
        total_coordinators: 0,
        total_coordinatorships: 2,
        total_members: 3,
        total_users: 5,
        coordinatorship_stats: [],
      }),
    ),
    http.get(`${ORIGIN}/v1/admin/deleted/work-items`, () =>
      HttpResponse.json({
        items: deleted.tasks.map((id) =>
          withDeletedTaskDefaults({
            work_item_id: id,
            title: 'Silinmiş görev',
            department_id: 'd1',
            status: 'devam_ediyor',
            deleted_at: '2026-11-11T10:00:00Z',
            file_count: 0,
          }),
        ),
        total: deleted.tasks.length,
      }),
    ),
    http.get(`${ORIGIN}/v1/admin/deleted/meetings`, () =>
      HttpResponse.json({
        items: deleted.meetings.map(meetingRow),
        next_cursor: '',
        total: deleted.meetings.length,
      }),
    ),
    http.get(`${ORIGIN}/v1/admin/deleted/departments`, () =>
      HttpResponse.json({
        departments: deleted.departments.map((id) =>
          withDeletedDepartmentDefaults({
            department_id: id,
            name: 'Silinmiş birim',
            kind: 'koordinatorluk',
            code: 'SIL',
            deleted_at: '2026-11-10T09:00:00Z',
          }),
        ),
        total: deleted.departments.length,
      }),
    ),
    http.get(`${ORIGIN}/v1/admin/deleted/summary`, () =>
      HttpResponse.json({
        tasks: deleted.tasks.length,
        meetings: deleted.meetings.length,
        departments: deleted.departments.length,
        accounts: deleted.accounts.length,
        total: total(),
      }),
    ),
    http.get(`${ORIGIN}/v1/admin/deleted/accounts`, () =>
      HttpResponse.json({
        accounts: deleted.accounts.map((id) =>
          withDeletedAccountDefaults({ account_id: id, full_name: 'Silinmiş Kişi' }),
        ),
        total: deleted.accounts.length,
      }),
    ),
    http.get(`${ORIGIN}/v1/meetings`, () =>
      HttpResponse.json({
        items: restoredMeetings.map((id) => ({
          ...meetingRow(id),
          deleted_at: undefined,
          deleted_by: undefined,
        })),
        next_cursor: '',
      }),
    ),
    ...lifecycle('work-items', 'tasks', 'work_item_id', (id) => {
      const member = backend.db.accounts.find((a) => a.account_id === PEOPLE.member.account_id)!
      backend.db.items.push(item(id, 'p1', 'd1', member, { title: 'Silinmiş görev' }))
    }),
    ...lifecycle('meetings', 'meetings', 'meeting_id', (id) => restoredMeetings.push(id)),
    ...lifecycle('departments', 'departments', 'department_id'),
    ...lifecycle('accounts', 'accounts', 'account_id'),
  )
}

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedWorld(backend.db)
  deleted = fresh()
  install()
  await boot({ ...ADMIN, path: '/silinen-kayitlar' })
  await until(() => $('[data-record-key]'), 'ısınma')
  teardown()
  await boot({ ...ADMIN, path: '/' })
  await until(() => $('[data-testid="home-deleted-records"]'), 'ısınma ana sayfa')
  teardown()
}, 60_000)
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
  deleted = fresh()
  restoredMeetings = []
  install()
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const counter = () => $('[data-testid="home-deleted-records"] .rp-count')?.textContent
const restore = (key: string) =>
  click(() => $(`[data-record-key="${key}"] [data-action="restore"]`))
async function acceptConfirm() {
  await click(() => $('[data-testid="confirm-dialog"] [data-testid="confirm-accept"]'))
  await until(() => !$('[data-testid="confirm-dialog"]'), 'onay kapanır')
}
async function tab(kind: string) {
  await click(() => $(`[data-testid="dr-kinds"] [data-kind="${kind}"]`))
  await until(() => $(`[data-testid="dr-kinds"] [data-kind="${kind}"][aria-pressed="true"]`), kind)
}

describe('giriş: ana sayfa düğmesi (E-01-02, P36)', () => {
  it('yönetici: sayaç = pano deleted_records; tıklama /silinen-kayitlar ekranını açar; menüde giriş yok', async () => {
    const app = await boot({ ...ADMIN, path: '/' })
    await until(() => counter(), 'sayaç')
    expect(counter()).toBe('4')
    expect($('[data-testid="home-deleted-records"]')!.getAttribute('title')).toContain(
      'farklı olabilir',
    )
    expect(byText('aside a', 'Silinen kayıtlar')).toBeNull()
    await click('[data-testid="home-deleted-records"]')
    await until(() => $('[data-testid="deleted-records-page"]'), 'ekran')
    expect(app.router.currentRoute.value.path).toBe('/silinen-kayitlar')
    await until(() => $('[data-record-key="gorev:wd"]'), 'görev satırı')
  })

  it('koordinatör: ana sayfada düğme DOM’da yok', async () => {
    await boot({ ...COORD, path: '/' })
    await until(() => $('[data-testid="home-page"]'), 'ana sayfa')
    expect($('[data-testid="home-deleted-records"]')).toBeNull()
  })

  it('koordinatör doğrudan URL açarsa yetkisiz durumu gösterilir, silinen uçları çağrılmaz', async () => {
    await boot({ ...COORD, path: '/silinen-kayitlar' })
    await until(() => $('[data-testid="deleted-records-denied"]'), 'yetkisiz durum')
    expect(backend.sent('GET', '/v1/admin/deleted/work-items')).toHaveLength(0)
    expect(backend.sent('GET', '/v1/admin/deleted/accounts')).toHaveLength(0)
  })
})

describe('geri yükle → türetilmiş kaynaklar önce/sonra (KESİN 29)', () => {
  it('görev: pano (ana sayfa sayacı), görev listesi ve silinen liste yenilenir', async () => {
    const app = await boot({ ...ADMIN, path: '/' })
    await until(() => counter() === '4', 'sayaç önce')
    await app.router.push('/gorevler')
    await until(() => $('[data-work-item="w1"]'), 'görev listesi')
    expect($('[data-work-item="wd"]')).toBeNull()
    await app.router.push('/silinen-kayitlar')
    await until(() => $('[data-record-key="gorev:wd"]'), 'silinen görev')
    const dashboards = backend.sent('GET', '/v1/reports/dashboard').length
    const lists = backend.sent('GET', '/v1/program/work-items').length

    await restore('gorev:wd')
    await acceptConfirm()
    await idle(app.queryClient)
    expect(backend.sent('PATCH', '/v1/admin/restore/work-items/wd')).toHaveLength(1)
    expect(
      backend.sent('PATCH', '/v1/admin/restore/work-items/wd')[0]!.headers.get('X-Nizamio-Program'),
    ).toBe('p1')
    await until(() => !$('[data-record-key="gorev:wd"]'), 'satır düştü')
    expect(toasts()).toContain('Silinmiş görev geri yüklendi.')

    await app.router.push('/')
    await until(() => counter() === '3', 'sayaç sonra')
    expect(backend.sent('GET', '/v1/reports/dashboard').length).toBeGreaterThan(dashboards)
    await app.router.push('/gorevler')
    await until(() => $('[data-work-item="wd"]'), 'geri yüklenen görev listede')
    expect(backend.sent('GET', '/v1/program/work-items').length).toBeGreaterThan(lists)
  })

  it('toplantı: toplantı listesi ve sayaç yenilenir', async () => {
    const app = await boot({ ...ADMIN, path: '/toplantilar' })
    await until(() => $('.meetings-page'), 'toplantılar')
    expect(restoredMeetings).toEqual([])
    await app.router.push('/silinen-kayitlar?tur=toplanti')
    await until(() => $('[data-record-key="toplanti:md"]'), 'silinen toplantı')
    const lists = backend.sent('GET', '/v1/meetings').length
    await restore('toplanti:md')
    await acceptConfirm()
    await idle(app.queryClient)
    expect(backend.sent('PATCH', '/v1/admin/restore/meetings/md')).toHaveLength(1)
    await app.router.push('/toplantilar')
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/meetings').length).toBeGreaterThan(lists)
    await app.router.push('/')
    await until(() => counter() === '3', 'sayaç sonra')
  })

  it('koordinatörlük: standing (me/departments) ve departman listeleri yeniden okunur', async () => {
    const app = await boot({ ...ADMIN, path: '/silinen-kayitlar?tur=koordinatorluk' })
    await until(() => $('[data-record-key="koordinatorluk:dd"]'), 'silinen birim')
    await idle(app.queryClient)
    const standing = backend.sent('GET', '/v1/me/departments').length
    const catalog = backend.sent('GET', '/v1/departments').length
    await restore('koordinatorluk:dd')
    await acceptConfirm()
    await idle(app.queryClient)
    expect(backend.sent('PATCH', '/v1/admin/restore/departments/dd')).toHaveLength(1)
    expect(backend.sent('GET', '/v1/me/departments').length).toBeGreaterThan(standing)
    expect(backend.sent('GET', '/v1/program/departments').length).toBeGreaterThan(0)
    await app.router.push('/koordinatorlukler')
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/departments').length).toBeGreaterThanOrEqual(catalog)
    await app.router.push('/')
    await until(() => counter() === '3', 'sayaç sonra')
  })

  it('kullanıcı (hesap geneli): kullanıcı listesi yenilenir; kalıcı sil de sayacı düşürür', async () => {
    const app = await boot({ ...ADMIN, path: '/kullanicilar' })
    await until(() => $('.users-page'), 'kullanıcılar')
    await idle(app.queryClient)
    const users = backend.sent('GET', '/v1/admin/users').length
    await app.router.push('/silinen-kayitlar?tur=kullanici')
    await until(() => $('[data-record-key="kullanici:acc-dead"]'), 'silinen hesap')
    await restore('kullanici:acc-dead')
    await acceptConfirm()
    await idle(app.queryClient)
    expect(backend.sent('PATCH', '/v1/admin/restore/accounts/acc-dead')).toHaveLength(1)
    // Hesap ucu S1: program başlığı yok.
    expect(
      backend
        .sent('PATCH', '/v1/admin/restore/accounts/acc-dead')[0]!
        .headers.get('X-Nizamio-Program'),
    ).toBeNull()
    await app.router.push('/kullanicilar')
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/admin/users').length).toBeGreaterThan(users)

    await app.router.push('/silinen-kayitlar?tur=toplanti')
    await until(() => $('[data-record-key="toplanti:md"]'), 'silinen toplantı')
    await click(() => $('[data-record-key="toplanti:md"] [data-action="purge"]'))
    await acceptConfirm()
    await idle(app.queryClient)
    expect(backend.sent('DELETE', '/v1/admin/permanent/meetings/md')).toHaveLength(1)
    await app.router.push('/')
    await until(() => counter() === '2', 'kalıcı silme sonrası sayaç')
  })
})

describe('özet sayaçları ↔ ana sayfa rozeti (BE-110, KESİN 29)', () => {
  const segment = () =>
    Object.fromEntries(
      $$('[data-testid="dr-kinds"] button[data-kind]')
        .map((b) => [b.dataset.kind, b.querySelector('.rp-count')?.textContent])
        .filter(([, n]) => n !== undefined),
    )

  it('segment sayaçları özet (dört tür kesin) ve toplamı ana sayfa rozetiyle aynı hesap', async () => {
    const app = await boot({ ...ADMIN, path: '/silinen-kayitlar' })
    await until(() => $('[data-record-key="gorev:wd"]'), 'görev satırı')
    await until(() => segment().gorev, 'özet sayaçları')
    expect(segment()).toEqual({ gorev: '1', toplanti: '1', koordinatorluk: '1', kullanici: '1' })
    expect(backend.sent('GET', '/v1/admin/deleted/summary')).toHaveLength(1)
    expect(
      backend.sent('GET', '/v1/admin/deleted/summary')[0]!.headers.get('X-Nizamio-Program'),
    ).toBe('p1')
    await app.router.push('/')
    await until(() => counter() === '4', 'rozet = özet toplamı')
  })

  it('geri yükleme özeti, listeyi ve ana sayfa rozetini birlikte yeniler; kalıcı silme de', async () => {
    const app = await boot({ ...ADMIN, path: '/silinen-kayitlar?tur=toplanti' })
    await until(() => segment().toplanti === '1', 'önce')
    const summaries = backend.sent('GET', '/v1/admin/deleted/summary').length
    await restore('toplanti:md')
    await acceptConfirm()
    await idle(app.queryClient)
    await until(() => segment().toplanti === '0', 'özet sayacı düştü')
    expect(backend.sent('GET', '/v1/admin/deleted/summary').length).toBeGreaterThan(summaries)
    expect(segment()).toEqual({ gorev: '1', toplanti: '0', koordinatorluk: '1', kullanici: '1' })
    await app.router.push('/')
    await until(() => counter() === '3', 'rozet sonra')
    await app.router.push('/silinen-kayitlar?tur=kullanici')
    await until(() => $('[data-record-key="kullanici:acc-dead"]'), 'silinen hesap')
    await click(() => $('[data-record-key="kullanici:acc-dead"] [data-action="purge"]'))
    await acceptConfirm()
    await idle(app.queryClient)
    await until(() => segment().kullanici === '0', 'hesap sayacı düştü')
    expect(segment().gorev).toBe('1')
  })
})

describe('kapsam değişimi (K2)', () => {
  it('program değişince S2 silinen listeleri yeni başlıkla yeniden okunur; hesap listesi düşmez', async () => {
    const app = await boot({ ...ADMIN, path: '/silinen-kayitlar' })
    await until(() => $('[data-record-key="gorev:wd"]'), 'görev')
    await tab('kullanici')
    await until(() => $('[data-record-key="kullanici:acc-dead"]'), 'hesap')
    await tab('gorev')
    await idle(app.queryClient)
    const tasks = backend.sent('GET', '/v1/admin/deleted/work-items')
    expect(tasks.every((r) => r.headers.get('X-Nizamio-Program') === 'p1')).toBe(true)
    const accounts = backend.sent('GET', '/v1/admin/deleted/accounts').length

    await switchScope('Program', 'Teknofest 2027')
    await until(() => app.scope.programId === 'p2', 'kapsam p2')
    await idle(app.queryClient)
    await until(
      () =>
        backend
          .sent('GET', '/v1/admin/deleted/work-items')
          .some((r) => r.headers.get('X-Nizamio-Program') === 'p2'),
      'p2 başlığıyla görev listesi',
    )
    await tab('kullanici')
    await idle(app.queryClient)
    // Hesap geneli anahtar düşmedi: sekmeye dönüşte önbellekten görünür; ek istek yalnız arka plan doğrulaması.
    expect($$('[data-record-key]').map((r) => r.dataset.recordKey)).toEqual(['kullanici:acc-dead'])
    expect(backend.sent('GET', '/v1/admin/deleted/accounts').length).toBeGreaterThanOrEqual(
      accounts,
    )
  })
})
