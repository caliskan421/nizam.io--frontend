import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest'
import { $, boot, click, createBackend, fill, PEOPLE, seedWorld, teardown, until } from './harness'

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

it.each([
  {
    person: PEOPLE.admin,
    lens: 'admin' as const,
    role: 'admin',
    edit: true,
    change: true,
    add: true,
  },
  {
    person: PEOPLE.coord,
    lens: 'coordinator' as const,
    role: 'coordinator',
    edit: true,
    change: false,
    add: true,
  },
  {
    person: PEOPLE.member,
    lens: 'member' as const,
    role: 'member',
    edit: false,
    change: false,
    add: false,
  },
])('gerçek detay rol görünürlüğü: $role', async ({ person, lens, role, edit, change, add }) => {
  backend.server.use(
    http.get('http://localhost/v1/meetings/m1', () =>
      HttpResponse.json({ ...meeting, viewer_role: role }),
    ),
  )
  await boot({
    email: person.email,
    scope: { programId: 'p1', lens, ...(lens === 'admin' ? {} : { departmentId: 'd1' }) },
    path: '/toplantilar/m1',
  })
  await until(() => $('.meeting-people'), 'katılımcı kartı')
  const buttons = [...document.querySelectorAll('button')].map((b) => b.textContent?.trim())
  expect(buttons.includes('Düzenle')).toBe(edit)
  expect(buttons.includes('Değiştir')).toBe(change)
  expect(buttons.includes('Ekle')).toBe(add)
})

it.each([
  {
    label: 'sahip koordinatör olan oluşturan',
    person: PEOPLE.coord,
    mode: 'person',
    owner: 'd1',
    creator: PEOPLE.coord.account_id,
    canAdd: true,
  },
  {
    label: 'sahip koordinatörlüğünü kaybetmiş oluşturan',
    person: PEOPLE.coord,
    mode: 'person',
    owner: 'd2',
    creator: PEOPLE.coord.account_id,
    canAdd: false,
  },
  {
    label: 'person yöneticisi',
    person: PEOPLE.admin,
    mode: 'person',
    owner: 'd2',
    creator: PEOPLE.coord.account_id,
    canAdd: true,
  },
  {
    label: 'bağlı olmayan yönetici',
    person: PEOPLE.admin,
    mode: 'coordinatorship',
    owner: 'd2',
    creator: PEOPLE.coord.account_id,
    canAdd: false,
  },
])('$label katılımcı yönetimi', async ({ person, mode, owner, creator, canAdd }) => {
  backend.server.use(
    http.get('http://localhost/v1/meetings/m1', () =>
      HttpResponse.json({
        ...meeting,
        invite_mode: mode,
        owner_department_id: owner,
        departments: [{ department_id: owner, department_name: 'Ekip' }],
        created_by_account_id: creator,
      }),
    ),
  )
  const admin = person === PEOPLE.admin
  await boot({
    email: person.email,
    scope: {
      programId: 'p1',
      lens: admin ? 'admin' : 'coordinator',
      ...(admin ? {} : { departmentId: 'd1' }),
    },
    path: '/toplantilar/m1',
  })
  await until(() => $('.meeting-people'), 'katılımcı kartı')
  expect(
    [...document.querySelectorAll('.meeting-people button')].some(
      (b) => b.textContent?.trim() === 'Ekle',
    ),
  ).toBe(canAdd)
  if (mode === 'person')
    expect(
      [...document.querySelectorAll('button')].some((b) => b.textContent?.trim() === 'Değiştir'),
    ).toBe(false)
})

it('gerçek kişi seçicisi Escape ile kapanır ve odağı Ekle düğmesine döndürür', async () => {
  await boot({
    email: PEOPLE.coord.email,
    scope: { programId: 'p1', lens: 'coordinator', departmentId: 'd1' },
    path: '/toplantilar/m1',
  })
  const trigger = await click(
    () =>
      [...document.querySelectorAll<HTMLElement>('.meeting-people button')].find(
        (b) => b.textContent?.trim() === 'Ekle',
      ) ?? null,
  )
  const search = await until(() => $('[role="dialog"] input[type="search"]'), 'özel kişi seçici')
  expect(document.activeElement).toBe(search)
  search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await until(() => !$('[role="dialog"]'), 'seçici kapandı')
  await until(() => document.activeElement === trigger, 'odak dönüşü')
})

it('eski tarihli toplantının yalnız başlığı gerçek formdan güncellenir', async () => {
  backend.server.use(
    http.patch('http://localhost/v1/meetings/m1', () =>
      HttpResponse.json({
        meeting: { ...meeting, title: 'Yeni başlık' },
        side_effects: { event_failed: false, failed_messages: 0 },
      }),
    ),
  )
  await boot({
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
  await fill('#meeting-form input:not([type])', 'Yeni başlık')
  const date = await until(() => $('#meeting-form input[type="date"]') as HTMLInputElement | null)
  expect(date.min).toBe('')
  await click('button[form="meeting-form"]')
  await until(() => backend.sent('PATCH', '/v1/meetings/m1').length > 0, 'güncelleme isteği')
  await until(() => backend.sent('PATCH', '/v1/meetings/m1')[0]?.body, 'istek gövdesi')
  expect(backend.sent('PATCH', '/v1/meetings/m1')[0]?.body).toEqual({ title: 'Yeni başlık' })
})
