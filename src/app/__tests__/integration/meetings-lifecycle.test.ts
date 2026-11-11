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
  switchScope,
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

it('program değişiminde açık düzenleme taslağı kapanır ve eski detay kalmaz', async () => {
  backend.server.use(
    http.get('http://localhost/v1/meetings/m1', ({ request }) =>
      request.headers.get('X-Nizamio-Program') === 'p2'
        ? HttpResponse.json(
            { code: 'collaboration.not_found', message: 'secret', request_id: 'r', fields: [] },
            { status: 404 },
          )
        : HttpResponse.json(meeting),
    ),
  )
  const app = await boot({
    email: PEOPLE.admin.email,
    scope: { programId: 'p1', lens: 'admin' },
    path: '/toplantilar/m1',
  })
  await click(
    () =>
      [...document.querySelectorAll<HTMLElement>('.meeting-detail button')].find(
        (b) => b.textContent?.trim() === 'Düzenle',
      ) ?? null,
  )
  await fill('#meeting-form input:not([type])', 'Kaybolacak taslak')
  await switchScope('Program', 'Teknofest 2027')
  await until(() => app.scope.programId === 'p2')
  await until(() => !$('[role="dialog"]'), 'form kapandı')
  await until(
    () => !document.body.textContent?.includes('Entegrasyon toplantısı'),
    'eski detay kaldırıldı',
  )
  expect(document.body.textContent).not.toContain('secret')
})

it('yeni toplantıdaki iç kişi seçicinin Escape tuşu yalnız üst pencereyi kapatır', async () => {
  await boot({
    email: PEOPLE.admin.email,
    scope: { programId: 'p1', lens: 'admin' },
    path: '/toplantilar',
  })
  await click(() => byText('.meetings-page button', 'Yeni toplantı'))
  const trigger = await until(() => byText('#meeting-form button', 'Kişileri seç'))
  trigger.focus()
  await click(() => trigger)
  const search = await until(() => $('[role="dialog"] input[type="search"]'), 'iç seçici')
  search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await until(() => !$('[role="dialog"] input[type="search"]'), 'iç seçici kapanır')
  expect($('#meeting-form')).not.toBeNull()
  await until(() => document.activeElement === trigger, 'odağın iç tetikleyiciye dönüşü')
})
