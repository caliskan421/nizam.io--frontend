import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest'
import { boot, click, createBackend, fill, PEOPLE, seedWorld, teardown, until } from './harness'

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

it('bekleyen PATCH ikinci gönderimi ve başka notun düzenlenmesini engeller', async () => {
  const note = (id: string) => ({
    note_id: id,
    meeting_id: 'm1',
    author_account_id: PEOPLE.admin.account_id,
    author_name: PEOPLE.admin.full_name,
    author_role: 'admin',
    content: `Not ${id}`,
    converted_to_work_item_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    edit_revision: 1,
  })
  const notes = [note('n1'), note('n2')]
  let release!: () => void
  const deferred = new Promise<void>((resolve) => {
    release = resolve
  })
  backend.server.use(
    http.get('http://localhost/v1/meetings/m1/notes', () =>
      HttpResponse.json({ items: notes, next_cursor: '' }),
    ),
    http.patch('http://localhost/v1/meeting-notes/n1', async () => {
      await deferred
      return HttpResponse.json({ ...notes[0], content: 'Kaydedilen', edit_revision: 2 })
    }),
  )
  await boot({
    email: PEOPLE.admin.email,
    scope: { programId: 'p1', lens: 'admin' },
    path: '/toplantilar/m1',
  })
  const articles = await until(() =>
    document.querySelectorAll<HTMLElement>('.meeting-notes__item').length === 2
      ? document.querySelectorAll<HTMLElement>('.meeting-notes__item')
      : null,
  )
  await click(() => articles[0]!.querySelector('button[aria-label^="Not işlemleri"]'))
  await click('[role="menuitem"]')
  await fill('textarea[aria-label="Not düzenle"]', 'Kaydedilen')
  const editor = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Not düzenle"]')!
  const form = editor.closest('form')!
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await until(() => backend.sent('PATCH', '/v1/meeting-notes/n1').length === 1)
  expect(editor.disabled).toBe(true)
  expect(form.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true)
  expect(form.querySelector<HTMLButtonElement>('button[type="button"]')!.disabled).toBe(true)
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await click(() => articles[1]!.querySelector('button[aria-label^="Not işlemleri"]'))
  const editOther = [...document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')].find(
    (b) => b.textContent?.trim() === 'Düzenle',
  )!
  expect(editOther.disabled).toBe(true)
  expect(editor.value).toBe('Kaydedilen')
  expect(backend.sent('PATCH', '/v1/meeting-notes/n1')).toHaveLength(1)
  release()
  await until(() => !document.querySelector('textarea[aria-label="Not düzenle"]'))
  await click(() => editOther)
  await fill('textarea[aria-label="Not düzenle"]', 'Yeni taslak')
  expect(
    document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Not düzenle"]')!.value,
  ).toBe('Yeni taslak')
})
