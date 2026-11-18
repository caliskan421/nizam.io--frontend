import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'

import { mountWith, unmountAll } from '../__tests__/mount'
import { seasonFixture, seasonTask } from '../__tests__/fixtures'
import { http, json, ORIGIN, resetHarness, server, standing } from '../__tests__/harness'
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

const noteOf = (flag: 'urgent' | 'blocker' | 'question' | 'info' | null, shared: boolean) => {
  const first = seasonFixture().tasks[0]!
  const detail = first.detail!
  return seasonFixture({
    tasks: [
      {
        ...first,
        detail: {
          ...detail,
          recent_notes: [{ ...detail.recent_notes[0]!, flag, shared }],
        },
      },
    ],
  })
}
const noteBlock = (wrapper: Awaited<ReturnType<typeof open>>) =>
  wrapper.get('[data-testid="dept-details"] [data-detail="w1"] [data-testid="detail-note"]')

it.each([
  ['urgent', 'ACİL'],
  ['blocker', 'ENGEL'],
  ['question', 'SORU'],
  ['info', 'BİLGİ'],
] as const)('not bayrağı %s içeriğin yanında %s rozetidir; paylaşılan yok', async (flag, label) => {
  const note = noteBlock(await open(noteOf(flag, false)))
  const flags = note.get('[data-testid="note-flags"]')
  expect(flags.text()).toBe(label)
  expect(note.text()).toContain('Kesişim çıktı; kazı durdu.')
  expect(note.text()).not.toContain('PAYLAŞILAN')
})

it('paylaşılan yalnız etiket: bayraksız notta tek rozet, görünürlük iddiası yok', async () => {
  const note = noteBlock(await open(noteOf(null, true)))
  expect(note.get('[data-testid="note-flags"]').text()).toBe('PAYLAŞILAN')
  expect(note.text()).not.toMatch(/herkes|görünür|bildirim/i)
})

it('bayrak ve paylaşılan birlikte iki rozet', async () => {
  const note = noteBlock(await open(noteOf('blocker', true)))
  expect(note.findAll('[data-testid="note-flags"] .report-pill').map((el) => el.text())).toEqual([
    'ENGEL',
    'PAYLAŞILAN',
  ])
})

it('bayraksız ve paylaşılmamış notta rozet satırı/ayraç çizilmez', async () => {
  const note = noteBlock(await open(noteOf(null, false)))
  expect(note.find('[data-testid="note-flags"]').exists()).toBe(false)
  expect(note.find('.report-pill').exists()).toBe(false)
})

it('sunucu notu metin olarak çizilir (HTML yorumlanmaz)', async () => {
  const first = seasonFixture().tasks[0]!
  const detail = first.detail!
  const wrapper = await open(
    seasonFixture({
      tasks: [
        {
          ...first,
          detail: {
            ...detail,
            recent_notes: [{ ...detail.recent_notes[0]!, content: '<b id="x">kalın</b>' }],
          },
        },
      ],
    }),
  )
  const note = noteBlock(wrapper)
  expect(note.text()).toContain('<b id="x">kalın</b>')
  expect(note.find('#x').exists()).toBe(false)
})

it.each([
  ['tasks', /görevlerin en erken/],
  ['program', /programın beyan ettiği dönem tarihleri/],
  ['range', /seçilen tarih aralığı/],
  ['gelecekte-yeni', /görevlerin en erken/],
] as const)('dönem dipnotu period.source=%s anlamına uyar', async (source, expected) => {
  const wrapper = await open(
    seasonFixture({
      period: { start_on: '2026-03-01', end_on: '2026-12-31', source: source as 'tasks' },
    }),
  )
  const note = wrapper.get('#report-season-cover [data-testid="cover-period-note"]').text()
  expect(note).toMatch(expected)
  if (source === 'program' || source === 'range') expect(note).not.toContain('görevlerin en erken')
})

it('period null ise aralık ve dipnot çizilmez', async () => {
  const wrapper = await open(seasonFixture({ period: null }))
  expect(wrapper.find('[data-testid="cover-period-note"]').exists()).toBe(false)
})

it('kapak başlığı yıl · konum: boş/boşluk konum ve null yıl çift ayraç üretmez', async () => {
  const cover = async (over: Parameters<typeof seasonFixture>[0]) =>
    (await open(seasonFixture(over))).get('#report-season-cover .report-band__sub').text()
  expect(await cover({ program_location: 'Şanlıurfa', program_year: 2026 })).toMatch(
    /· 2026 · Şanlıurfa$/,
  )
  unmountAll()
  expect(await cover({ program_location: '   ', program_year: 2026 })).toMatch(/· 2026$/)
  unmountAll()
  const noYear = await cover({ program_location: 'İstanbul', program_year: null })
  expect(noYear).toContain('İstanbul')
  expect(noYear).not.toMatch(/·\s*·/)
  unmountAll()
  expect(await cover({ program_location: null, program_year: 2026 })).not.toMatch(/·\s*$/)
})

it('çok uzun kesintisiz konum kırpılmadan kapak başlığında yer alır', async () => {
  const long = 'K'.repeat(200)
  const wrapper = await open(seasonFixture({ program_location: long }))
  expect(wrapper.get('#report-season-cover .report-band__sub').text()).toContain(long)
})

const dependent = () => [
  seasonTask({
    work_item_id: 'a',
    title: 'Temel',
    code: 'ALT-1',
    start_on: '2026-03-02',
    end_on: '2026-03-10',
  }),
  seasonTask({
    work_item_id: 'b',
    title: 'Duvar',
    code: 'ALT-2',
    start_on: '2026-03-16',
    end_on: '2026-03-20',
  }),
]

it('Gantt: sunucu kenarı ön görev → bağımlı ok ve metin eşi olarak çizilir', async () => {
  const wrapper = await open(
    seasonFixture({
      tasks: dependent(),
      gantt_edges: [
        { work_item_id: 'b', depends_on_id: 'a' },
        { work_item_id: 'b', depends_on_id: 'a' },
        { work_item_id: 'b', depends_on_id: 'yok' },
      ],
    }),
  )
  expect(wrapper.findAll('[data-testid="gantt-edge"]')).toHaveLength(1)
  const items = wrapper.findAll('[data-testid="gantt-edge-list"] li').map((li) => li.text())
  expect(items).toEqual(['ALT-1 Temel bitmeden ALT-2 Duvar ilerleyemez'])
  expect(wrapper.get('[data-testid="gantt-edges"]').attributes('aria-hidden')).toBe('true')
  expect(wrapper.get('[data-testid="gantt"]').text()).not.toMatch(/\bab\b|^[0-9a-f-]{36}$/)
})

it('Gantt: geçerli boş kenar listesi ok çizmez; ipucu "yalnız görünen" ve "PDF aynı sayfa" der', async () => {
  const wrapper = await open(seasonFixture({ tasks: dependent(), gantt_edges: [] }))
  expect(wrapper.find('[data-testid="gantt-edges"]').exists()).toBe(false)
  expect(wrapper.find('[data-testid="gantt-edge-list"]').exists()).toBe(false)
  const hint = wrapper.get('#report-season-gantt .report-fn').text()
  expect(hint).toMatch(/yalnız bu önizlemede görünen/)
  expect(hint).toMatch(/PDF yalnız aynı sayfadaki/)
  expect(hint).not.toMatch(/PDF.{0,3}te yoktur/)
  expect(wrapper.get('[data-testid="season-stage"]').text()).not.toMatch(/sade olabilir/)
})
