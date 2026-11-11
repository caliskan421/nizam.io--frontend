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
  seedWorld,
  teardown,
  until,
} from './harness'

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
beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
  handlers()
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

it('person toplantısı gerçek formdan oluşturulup detayına gider', async () => {
  backend.server.use(
    http.post('http://localhost/v1/meetings', () =>
      HttpResponse.json(
        {
          meeting,
          failed_participants: [],
          side_effects: { event_failed: false, failed_messages: 0 },
        },
        { status: 201 },
      ),
    ),
  )
  const app = await boot({
    email: PEOPLE.admin.email,
    scope: { programId: 'p1', lens: 'admin' },
    path: '/toplantilar',
  })
  await click(() => byText('.meetings-page button', 'Yeni toplantı'))
  await fill('#meeting-form input:not([type])', 'Yeni toplantı')
  await fill('#meeting-form input[type="date"]', '2099-12-31')
  await fill('#meeting-form input[type="time"]', '10:00')
  await click('#meeting-form input[value="person"]')
  await click('#meeting-form fieldset:last-of-type input')
  await click('button[form="meeting-form"]')
  await until(() => app.router.currentRoute.value.path === '/toplantilar/m1', 'yeni detay')
  await until(() => backend.sent('POST', '/v1/meetings')[0]?.body, 'gövde')
  expect(backend.sent('POST', '/v1/meetings')[0]?.body).toMatchObject({
    title: 'Yeni toplantı',
    invite_mode: 'person',
    department_ids: ['d1'],
    participant_ids: [],
  })
  expect(backend.sent('POST', '/v1/meetings')[0]?.body).not.toHaveProperty('members_included')
  expect(backend.sent('GET', '/v1/meetings/m1').length).toBeGreaterThan(0)
})

it('gerçek silme onayından silinenlere gider ve toplantıyı geri yükler', async () => {
  let deleted = false
  backend.server.use(
    http.delete('http://localhost/v1/meetings/m1', () => {
      deleted = true
      return new HttpResponse(null, { status: 204 })
    }),
    http.get('http://localhost/v1/meetings/deleted', () =>
      HttpResponse.json({ items: deleted ? [meeting] : [], next_cursor: '' }),
    ),
    http.patch('http://localhost/v1/admin/restore/meetings/m1', () => {
      deleted = false
      return HttpResponse.json({ meeting_id: 'm1', status: 'restored' })
    }),
  )
  const app = await boot({
    email: PEOPLE.admin.email,
    scope: { programId: 'p1', lens: 'admin' },
    path: '/toplantilar/m1',
  })
  await click('button[aria-label^="Diğer işlemler"]')
  await click(() => byText('[role="menuitem"]', 'Sil'))
  await click(() => byText('[role="alertdialog"] button', 'Sil'))
  await until(() => app.router.currentRoute.value.path === '/toplantilar', 'listeye dönüş')
  await click(() => byText('.meetings-page button', 'Silinenler'))
  await until(() => $('.meeting-deleted__row'), 'silinen satırı')
  await click(() => byText('.meeting-deleted button', 'Geri yükle'))
  await until(() => !$('.meeting-deleted__row'), 'geri yüklendi')
  expect(backend.sent('DELETE', '/v1/meetings/m1')).toHaveLength(1)
  expect(backend.sent('PATCH', '/v1/admin/restore/meetings/m1')).toHaveLength(1)
})

it('silinenlerde 409 not_deleted yeniden okur; kalıcı silme onay gerektirir', async () => {
  let visible = true
  backend.server.use(
    http.get('http://localhost/v1/meetings/deleted', () =>
      HttpResponse.json({ items: visible ? [meeting] : [], next_cursor: '' }),
    ),
    http.patch('http://localhost/v1/admin/restore/meetings/m1', () => {
      visible = false
      return HttpResponse.json(
        { code: 'collaboration.not_deleted', message: 'secret', fields: [] },
        { status: 409 },
      )
    }),
    http.delete('http://localhost/v1/admin/permanent/meetings/m1', () => {
      visible = false
      return HttpResponse.json({ meeting_id: 'm1', status: 'purged' })
    }),
  )
  const app = await boot({
    email: PEOPLE.admin.email,
    scope: { programId: 'p1', lens: 'admin' },
    path: '/toplantilar?zaman=silinenler',
  })
  await until(() => $('.meeting-deleted__row'), 'silinen satırı')
  await click(() => byText('.meeting-deleted button', 'Geri yükle'))
  await until(() => !$('.meeting-deleted__row'), '409 sonrası liste yenilendi')
  expect(backend.sent('PATCH', '/v1/admin/restore/meetings/m1')).toHaveLength(1)
  visible = true
  const { queryKeys } = await import('@/shared/http/query-keys')
  await app.queryClient.invalidateQueries({ queryKey: queryKeys.meetings.all(app.scope.snapshot) })
  await until(() => $('.meeting-deleted__row'), 'silinen satırı yeniden')
  await click('button[aria-label="Kalıcı olarak sil"]')
  expect(backend.sent('DELETE', '/v1/admin/permanent/meetings/m1')).toHaveLength(0)
  await click(() => byText('[role="alertdialog"] button', 'Kalıcı olarak sil'))
  await until(() => !$('.meeting-deleted__row'), 'kalıcı silindi')
  expect(backend.sent('DELETE', '/v1/admin/permanent/meetings/m1')).toHaveLength(1)
  expect(document.body.textContent).not.toContain('secret')
})
