import { http, HttpResponse } from 'msw'
import { fakeOrg } from './fake-org'
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

it.each([
  { person: PEOPLE.admin, lens: 'admin' as const, role: 'admin', manage: true, deleted: true },
  {
    person: PEOPLE.coord,
    lens: 'coordinator' as const,
    role: 'coordinator',
    manage: true,
    deleted: false,
  },
  { person: PEOPLE.member, lens: 'member' as const, role: 'member', manage: false, deleted: false },
])(
  '$role gerçek liste ve detay eylemlerini yetkiye göre gösterir',
  async ({ person, lens, role, manage, deleted }) => {
    const note = {
      note_id: 'n1',
      meeting_id: 'm1',
      author_account_id: person.account_id,
      author_name: person.full_name,
      author_role: role,
      content: 'Rol notu',
      converted_to_work_item_id: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      edit_revision: 1,
    }
    const agenda = [
      {
        agenda_item_id: 'a1',
        meeting_id: 'm1',
        title: 'Madde',
        is_checked: false,
        checked_by_account_id: null,
        checked_at: null,
      },
    ]
    const participants = [{ account_id: person.account_id, full_name: person.full_name, teams: [] }]
    const detail = {
      ...meeting,
      viewer_role: role,
      participants,
      agenda,
      notes: { items: [note], next_cursor: '' },
    }
    backend.server.use(
      http.get('http://localhost/v1/meetings/m1', () => HttpResponse.json(detail)),
      http.get('http://localhost/v1/meetings/m1/notes', () => HttpResponse.json(detail.notes)),
    )
    const app = await boot({
      email: person.email,
      scope: { programId: 'p1', lens, ...(lens === 'admin' ? {} : { departmentId: 'd1' }) },
      path: '/toplantilar',
    })
    await until(() => $('.meetings-page'), 'liste')
    expect(!!byText('.meetings-page button', 'Yeni toplantı')).toBe(manage)
    expect(!!byText('.meetings-page button', 'Silinenler')).toBe(deleted)
    await app.router.push('/toplantilar/m1?notlar=benim')
    const checkbox = await until(
      () => $('.meeting-agenda input[aria-label="Madde"]') as HTMLInputElement | null,
    )
    expect(checkbox.disabled).toBe(!manage)
    expect(!!byText('.meeting-notes button', 'Göreve dönüştür')).toBe(manage)
    expect(!!$('.meeting-person-row__remove')).toBe(manage)
    expect($('.meeting-notes')?.textContent).toContain('Rol notu')
    expect(app.router.currentRoute.value.query.notlar).toBe('benim')
    expect(document.body.textContent).not.toMatch(/LiveKit|Konferansı bitir/)
    expect(
      backend.requests.filter((request) => /conference|video/i.test(request.path)),
    ).toHaveLength(0)
  },
)

it.each(['coordinatorship', 'person'] as const)(
  'katılımcı üye %s kipinde gerçek detayı görür, yönetemez',
  async (inviteMode) => {
    const participants = [
      { account_id: PEOPLE.member.account_id, full_name: PEOPLE.member.full_name, teams: [] },
    ]
    backend.server.use(
      http.get('http://localhost/v1/meetings/m1', () =>
        HttpResponse.json({
          ...meeting,
          invite_mode: inviteMode,
          members_included: false,
          viewer_role: 'member',
          participants,
        }),
      ),
    )
    await boot({
      email: PEOPLE.member.email,
      scope: { programId: 'p1', lens: 'member', departmentId: 'd1' },
      path: '/toplantilar/m1',
    })
    await until(() => $('.meeting-person-row'), 'katılımcı')
    expect($('.meeting-person-row')?.textContent).toContain(PEOPLE.member.full_name)
    expect(byText('.meeting-detail button', 'Düzenle')).toBeNull()
    expect(byText('.meeting-people button', 'Ekle')).toBeNull()
    expect($('.meeting-person-row__remove')).toBeNull()
  },
)

it.each([
  { person: PEOPLE.admin, lens: 'admin' as const, ids: ['m1', 'm2', 'm3'] },
  { person: PEOPLE.coord, lens: 'coordinator' as const, ids: ['m1', 'm2'] },
  { person: PEOPLE.member, lens: 'member' as const, ids: ['m1'] },
])(
  '$lens listesi sunucunun izin verdiği toplantı kümesini gösterir',
  async ({ person, lens, ids }) => {
    backend.server.use(
      http.get('http://localhost/v1/meetings', ({ request }) => {
        const account = fakeOrg.actorOf(backend.db, request)?.account_id
        const visible =
          account === PEOPLE.admin.account_id
            ? ['m1', 'm2', 'm3']
            : account === PEOPLE.coord.account_id
              ? ['m1', 'm2']
              : ['m1']
        return HttpResponse.json({
          items: visible.map((id) => ({ ...meeting, meeting_id: id, title: `Toplantı ${id}` })),
          next_cursor: '',
        })
      }),
    )
    await boot({
      email: person.email,
      scope: { programId: 'p1', lens, ...(lens === 'admin' ? {} : { departmentId: 'd1' }) },
      path: '/toplantilar?zaman=gecmis',
    })
    await until(
      () => document.querySelectorAll('.meeting-row').length === ids.length,
      'görünür liste',
    )
    expect(
      [...document.querySelectorAll<HTMLAnchorElement>('.meeting-row')].map(
        (row) => row.getAttribute('href')?.split('?')[0],
      ),
    ).toEqual(ids.map((id) => `/toplantilar/${id}`))
    const read = backend.sent('GET', '/v1/meetings').at(-1)!
    expect(read.account).toBe(person.account_id)
    expect(read.headers.get('X-Nizamio-Program')).toBe('p1')
  },
)
