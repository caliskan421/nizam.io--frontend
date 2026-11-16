// W176 O3 senaryo 7 (BE-068): gündem ekleme — yanıt kaybolursa kör tekrar yok; kullanıcı "Yeniden
// gönder"le AYNI `Idempotency-Key` ile yollar, sunucu anahtarı bilir ve tek kayıt kalır. Aynı
// ekranda yeni madde (yeni eylem) YENİ anahtar taşır. Oluşturma (`createMeeting`) ve katılımcı
// (`addMeetingParticipant`) uçlarının aynı davranışı `meetings-lifecycle` / `meetings-people`'dadır.
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest'

import {
  $,
  $$,
  boot,
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
  meeting_date: '2099-11-11T10:00:00Z',
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

// Sunucu durumu: anahtar → oluşan kayıt (aynı anahtar aynı kaydı döndürür; BE-068).
let rows: Array<Record<string, unknown>> = []
const byKey = new Map<string, Record<string, unknown>>()
let loseNext = false

function install(): void {
  backend.server.use(
    http.get('http://localhost/v1/meetings/deleted', () =>
      HttpResponse.json({ items: [], next_cursor: '' }),
    ),
    http.get('http://localhost/v1/meetings', () =>
      HttpResponse.json({ items: [meeting], next_cursor: '' }),
    ),
    http.get('http://localhost/v1/meetings/m1', () =>
      HttpResponse.json({ ...meeting, agenda: rows }),
    ),
    http.get('http://localhost/v1/meetings/m1/notes', () =>
      HttpResponse.json({
        items: [],
        next_cursor: '',
        total: 0,
        counts: { all: 0, converted: 0, mine: 0 },
      }),
    ),
    http.post('http://localhost/v1/meetings/m1/agenda', async ({ request }) => {
      const key = request.headers.get('Idempotency-Key') ?? ''
      const { title } = (await request.json()) as { title: string }
      let row = byKey.get(key)
      if (!row) {
        row = {
          agenda_item_id: `a${rows.length + 1}`,
          meeting_id: 'm1',
          title,
          is_checked: false,
          checked_by_account_id: null,
          checked_at: null,
          created_at: '2026-01-01T00:00:00Z',
          sort_order: rows.length + 1,
        }
        byKey.set(key, row)
        rows = [...rows, row]
      }
      if (loseNext) {
        loseNext = false
        return HttpResponse.error()
      }
      return HttpResponse.json(row)
    }),
  )
}

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
  rows = []
  byKey.clear()
  loseNext = false
  install()
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const submit = async (title: string) => {
  await fill('.meeting-agenda form input', title)
  $('.meeting-agenda form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}
const items = (label: string) => $$(`.meeting-agenda input[aria-label="${label}"]`)

it('yanıt kaybolur: kör tekrar yok; "Yeniden gönder" aynı anahtar, tek kayıt; sonraki madde yeni anahtar', async () => {
  await boot({
    email: PEOPLE.admin.email,
    scope: { programId: 'p1', lens: 'admin' },
    path: '/toplantilar/m1',
  })
  await until(() => $('.meeting-agenda form input'), 'gündem formu')
  loseNext = true
  await submit('Karar')
  await until(() => $('[data-testid="outcome-retry"]'), 'yeniden gönder')
  // Kör tekrar yok: tek istek; taslak korunur, ikinci ekleme engelli.
  expect(backend.sent('POST', '/v1/meetings/m1/agenda')).toHaveLength(1)
  const key = backend.sent('POST', '/v1/meetings/m1/agenda')[0]!.headers.get('Idempotency-Key')
  expect(key).toMatch(/^[A-Za-z0-9_-]{22}$/)

  await click('[data-testid="outcome-retry"]')
  await until(() => backend.sent('POST', '/v1/meetings/m1/agenda').length === 2, 'tekrar')
  expect(backend.sent('POST', '/v1/meetings/m1/agenda')[1]!.headers.get('Idempotency-Key')).toBe(
    key,
  )
  await until(() => !$('[data-testid="outcome-retry"]'), 'bildirim kapandı')
  await until(() => document.body.textContent?.includes('Karar'), 'madde listede')
  expect(rows).toHaveLength(1) // sunucuda tek kayıt
  expect(items('Karar')).toHaveLength(1)

  // Yeni eylem → yeni anahtar → ikinci kayıt.
  await submit('Bütçe')
  await until(() => rows.length === 2, 'ikinci madde')
  const keys = backend
    .sent('POST', '/v1/meetings/m1/agenda')
    .map((r) => r.headers.get('Idempotency-Key'))
  expect(keys[2]).not.toBe(key)
})
