import { item } from './fake-org'
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
beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
  handlers()
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

it('nottan görev üretimi gerçek listeyi ve pano sayacını yeniler, rozet doğru kalır', async () => {
  const note = {
    note_id: 'n1',
    meeting_id: 'm1',
    author_account_id: PEOPLE.admin.account_id,
    author_name: PEOPLE.admin.full_name,
    author_role: 'admin',
    content: 'Yeni görev',
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
      backend.db.items.push(
        item('w-new', 'p1', 'd1', null, {
          title: 'Yeni görev',
          start_on: '2099-12-30',
          end_on: '2099-12-31',
        }),
      )
      return HttpResponse.json({})
    }),
  )
  const app = await boot({
    email: PEOPLE.admin.email,
    scope: { programId: 'p1', lens: 'admin' },
    path: '/',
  })
  await until(
    () => $('[data-kpi="open"] [data-kpi-value]')?.textContent?.trim() === '4',
    'pano önce',
  )
  const badge = $('aside a[href="/gorevler"]')?.textContent
  const reportReads = backend.sent('GET', '/v1/reports/dashboard').length
  await app.router.push('/gorevler')
  await until(
    () => document.querySelectorAll('[data-work-item]').length === 4,
    'görev listesi önce',
  )
  await app.router.push('/toplantilar/m1')
  await click(
    () =>
      [...document.querySelectorAll<HTMLElement>('.meeting-notes button')].find(
        (b) => b.textContent?.trim() === 'Göreve dönüştür',
      ) ?? null,
  )
  await fill('#meeting-convert-form select', 'd1')
  const dates = document.querySelectorAll<HTMLInputElement>(
    '#meeting-convert-form input[type="date"]',
  )
  dates[0]!.value = '2099-12-30'
  dates[0]!.dispatchEvent(new Event('input', { bubbles: true }))
  dates[1]!.value = '2099-12-31'
  dates[1]!.dispatchEvent(new Event('input', { bubbles: true }))
  $('#meeting-convert-form')!.dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  )
  await until(() => $('.meeting-notes__converted'), 'dönüşüm etiketi')
  await until(
    () => backend.sent('GET', '/v1/reports/dashboard').length > reportReads,
    'pano ve rozet yeniden okuma',
  )
  const { queryKeys } = await import('@/shared/http/query-keys')
  await until(
    () =>
      (
        app.queryClient.getQueryData(queryKeys.report.dashboard(app.scope.snapshot)) as
          { total_tasks?: number } | undefined
      )?.total_tasks === 5,
    'yeni pano yanıtı',
  )
  expect($('aside a[href="/gorevler"]')?.textContent).toBe(badge)
  await app.router.push('/gorevler')
  await until(() => $('[data-work-item="w-new"]'), 'yeni görev listede')
  await app.router.push('/')
  await until(
    () => $('[data-kpi="open"] [data-kpi-value]')?.textContent?.trim() === '5',
    'pano sonra',
  )
  expect(backend.sent('POST', '/v1/meeting-notes/n1/convert-to-task')).toHaveLength(1)
})
