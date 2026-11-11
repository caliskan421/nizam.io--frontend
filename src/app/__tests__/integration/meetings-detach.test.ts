import { QueryObserver } from '@tanstack/vue-query'
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
  siblingSays,
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

it('sökülen detayın geç gündem hatası yeni ekranda bildirim üretmez', async () => {
  let release!: () => void
  let arrived!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const reached = new Promise<void>((resolve) => {
    arrived = resolve
  })
  backend.server.use(
    http.post('http://localhost/v1/meetings/m1/agenda', async () => {
      arrived()
      await gate
      return HttpResponse.json(
        { code: 'collaboration.input_invalid', message: 'secret', fields: [] },
        { status: 422 },
      )
    }),
  )
  const app = await boot({
    email: PEOPLE.admin.email,
    scope: { programId: 'p1', lens: 'admin' },
    path: '/toplantilar/m1',
  })
  const input = await until(() => $('.meeting-agenda form input') as HTMLInputElement | null)
  input.value = 'Geç madde'
  input.dispatchEvent(new Event('input', { bubbles: true }))
  $('.meeting-agenda form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await reached
  await app.router.push('/gorevler')
  await until(() => !$(' .meeting-detail'), 'detay söküldü')
  const before = document.querySelectorAll('.rp-toast').length
  release()
  await backend.settled()
  expect(document.querySelectorAll('.rp-toast')).toHaveLength(before)
  expect(document.body.textContent).not.toContain('secret')
  expect(backend.sent('POST', '/v1/meetings/m1/agenda')).toHaveLength(1)
})

it('kardeş çıkışı ve başka hesap girişinde geç toplantı okuması yeni önbelleğe yazılmaz', async () => {
  let release!: () => void
  let arrived!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const reached = new Promise<void>((resolve) => {
    arrived = resolve
  })
  backend.server.use(
    http.get('http://localhost/v1/meetings/m1', async () => {
      arrived()
      await gate
      return HttpResponse.json(meeting)
    }),
  )
  const app = await boot({
    email: PEOPLE.admin.email,
    scope: { programId: 'p1', lens: 'admin' },
    path: '/toplantilar/m1',
    siblingChannel: true,
  })
  await reached
  const stale = app.queryClient
    .getQueryCache()
    .getAll()
    .find((q) => String(q.queryKey).includes('meetings,detail,m1'))!
  const keeper = new QueryObserver(app.queryClient, {
    queryKey: stale.queryKey,
    queryFn: stale.options.queryFn,
    retry: false,
  })
  const unsubscribe = keeper.subscribe(() => undefined)
  const { SESSION_MESSAGE_VERSION } = await import('@/shared/session/messages')
  siblingSays({ v: SESSION_MESSAGE_VERSION, type: 'logout', accountId: PEOPLE.admin.account_id })
  await until(() => $('[data-testid="login-form"]'), 'çıkış')
  await fill('[data-testid="login-form"] [name="email"]', PEOPLE.member.email)
  await fill('[data-testid="login-form"] [name="password"]', 'dogru-parola')
  await click(() => byText('[data-testid="login-form"] button', 'Giriş'))
  await until(() => app.session.accountId === PEOPLE.member.account_id, 'yeni hesap')
  release()
  await backend.settled()
  unsubscribe()
  expect(app.queryClient.getQueryData(stale.queryKey)).toBeUndefined()
  expect(document.body.textContent).not.toContain('Entegrasyon toplantısı')
})
