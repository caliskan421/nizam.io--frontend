import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest'
import { $, boot, byText, createBackend, idle, PEOPLE, seedWorld, teardown, until } from './harness'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const path = '/toplantilar'
const admin = { email: PEOPLE.admin.email, scope: { programId: 'p1', lens: 'admin' as const } }
function meetingHandler() {
  backend.server.use(
    http.get('http://localhost/v1/meetings/deleted', () =>
      HttpResponse.json({ items: [], next_cursor: '' }),
    ),
  )
  backend.server.use(
    http.get('http://localhost/v1/meetings', () =>
      HttpResponse.json({ items: [], next_cursor: '' }),
    ),
  )
}
beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedWorld(backend.db)
  meetingHandler()
  await boot({ ...admin, path })
  await until(() => $('.meetings-page'), 'liste ısınması')
  teardown()
}, 30_000)
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
  meetingHandler()
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

it('K7: departmansız programda liste yerine ortak durum görünür', async () => {
  backend.db.links = backend.db.links.filter((link) => link.program_id !== 'p1')
  const app = await boot({ ...admin, path })
  await until(() => $('[data-open-state="state.no-department"]'), 'K7')
  await idle(app.queryClient)
  expect($('.meetings-page')).toBeNull()
  expect(backend.sent('GET', '/v1/meetings')).toHaveLength(0)
})

it('K6: koordinatör yetkisi üyeliğe düşünce liste eylemi ve mercek güncellenir', async () => {
  const app = await boot({
    email: PEOPLE.coord.email,
    scope: { programId: 'p1', lens: 'coordinator', departmentId: 'd1' },
    path,
  })
  await until(() => byText('.meetings-page button', 'Yeni toplantı'), 'koordinatör eylemi')
  const membership = backend.db.memberships.find(
    (row) => row.account_id === PEOPLE.coord.account_id && row.program_id === 'p1',
  )!
  membership.team = 'member'
  window.dispatchEvent(new Event('focus'))
  await until(() => app.scope.lens === 'member', 'K6 mercek')
  await until(() => !byText('.meetings-page button', 'Yeni toplantı'), 'eylem kaldırıldı')
  expect($('.meetings-page')?.textContent).toContain('Üye olarak')
})
