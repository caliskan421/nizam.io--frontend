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

const row = (id: string, date: string) => ({
  meeting_id: id,
  program_id: 'p1',
  title: `Toplantı ${id}`,
  meeting_date: date,
  created_at: '2020-11-10T10:00:00Z',
  updated_at: '2020-11-10T10:00:00Z',
  created_by_account_id: PEOPLE.coord.account_id,
  created_by_full_name: null,
  created_by_role: 'coordinator',
  invite_mode: 'coordinatorship',
  owner_department_id: 'd1',
  departments: [
    { department_id: 'd1', department_name: 'Mekanik', department_code: 'MEK', deleted: false },
  ],
  members_included: true,
  place: null,
})

function tabbedBackend(deleted: number | null) {
  backend.server.use(
    http.get('http://localhost/v1/meetings', ({ request }) => {
      const when = new URL(request.url).searchParams.get('when')
      return HttpResponse.json({
        items:
          when === 'past'
            ? [row('old', '2020-01-01T10:00:00Z')]
            : [row('soon', '2099-01-01T10:00:00Z')],
        next_cursor: '',
        total: when === 'past' ? 21 : 3,
        tab_counts: { upcoming: 3, past: 21, deleted },
      })
    }),
  )
}

it('BE-021: ŞY sekme sayaçları sunucudan kesindir; sekme geçişi when ile yeniden okur, "yükle-böl" yolu yoktur', async () => {
  tabbedBackend(5)
  await boot({ ...admin, path })
  await until(() => $('#meeting-tab-gecmis')?.textContent?.includes('21'), 'sayaçlar')
  expect($('#meeting-tab-yaklasan')?.textContent).toContain('3')
  expect($('#meeting-tab-silinenler')?.textContent).toContain('5')
  expect($('.meetings-page')?.textContent).not.toContain('+')
  expect($('.meetings-page')?.textContent).not.toContain('yüklenen kayıtlar içinde')
  expect($('.meetings-foot')?.textContent).toContain('3 yaklaşan toplantı')
  expect($('.meetings-groups')?.textContent).toContain('Toplantı soon')
  ;($('#meeting-tab-gecmis') as HTMLElement).click()
  await until(() => $('.meetings-groups')?.textContent?.includes('Toplantı old'), 'geçmiş sekmesi')
  expect($('.meetings-foot')?.textContent).toContain('21 geçmiş toplantı')
  const whens = backend.sent('GET', '/v1/meetings').map((r) => r.query.get('when'))
  expect(whens).toContain('upcoming')
  expect(whens).toContain('past')
  expect(backend.sent('GET', '/v1/meetings').every((r) => !r.query.has('cursor'))).toBe(true)
})

it.each([
  [
    'koordinatör',
    PEOPLE.coord.email,
    { programId: 'p1', lens: 'coordinator' as const, departmentId: 'd1' },
  ],
  ['üye', PEOPLE.member.email, { programId: 'p1', lens: 'member' as const, departmentId: 'd1' }],
])(
  "BE-021: %s için deleted sayacı null → Silinenler sekmesi DOM'da yoktur",
  async (_name, email, scope) => {
    tabbedBackend(null)
    await boot({ email, scope, path })
    await until(() => $('#meeting-tab-gecmis')?.textContent?.includes('21'), 'sayaçlar')
    expect($('#meeting-tab-silinenler')).toBeNull()
    expect(backend.sent('GET', '/v1/meetings/deleted')).toHaveLength(0)
  },
)
