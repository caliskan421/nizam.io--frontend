import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest'
import {
  $,
  boot,
  byText,
  click,
  createBackend,
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

it('gerçek kişi seçiciden sıralı eklemede kısmi hata adla gösterilir', async () => {
  let count = 0
  backend.server.use(
    http.post('http://localhost/v1/meetings/m1/participants', async ({ request }) => {
      const body = (await request.json()) as { user_id: string }
      count++
      return count === 1
        ? HttpResponse.json({ meeting_id: 'm1', user_id: body.user_id }, { status: 201 })
        : HttpResponse.json(
            { code: 'collaboration.participant_invalid', message: 'secret', fields: [] },
            { status: 422 },
          )
    }),
  )
  await boot({
    email: PEOPLE.coord.email,
    scope: { programId: 'p1', lens: 'coordinator', departmentId: 'd1' },
    path: '/toplantilar/m1',
  })
  await click(() => byText('.meeting-people button', 'Ekle'))
  await until(() => document.querySelectorAll('.meeting-selector-row').length >= 2, 'adaylar')
  const boxes = document.querySelectorAll<HTMLInputElement>(
    '.meeting-selector-row input:not(:disabled)',
  )
  boxes[0]!.click()
  boxes[1]!.click()
  await click(() => byText('[role="dialog"] button', 'Uygula'))
  await until(() => backend.sent('POST', '/v1/meetings/m1/participants').length === 2, 'iki istek')
  await until(() => $('.meeting-people [role="status"]'), 'kısmi hata')
  expect($('.meeting-people [role="status"]')?.textContent).toContain('1 kişi eklenemedi')
  expect(document.body.textContent).not.toContain('secret')
})
