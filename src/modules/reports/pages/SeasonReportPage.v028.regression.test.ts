import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'

import { mountWith, unmountAll } from '../__tests__/mount'
import { seasonFixture } from '../__tests__/fixtures'
import { http, json, ORIGIN, resetHarness, sent, server, standing } from '../__tests__/harness'
import { reportGate } from '../model/gate'
import SeasonReportPage from './SeasonReportPage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  reportGate.reset()
  resetHarness()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

async function open(body: ReturnType<typeof seasonFixture>) {
  server.use(
    ...standing({ admin: true }),
    http.get(`${ORIGIN}/v1/program/departments`, () =>
      json({
        departments: [
          { department_id: 'd1', display_name: 'Altyapı ve tesisat', code: 'ALT' },
          { department_id: 'd2', display_name: 'Operasyon' },
        ],
      }),
    ),
    http.get(`${ORIGIN}/v1/reports/season`, () => json(body)),
  )
  const page = await mountWith(SeasonReportPage)
  await vi.waitFor(() =>
    expect(page.wrapper.find('[data-testid="season-stage"]').exists()).toBe(true),
  )
  return page.wrapper
}

it('programın beyan ettiği dönem ve konum kapakta doğru anlamla görünür', async () => {
  const wrapper = await open(
    seasonFixture({
      program_location: 'İstanbul',
      period: { start_on: '2026-03-01', end_on: '2026-12-31', source: 'program' },
    }),
  )
  expect(sent('GET', '/v1/reports/season')[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
  const cover = wrapper.get('#report-season-cover')
  expect(cover.text()).toContain('01.03.2026 – 31.12.2026')
  const note = cover.get('[data-testid="cover-period-note"]').text()
  expect(note).toMatch(/program/i)
  expect(note).not.toContain('görevlerin en erken')
  expect(cover.text()).toContain('İstanbul')
})

it('görev notundaki acil ve paylaşılan işaretleri içeriğin yanında gösterilir', async () => {
  const original = seasonFixture()
  const first = original.tasks[0]!
  const detail = first.detail!
  const wrapper = await open(
    seasonFixture({
      tasks: [
        {
          ...first,
          detail: {
            ...detail,
            recent_notes: [{ ...detail.recent_notes[0]!, flag: 'urgent', shared: true }],
          },
        },
        ...original.tasks.slice(1),
      ],
    }),
  )
  const body = wrapper
    .get('[data-testid="dept-details"] [data-detail="w1"] [data-testid="detail-note"]')
    .text()
  expect(body).toContain('Kesişim çıktı; kazı durdu.')
  const labels = body.toLocaleLowerCase('tr-TR')
  expect(labels).toContain('acil')
  expect(labels).toContain('paylaşılan')
})
