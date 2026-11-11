import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest'

import {
  $,
  boot,
  byText,
  click,
  createBackend,
  fill,
  PEOPLE,
  seedTimeline,
  switchScope,
  teardown,
  until,
} from './harness'
import { ORIGIN } from './fake-org'
import { ADMIN_ADMIN } from './timeline-support'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const id = PEOPLE.second.account_id
beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedTimeline(backend.db)
  await boot({ ...ADMIN_ADMIN, path: '/' })
  await until(() => $('[data-kpi-source="dashboard"]'), 'ısınma')
  teardown()
}, 30000)
beforeEach(() => {
  backend.reset()
  seedTimeline(backend.db)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

it('Admin kartı yazımı pano yanıtını yeniler', async () => {
  backend.server.use(
    http.patch(`${ORIGIN}/v1/admin/users/:id`, async ({ request }) => {
      const body = (await request.json()) as { company_admin: boolean }
      backend.db.accounts.find((a) => a.account_id === id)!.admin = body.company_admin
      return HttpResponse.json({ account_id: id, changed_fields: ['company_admin'] })
    }),
  )
  const app = await boot({ ...ADMIN_ADMIN, path: '/' })
  const reports = () =>
    app.queryClient
      .getQueryCache()
      .getAll()
      .filter((q) => JSON.stringify(q.queryKey).includes('dashboard'))
  const total = () =>
    (
      reports().find((q) => (q.state.data as { total_admins?: number })?.total_admins !== undefined)
        ?.state.data as { total_admins: number } | undefined
    )?.total_admins
  await until(() => total() === 1, 'ilk pano')
  await app.router.push(`/kullanicilar?secili=${id}`)
  const card = await until(() => $('[data-role-card="admin"]'), 'Admin kartı')
  expect(card.classList.contains('users-role--on')).toBe(false)
  await click(() => card.querySelector('input'))
  await click('[data-testid="confirm-dialog"] [data-testid="confirm-accept"]')
  await until(() => card.classList.contains('users-role--on'), 'Admin kartı etkin')
  expect(backend.sent('PATCH', `/v1/admin/users/${id}`)).toHaveLength(1)
  await app.router.push('/')
  await until(() => total() === 2, 'yenilenmiş pano')
  expect(backend.sent('GET', '/v1/reports/dashboard').length).toBeGreaterThanOrEqual(2)
  await switchScope('Program', 'Teknofest 2027')
  await until(
    () => reports().some((q) => (q.state.data as { program_id?: string })?.program_id === 'p2'),
    'diğer program panosu',
  )
  expect(
    reports()
      .filter((q) => q.state.data)
      .every((q) => (q.state.data as { total_admins: number }).total_admins === 2),
  ).toBe(true)
  await click('aside button[aria-label="Çıkış yap"]')
  await until(() => $('[data-testid="login-form"]'), 'çıkış')
  expect(reports()).toHaveLength(0)
  await fill('[data-testid="login-form"] [name="email"]', PEOPLE.member.email)
  await fill('[data-testid="login-form"] [name="password"]', 'dogru-parola')
  await click(() => byText('[data-testid="login-form"] button', 'Giriş'))
  await until(() => app.session.accountId === PEOPLE.member.account_id, 'yeni hesap')
  expect(reports().every((q) => q.state.data === undefined)).toBe(true)
})
