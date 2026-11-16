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
  notes: { items: [], next_cursor: '', total: 0, counts: { all: 0, converted: 0, mine: 0 } },
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
      HttpResponse.json({
        items: [],
        next_cursor: '',
        total: 0,
        counts: { all: 0, converted: 0, mine: 0 },
      }),
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

// KESİN 32: tek test 5 sn sınırına dayanmasın diye üçe bölündü; her biri kurulumu (`convertSetup`)
// paylaşır, yalnız kendi iddiasını sınar.
async function convertSetup() {
  const note = {
    note_id: 'n1',
    meeting_id: 'm1',
    author_account_id: PEOPLE.admin.account_id,
    author_name: PEOPLE.admin.full_name,
    author_role: 'admin',
    content: 'Yeni görev',
    converted_to_work_item_id: null,
    converted_work_item_department_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    edit_revision: 1,
  }
  let converted = false
  const notes = () => ({
    items: [
      {
        ...note,
        converted_to_work_item_id: converted ? 'w-new' : null,
        converted_work_item_department_id: converted ? 'd1' : null,
      },
    ],
    next_cursor: '',
    total: 1,
    counts: { all: 1, converted: converted ? 1 : 0, mine: 1 },
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
  return boot({
    email: PEOPLE.admin.email,
    scope: { programId: 'p1', lens: 'admin' },
    path: '/',
  })
}

type App = Awaited<ReturnType<typeof convertSetup>>

async function convertNote(app: App) {
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
  await until(() => $('a.meeting-notes__converted'), 'dönüşüm etiketi bağlantı')
}

const kpiOpen = () => $('[data-kpi="open"] [data-kpi-value]')?.textContent?.trim()

it('nottan görev üretimi: dönüşüm etiketi görev bağlantısı, tek POST', async () => {
  const app = await convertSetup()
  await until(() => kpiOpen() === '4', 'pano önce')
  await convertNote(app)
  expect($('a.meeting-notes__converted')?.getAttribute('href')).toBe('/gorevler?gorev=w-new')
  expect(backend.sent('POST', '/v1/meeting-notes/n1/convert-to-task')).toHaveLength(1)
})

it('nottan görev üretimi pano sayacını yeniler, menü rozeti doğru kalır', async () => {
  const app = await convertSetup()
  await until(() => kpiOpen() === '4', 'pano önce')
  const badge = $('aside a[href="/gorevler"]')?.textContent
  const reportReads = backend.sent('GET', '/v1/reports/dashboard').length
  await convertNote(app)
  await until(
    () => backend.sent('GET', '/v1/reports/dashboard').length > reportReads,
    'pano ve rozet yeniden okuma',
  )
  const { queryKeys } = await import('@/shared/http/query-keys')
  await until(
    () =>
      app.queryClient.getQueryData<{ total_tasks?: number }>(
        queryKeys.report.dashboard(app.scope.snapshot),
      )?.total_tasks === 5,
    'yeni pano yanıtı',
  )
  expect($('aside a[href="/gorevler"]')?.textContent).toBe(badge)
  await app.router.push('/')
  await until(() => kpiOpen() === '5', 'pano sonra')
})

it('nottan görev üretimi gerçek görev listesini yeniler', async () => {
  const app = await convertSetup()
  await app.router.push('/gorevler')
  await until(
    () => document.querySelectorAll('[data-work-item]').length === 4,
    'görev listesi önce',
  )
  await convertNote(app)
  await app.router.push('/gorevler')
  await until(() => $('[data-work-item="w-new"]'), 'yeni görev listede')
})
