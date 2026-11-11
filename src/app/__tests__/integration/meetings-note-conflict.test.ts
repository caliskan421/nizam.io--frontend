import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest'
import {
  $,
  boot,
  click,
  createBackend,
  fill,
  idle,
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

it('gerçek not düzenleme çakışmasında taslak ve sunucu sürümü gösterilir', async () => {
  let conflicted = false
  const note = {
    note_id: 'n1',
    meeting_id: 'm1',
    author_account_id: PEOPLE.admin.account_id,
    author_name: PEOPLE.admin.full_name,
    author_role: 'admin',
    content: 'Taban',
    converted_to_work_item_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    edit_revision: 1,
  }
  backend.server.use(
    http.get('http://localhost/v1/meetings/m1', () =>
      HttpResponse.json({ ...meeting, notes: { items: [note], next_cursor: '' } }),
    ),
    http.get('http://localhost/v1/meetings/m1/notes', () =>
      HttpResponse.json({
        items: [conflicted ? { ...note, content: 'Sunucu sürümü', edit_revision: 2 } : note],
        next_cursor: '',
      }),
    ),
    http.patch('http://localhost/v1/meeting-notes/n1', () => {
      conflicted = true
      return HttpResponse.json(
        {
          code: 'collaboration.edit_conflict',
          message: 'secret',
          fields: [{ field: 'expected_revision', code: 'collaboration.edit_conflict' }],
        },
        { status: 409 },
      )
    }),
  )
  await boot({
    email: PEOPLE.admin.email,
    scope: { programId: 'p1', lens: 'admin' },
    path: '/toplantilar/m1',
  })
  await click('button[aria-label^="Not işlemleri"]')
  await click('[role="menuitem"]')
  await fill('textarea[aria-label="Not düzenle"]', 'Benim taslağım')
  const form = await until(() => $('textarea[aria-label="Not düzenle"]')?.closest('form'))
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await until(() => backend.sent('PATCH', '/v1/meeting-notes/n1').length > 0, 'patch')
  await until(() => backend.sent('GET', '/v1/meetings/m1/notes').length > 0, 'yeniden okuma')
  await until(() => $('[role=\"dialog\"]'), 'çakışma penceresi')
  expect(document.body.textContent).toContain('Benim taslağım')
  expect(document.body.textContent).not.toContain('secret')
  await click(
    () =>
      [...document.querySelectorAll<HTMLElement>('[role=\"dialog\"] button')].find(
        (b) => b.textContent?.trim() === 'Güncel değer',
      ) ?? null,
  )
  await click('[data-testid=\"conflict-submit\"]')
  await until(() => !$('[role=\"dialog\"]'), 'uzlaştırma tamamlandı')
  await until(
    () => $('.meeting-notes__item')?.textContent?.includes('Sunucu sürümü'),
    'sunucu sürümü görünür',
  )
  expect(backend.sent('PATCH', '/v1/meeting-notes/n1')).toHaveLength(1)
})

it('başkası dönüştürmüş notun 409 sonucunda gerçek pencere kapanır ve not yenilenir', async () => {
  const note = {
    note_id: 'n1',
    meeting_id: 'm1',
    author_account_id: PEOPLE.admin.account_id,
    author_name: PEOPLE.admin.full_name,
    author_role: 'admin',
    content: 'Dönüşecek not',
    converted_to_work_item_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    edit_revision: 1,
  }
  let converted = false
  const notes = () => ({
    items: [{ ...note, converted_to_work_item_id: converted ? 'w-new' : null }],
    next_cursor: '',
  })
  backend.server.use(
    http.get('http://localhost/v1/meetings/m1', () =>
      HttpResponse.json({ ...meeting, notes: notes() }),
    ),
    http.get('http://localhost/v1/meetings/m1/notes', () => HttpResponse.json(notes())),
    http.post('http://localhost/v1/meeting-notes/n1/convert-to-task', () => {
      converted = true
      return HttpResponse.json(
        { code: 'collaboration.note_converted', message: 'secret', fields: [] },
        { status: 409 },
      )
    }),
  )
  await boot({
    email: PEOPLE.admin.email,
    scope: { programId: 'p1', lens: 'admin' },
    path: '/toplantilar/m1',
  })
  await click(
    () =>
      [...document.querySelectorAll<HTMLElement>('.meeting-notes button')].find(
        (b) => b.textContent?.trim() === 'Göreve dönüştür',
      ) ?? null,
  )
  await fill('#meeting-convert-form select', 'd1')
  await fill('#meeting-convert-form input[type="date"]:nth-of-type(1)', '2099-12-30')
  const dates = document.querySelectorAll<HTMLInputElement>(
    '#meeting-convert-form input[type="date"]',
  )
  dates[1]!.value = '2099-12-31'
  dates[1]!.dispatchEvent(new Event('input', { bubbles: true }))
  const form = await until(() => $('#meeting-convert-form'))
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await until(() => $('.meeting-notes__converted'), 'not yenilendi')
  await until(() => !$('#meeting-convert-form'), 'pencere kapandı')
  expect(backend.sent('POST', '/v1/meeting-notes/n1/convert-to-task')).toHaveLength(1)
  expect(document.body.textContent).not.toContain('secret')
})

it('gerçek not menüsünden silme onayla yapılır ve not listeden kalkar', async () => {
  const note = {
    note_id: 'n1',
    meeting_id: 'm1',
    author_account_id: PEOPLE.admin.account_id,
    author_name: PEOPLE.admin.full_name,
    author_role: 'admin',
    content: 'Silinecek not',
    converted_to_work_item_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    edit_revision: 1,
  }
  let deleted = false
  const notes = () => ({ items: deleted ? [] : [note], next_cursor: '' })
  backend.server.use(
    http.get('http://localhost/v1/meetings/m1', () =>
      HttpResponse.json({ ...meeting, notes: notes() }),
    ),
    http.get('http://localhost/v1/meetings/m1/notes', () => HttpResponse.json(notes())),
    http.delete('http://localhost/v1/meeting-notes/n1', () => {
      deleted = true
      return new HttpResponse(null, { status: 204 })
    }),
  )
  const app = await boot({
    email: PEOPLE.admin.email,
    scope: { programId: 'p1', lens: 'admin' },
    path: '/toplantilar/m1',
  })
  await idle(app.queryClient)
  const trigger = await until(() => $('button[aria-label^="Not işlemleri"]'))
  trigger.focus()
  await click(() => trigger)
  await click(
    () =>
      [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
        (b) => b.textContent?.trim() === 'Sil',
      ) ?? null,
  )
  expect(backend.sent('DELETE', '/v1/meeting-notes/n1')).toHaveLength(0)
  await click(
    () =>
      [...document.querySelectorAll<HTMLElement>('[role="alertdialog"] button')].find(
        (b) => b.textContent?.trim() === 'Sil',
      ) ?? null,
  )
  await until(() => !$('.meeting-notes__item'), 'not silindi')
  expect(backend.sent('DELETE', '/v1/meeting-notes/n1')).toHaveLength(1)
  await until(() => !$('[role="alertdialog"]'), 'onay kapandı')
  await until(
    () => document.activeElement === $('[data-testid="meeting-notes-title"]'),
    'silme sonrası odak',
  )
})
