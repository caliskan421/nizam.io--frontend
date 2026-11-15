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
const candidate = (id: string, name: string, participant = false) => ({
  account_id: id,
  full_name: name,
  is_participant: participant,
  teams: [],
})
function handlers() {
  backend.server.use(
    http.get('http://localhost/v1/meetings/participant-candidates', () =>
      HttpResponse.json({
        items: [
          candidate('x', 'Ada Örnek'),
          candidate('y', 'Bora Örnek'),
          candidate('z', 'Cem Örnek'),
        ],
        next_cursor: '',
      }),
    ),
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
  const [first, second] = backend.sent('POST', '/v1/meetings/m1/participants')
  expect(first?.headers.get('Idempotency-Key')).toMatch(/^[A-Za-z0-9_-]{22}$/)
  expect(second?.headers.get('Idempotency-Key')).not.toBe(first?.headers.get('Idempotency-Key'))
  // Belirsiz kişi için aynı anahtarla yeniden gönder sunulur; ekleme düğmesi sonuç çözülene dek kilitli.
  expect($('.meeting-people [data-testid="outcome-retry"]')).not.toBeNull()
  expect(byText('.meeting-people button', 'Ekle')?.hasAttribute('disabled')).toBe(true)
  await click('.meeting-people [data-testid="outcome-retry"]')
  await until(() => backend.sent('POST', '/v1/meetings/m1/participants').length === 3, 'tekrar')
  expect(
    backend.sent('POST', '/v1/meetings/m1/participants')[2]?.headers.get('Idempotency-Key'),
  ).toBe(second?.headers.get('Idempotency-Key'))
})

it('seçici adayları tek uçtan okur: meeting_id gider, kadro/kullanıcı taraması yok', async () => {
  await boot({
    email: PEOPLE.coord.email,
    scope: { programId: 'p1', lens: 'coordinator', departmentId: 'd1' },
    path: '/toplantilar/m1',
  })
  await click(() => byText('.meeting-people button', 'Ekle'))
  await until(() => $('[role="dialog"]')?.textContent?.includes('Ada Örnek'), 'adaylar')
  expect($('[role="dialog"]')?.textContent).not.toContain('Yalnız koordine ettiğin')
  expect($('[role="dialog"]')?.textContent).not.toContain('Liste eksik olabilir')
  expect(
    backend.sent('GET', '/v1/meetings/participant-candidates').at(-1)?.query.get('meeting_id'),
  ).toBe('m1')
  expect(backend.sent('GET', '/v1/departments/d1/members')).toHaveLength(0)
  expect(backend.sent('GET', '/v1/admin/users')).toHaveLength(0)
})

it('ŞY adayları da aynı uçtan gelir; sayfa boşken imleç sürer', async () => {
  let calls = 0
  backend.server.use(
    http.get('http://localhost/v1/meetings/participant-candidates', () => {
      calls++
      return calls === 1
        ? HttpResponse.json({ items: [], next_cursor: 'c1' })
        : HttpResponse.json({ items: [candidate('x', 'Ada Örnek')], next_cursor: '' })
    }),
  )
  await boot({
    email: PEOPLE.admin.email,
    scope: { programId: 'p1', lens: 'admin' },
    path: '/toplantilar/m1',
  })
  await click(() => byText('.meeting-people button', 'Ekle'))
  await until(() => $('[role="dialog"]')?.textContent?.includes('Ada Örnek'), 'adaylar')
  expect(backend.sent('GET', '/v1/meetings/participant-candidates')).toHaveLength(2)
  expect(backend.sent('GET', '/v1/admin/users')).toHaveLength(0)
})

it('üye adayları okuyamaz: 403 hata durumu gösterilir', async () => {
  backend.server.use(
    http.get('http://localhost/v1/meetings/participant-candidates', () =>
      HttpResponse.json(
        { code: 'collaboration.not_authorized', message: 'secret', request_id: 'r', fields: [] },
        { status: 403 },
      ),
    ),
  )
  await boot({
    email: PEOPLE.coord.email,
    scope: { programId: 'p1', lens: 'coordinator', departmentId: 'd1' },
    path: '/toplantilar/m1',
  })
  await click(() => byText('.meeting-people button', 'Ekle'))
  await until(() => $('[role="dialog"]')?.textContent?.includes('Kişiler yüklenemedi'), 'hata')
  expect(document.body.textContent).not.toContain('secret')
})

it('seçici filtrede seçimi korur, kilitli katılımcıyı saymaz ve arama Enter göndermez', async () => {
  const participants = [{ account_id: 'x', full_name: 'Ada Örnek', teams: [] }]
  backend.server.use(
    http.get('http://localhost/v1/meetings/m1', () =>
      HttpResponse.json({ ...meeting, participants }),
    ),
    http.get('http://localhost/v1/meetings/participant-candidates', () =>
      HttpResponse.json({
        items: [candidate('x', 'Ada Örnek', true), candidate('y', 'Bora Örnek')],
        next_cursor: '',
      }),
    ),
  )
  await boot({
    email: PEOPLE.coord.email,
    scope: { programId: 'p1', lens: 'coordinator', departmentId: 'd1' },
    path: '/toplantilar/m1',
  })
  await click(() => byText('.meeting-people button', 'Ekle'))
  await until(() => document.querySelectorAll('.meeting-selector-row').length === 2, 'iki aday')
  const rows = [...document.querySelectorAll<HTMLElement>('.meeting-selector-row')]
  expect((rows[0]!.querySelector('input') as HTMLInputElement).disabled).toBe(true)
  ;(rows[1]!.querySelector('input') as HTMLInputElement).click()
  await until(() => $('[role="dialog"]')?.textContent?.includes('1 seçili'), 'seçim sayısı')
  await fill('[role="dialog"] input[type="search"]', 'Ada')
  const search = $('[role="dialog"] input[type="search"]')!
  search.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
  )
  expect(backend.sent('POST', '/v1/meetings/m1/participants')).toHaveLength(0)
  await fill('[role="dialog"] input[type="search"]', '')
  const bora = [...document.querySelectorAll<HTMLElement>('.meeting-selector-row')].find((row) =>
    row.textContent?.includes('Bora'),
  )!
  expect((bora.querySelector('input') as HTMLInputElement).checked).toBe(true)
  expect($('[role="dialog"]')?.textContent).toContain('1 seçili')
})
