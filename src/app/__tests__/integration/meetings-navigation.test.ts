import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest'
import { $, boot, click, createBackend, PEOPLE, seedWorld, teardown, until } from './harness'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const meeting = {
  meeting_id: 'm1',
  program_id: 'p1',
  title: 'Entegrasyon toplantısı',
  meeting_date: '2020-11-11T10:00:00Z',
  created_at: '2020-11-10T10:00:00Z',
  updated_at: '2020-11-10T10:00:00Z',
  created_by_account_id: PEOPLE.coord.account_id,
  created_by_role: 'coordinator',
  invite_mode: 'coordinatorship',
  owner_department_id: 'd1',
  departments: [{ department_id: 'd1', department_name: 'Mekanik' }],
  members_included: true,
  place: null,
  agenda: [],
  participants: [],
  notes: { items: [], next_cursor: '' },
  viewer_role: 'admin',
}
function handlers() {
  backend.server.use(
    http.get('http://localhost/v1/meetings/deleted', () =>
      HttpResponse.json({ items: [], next_cursor: '' }),
    ),
    http.get('http://localhost/v1/meetings', () =>
      HttpResponse.json({ items: [meeting], next_cursor: '' }),
    ),
    http.get('http://localhost/v1/meetings/m1', () => HttpResponse.json(meeting)),
    http.get('http://localhost/v1/meetings/m1/notes', () =>
      HttpResponse.json({ items: [], next_cursor: '' }),
    ),
  )
}
beforeAll(() => backend.server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
  handlers()
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

it('gerçek satır, detay ve kırıntı liste filtrelerini korur', async () => {
  const app = await boot({
    email: PEOPLE.admin.email,
    scope: { programId: 'p1', lens: 'admin' },
    path: '/toplantilar?zaman=gecmis&koordinatorluk=d1',
  })
  await click(() => $('a[href*="/toplantilar/m1"]'))
  await until(() => $('.meeting-detail'), 'gerçek detay')
  expect(document.body.textContent).toContain('Entegrasyon toplantısı')
  expect(document.body.textContent).toContain('Katılımcılar')
  await click(() => $('[data-testid="topbar-crumbs"] a[href*="/toplantilar"]'))
  await until(() => $('.meetings-page'), 'listeye dönüş')
  expect(app.router.currentRoute.value.query).toMatchObject({
    zaman: 'gecmis',
    koordinatorluk: 'd1',
  })
})
