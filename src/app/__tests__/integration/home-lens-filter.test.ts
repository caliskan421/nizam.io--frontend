// W147 · KUSUR 4 (Codex tur 1; P1/P53): yönetici (`company_admin`) K/Ü merceğinde — mercek
// YETKİ değil içerik kapsamıdır. Gerçek router + kabuk + durumlu sahte backend ile: 03 listesi
// ve sayaçları ile kabuk rozet sayaçları Koordinatör merceğinde `department_id=X`, Üye
// merceğinde `assignee_account_id=ben` ile mi istenir? Başka birimin `?gorev=` derin bağlantısı
// P1 gereği paneli açar (davranış değişmez; yetki yetkiyi sunucu belirler: 403/404 gerçek sonuç).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { $, boot, createBackend, idle, seedTimeline, teardown, until } from './harness'
import { ADMIN_ADMIN, ADMIN_COORD, type Who } from './timeline-support'
import { PEOPLE } from './world'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const LIST = '/v1/program/work-items'
const COUNTS = '/v1/program/work-items/counts'

const ADMIN_COORD_OTHER: Who = {
  email: PEOPLE.admin.email,
  scope: { programId: 'p1', lens: 'coordinator', departmentId: 'd2' },
}
const ADMIN_MEMBER: Who = {
  email: PEOPLE.admin.email,
  scope: { programId: 'p1', lens: 'member', departmentId: 'd2' },
}

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedTimeline(backend.db)
  await boot({ ...ADMIN_COORD, path: '/gorevler?gorev=w1' })
  await until(() => $('.wd-actions'), 'ısınma 03')
  teardown()
}, 60_000)
beforeEach(() => {
  backend.reset()
  seedTimeline(backend.db)
  backend.db.items.find((i) => i.work_item_id === 'w1')!.end_on = '2026-11-05'
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

function addMembership(department: string, team: 'coordinator' | 'member'): void {
  backend.db.memberships.push({
    program_id: 'p1',
    department_id: department,
    account_id: PEOPLE.admin.account_id,
    team,
    membership_id: `m-admin-${department}-${team}`,
  })
}

const lists = () => backend.sent('GET', LIST)
const counts = () => backend.sent('GET', COUNTS)
const departments = (rows: ReturnType<typeof lists>) => [
  ...new Set(rows.map((r) => r.query.get('department_id'))),
]
const assignees = (rows: ReturnType<typeof lists>) => [
  ...new Set(rows.flatMap((r) => r.query.getAll('assignee_account_id'))),
]

describe('KUSUR 4: yönetici K/Ü merceğinde içerik süzgeci (P1/P53)', () => {
  it('Koordinatör merceği (birim d1): liste, 03 sayaçları ve kabuk rozet sayaçları department_id=d1; atanan süzgeci yok', async () => {
    const app = await boot({ ...ADMIN_COORD, path: '/gorevler' })
    await until(() => lists().length > 0 && counts().length > 0, 'liste + sayaç')
    await idle(app.queryClient)
    expect(departments(lists())).toEqual(['d1'])
    expect(departments(counts())).toEqual(['d1'])
    expect(assignees(lists())).toEqual([])
    expect(assignees(counts())).toEqual([])
    // Başka birimin görevleri (w3/w4, d2) listede yok.
    expect($('[data-testid="app-shell"]')!.textContent).not.toContain('Yazılım planı')
    // Admin panosu çağrılmaz: rozet yönetici olgusuyla değil merceğin birim sayacıyla beslenir.
    expect(backend.sent('GET', '/v1/reports/dashboard')).toHaveLength(0)
  })

  it('Koordinatör merceği (X = d2, yöneticinin ek koordinatörlüğü): her istek department_id=d2', async () => {
    addMembership('d2', 'coordinator')
    const app = await boot({ ...ADMIN_COORD_OTHER, path: '/gorevler' })
    await until(() => lists().length > 0 && counts().length > 0, 'liste + sayaç')
    await idle(app.queryClient)
    expect(departments(lists())).toEqual(['d2'])
    expect(departments(counts())).toEqual(['d2'])
    expect(assignees(lists())).toEqual([])
    expect($('[data-testid="app-shell"]')!.textContent).not.toContain('Motor testi')
  })

  it('Üye merceği: liste, 03 sayaçları ve rozet sayaçları assignee_account_id=ben', async () => {
    addMembership('d2', 'member')
    const app = await boot({ ...ADMIN_MEMBER, path: '/gorevler' })
    await until(() => lists().length > 0 && counts().length > 0, 'liste + sayaç')
    await idle(app.queryClient)
    expect(assignees(lists())).toEqual([PEOPLE.admin.account_id])
    expect(assignees(counts())).toEqual([PEOPLE.admin.account_id])
    // Rozet sayacı (kabuk) da süzgeçli: süzgeçsiz sayaç isteği yok.
    expect(counts().every((r) => r.query.getAll('assignee_account_id').length === 1)).toBe(true)
    expect(lists().every((r) => r.query.getAll('assignee_account_id').length === 1)).toBe(true)
  })

  it('başka birimin ?gorev= derin bağlantısı, Admin merceği: panel açılır (P1), istek görevin KENDİ birim başlığıyla', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: '/gorevler?gorev=w3' })
    await until(() => $('.wd-actions'), 'w3 paneli')
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/work-items/w3')[0]!.headers.get('X-Nizamio-Department')).toBe(
      'd2',
    )
    expect(app.router.currentRoute.value.query.gorev).toBe('w3')
  })

  it('aynı bağlantı Koordinatör merceğinde (d1; liste d1 süzgeçli, görev d2): hedef seçili birimden çözülür, sunucu 404 verir, panel kapanır, görev gösterilmez', async () => {
    const app = await boot({ ...ADMIN_COORD, path: '/gorevler?gorev=w3' })
    await until(() => backend.sent('GET', '/v1/work-items/w3').length > 0, 'w3 isteği')
    await until(() => app.router.currentRoute.value.query.gorev === undefined, 'panel kapandı')
    await idle(app.queryClient)
    // Gerçek sonuç sunucudadır (404 work.item_not_found); istemci yetkiyi kendisi kesmez (P1).
    expect(backend.sent('GET', '/v1/work-items/w3')[0]!.headers.get('X-Nizamio-Department')).toBe(
      'd1',
    )
    expect(departments(lists())).toEqual(['d1'])
    expect($('.wd-actions')).toBeNull()
    expect($('[data-testid="app-shell"]')!.textContent).not.toContain('Yazılım planı')
  })
})
