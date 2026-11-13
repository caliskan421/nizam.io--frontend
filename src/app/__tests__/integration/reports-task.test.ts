// W142 · O3 senaryo 3: 03 görev paneli / K3 — "Görev raporu (PDF)" yetkisi (ŞY + görevin birim
// koordinatörü), bilet yolu `/v1/reports/tasks/{id}/pdf` ve `TaskReportButton`'un gerçek bileşenle
// bağı (W138 TASLAK: `work/components/detail/DetailActions.test.ts` stub true).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  ADMIN,
  boot,
  captureSaves,
  COORD,
  hold,
  idle,
  issued,
  MEMBER,
  OTHER_COORD,
  reports,
  resetReports,
  teardown,
  toasts,
  until,
  useReportsBackend,
  userClick,
} from './reports-support'

const backend = useReportsBackend({ coordinator: 'koordinator', member: 'uye' })
const saved: string[] = []
const BUTTON = () => $('[data-testid="task-report"] button')
const PANEL = () => $('.wd-actions')

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetReports()
  await boot({ ...ADMIN, path: '/gorevler?gorev=w1' })
  await until(BUTTON, 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  resetReports()
  saved.length = 0
  captureSaves(saved)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

describe('görev raporu düğmesi (sunucu görevi SÜZMEDEN döner; süzme istemcide)', () => {
  it('yönetici: bilet yolu /v1/reports/tasks/w1/pdf, program başlığı + CSRF; kaydedilir ve bildirilir', async () => {
    const app = await boot({ ...ADMIN, path: '/gorevler?gorev=w1' })
    await userClick(BUTTON)
    await until(() => saved.length === 1, 'kaydedildi')
    await idle(app.queryClient)
    expect(issued()).toHaveLength(1)
    expect(issued()[0]!.body).toEqual({ method: 'GET', path: '/v1/reports/tasks/w1/pdf' })
    expect(issued()[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(issued()[0]!.headers.get('X-Requested-With')).toBeTruthy()
    expect(toasts()).toContain('indirildi')
  })

  it('K3: görevin birim koordinatörü görür (kendi birimi w1)', async () => {
    await boot({ ...COORD, path: '/gorevler?gorev=w1' })
    await until(BUTTON, 'koordinatör düğmesi')
  })

  it("mercek ≠ yetki: d1 koordinatörü d2'de üye merceğinde (w3) görmez", async () => {
    backend.db.memberships.push({
      program_id: 'p1',
      department_id: 'd2',
      account_id: 'acc-coord',
      team: 'member',
      membership_id: 'm-kerem-d2',
    })
    const w3 = backend.db.items.find((i) => i.work_item_id === 'w3')!
    w3.assignees = [{ account_id: 'acc-coord', full_name: 'Kerem Kaya' }]
    w3.assignee_account_ids = ['acc-coord']
    const memberLens = { programId: 'p1', lens: 'member' as const }
    const app = await boot({
      email: COORD.email,
      scope: { ...memberLens, departmentId: 'd2' },
      path: '/gorevler?gorev=w3',
    })
    await until(PANEL, 'panel (w3)')
    await idle(app.queryClient)
    expect(BUTTON()).toBeNull()
  })

  it('başka birimin koordinatörü (Yazılım) kendi görevinde (w3) görür', async () => {
    await boot({ ...OTHER_COORD, path: '/gorevler?gorev=w3' })
    await until(BUTTON, 'kendi birimi')
  })

  it('üye görmez (atandığı görevde de)', async () => {
    const app = await boot({ ...MEMBER, path: '/gorevler?gorev=w1' })
    await until(PANEL, 'panel')
    await idle(app.queryClient)
    expect(BUTTON()).toBeNull()
  })

  it('yönetici K merceğinde de görür (P1: mercek ≠ yetki)', async () => {
    await boot({ ...ADMIN, scope: COORD.scope, path: '/gorevler?gorev=w1' })
    await until(BUTTON, 'düğme')
  })

  it('panel kapanınca uçuştaki istek bilet tüketmez, bildirim yok (sahip söküldü)', async () => {
    const app = await boot({ ...ADMIN, path: '/gorevler?gorev=w1' })
    const gate = hold('GET', '/v1/downloads/rt-1')
    await userClick(BUTTON)
    await gate.arrived
    await app.router.push('/gorevler')
    await until(() => !PANEL(), 'panel kapandı')
    gate.release()
    await idle(app.queryClient)
    expect(saved).toHaveLength(0)
    expect(toasts()).not.toContain('indirildi')
  })

  it('404 reporting.not_found: "Kayıt bulunamadı" bildirimi + görev okumaları tazelenir', async () => {
    reports.state.redeem = 'not_found'
    const app = await boot({ ...ADMIN, path: '/gorevler?gorev=w1' })
    await until(BUTTON, 'düğme')
    const before = backend.sent('GET', '/v1/work-items/w1').length
    await userClick(BUTTON)
    await until(() => toasts().includes('Kayıt bulunamadı'), 'bildirim')
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/work-items/w1').length).toBeGreaterThan(before)
  })
})
