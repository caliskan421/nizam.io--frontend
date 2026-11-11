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

it('katılımcı serisi belirsiz sonuçta durur ve sonraki kişiye istek göndermez', async () => {
  let count = 0
  backend.server.use(
    http.post('http://localhost/v1/meetings/m1/participants', async ({ request }) => {
      const body = (await request.json()) as { user_id: string }
      count++
      return count === 1
        ? HttpResponse.json({ meeting_id: 'm1', user_id: body.user_id }, { status: 201 })
        : HttpResponse.error()
    }),
  )
  await boot({
    email: PEOPLE.admin.email,
    scope: { programId: 'p1', lens: 'admin' },
    path: '/toplantilar/m1',
  })
  // Administratörün bağlı koordinatör olması, coordinatorship kipinde katılımcı yönetimini açar.
  await click(() => byText('.meeting-people button', 'Ekle'))
  await until(() => document.querySelectorAll('.meeting-selector-row').length >= 3, 'adaylar')
  const boxes = document.querySelectorAll<HTMLInputElement>(
    '.meeting-selector-row input:not(:disabled)',
  )
  boxes[0]!.click()
  boxes[1]!.click()
  boxes[2]!.click()
  await click(() => byText('[role="dialog"] button', 'Uygula'))
  await until(() => $('.meeting-people [role="status"]'), 'belirsizlik uyarısı')
  expect(backend.sent('POST', '/v1/meetings/m1/participants')).toHaveLength(2)
})

it('koordinatör seçicisi kendi ekibi ve kesilme uyarılarını ayrı gösterir', async () => {
  backend.server.use(
    http.get('http://localhost/v1/departments/:id/members', () =>
      HttpResponse.json(
        { members: [{ account_id: 'x', full_name: 'Ada Örnek', status: 'active' }] },
        { headers: { 'X-Result-Truncated': 'true' } },
      ),
    ),
  )
  await boot({
    email: PEOPLE.coord.email,
    scope: { programId: 'p1', lens: 'coordinator', departmentId: 'd1' },
    path: '/toplantilar/m1',
  })
  await click(() => byText('.meeting-people button', 'Ekle'))
  await until(() => $('[role="dialog"]')?.textContent?.includes('Ada Örnek'), 'adaylar')
  expect($('[role="dialog"]')?.textContent).toContain('Yalnız koordine ettiğin')
  expect($('[role="dialog"]')?.textContent).toContain('Liste eksik olabilir')
  expect(backend.sent('GET', '/v1/departments/d1/members').length).toBeGreaterThan(0)
  expect(backend.sent('GET', '/v1/departments/d2/members')).toHaveLength(0)
})

it('yönetici seçicisi program adaylarını ve yalnız kesilme uyarısını gösterir', async () => {
  backend.server.use(
    http.get('http://localhost/v1/admin/users', () =>
      HttpResponse.json(
        {
          users: [
            { account_id: 'x', full_name: 'Ada Örnek', teams: [{ program_id: 'p1' }] },
            { account_id: 'y', full_name: 'Başka Program', teams: [{ program_id: 'p2' }] },
          ],
          next_cursor: '',
          total: 2,
          role_counts: {},
        },
        { headers: { 'X-Result-Truncated': 'true' } },
      ),
    ),
  )
  await boot({
    email: PEOPLE.admin.email,
    scope: { programId: 'p1', lens: 'admin' },
    path: '/toplantilar/m1',
  })
  await click(() => byText('.meeting-people button', 'Ekle'))
  await until(() => $('[role="dialog"]')?.textContent?.includes('Ada Örnek'), 'adaylar')
  expect($('[role="dialog"]')?.textContent).not.toContain('Başka Program')
  expect($('[role="dialog"]')?.textContent).not.toContain('Yalnız koordine ettiğin')
  expect($('[role="dialog"]')?.textContent).toContain('Liste eksik olabilir')
  expect(backend.sent('GET', '/v1/admin/users').at(-1)?.query.get('program_id')).toBe('p1')
})
