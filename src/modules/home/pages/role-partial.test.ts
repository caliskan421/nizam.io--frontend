import type { RequestHandler } from 'msw'
// CX-F6-E-03: Ü1/K1 program geneli yükleme kısmi kalınca (5 sayfa tavanı ya da sonraki sayfa
// hatası) hiçbir istemci türevi kesin toplam gibi gösterilmez; kesin sunucu özeti varsa o gösterilir;
// "ilk N görev" kapsam etiketi + devam/yeniden deneme yolu vardır. Gerçek istemci + msw.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import {
  COORD_SCOPE,
  COUNTS,
  http,
  json,
  LIST,
  MEMBER_SCOPE,
  ORIGIN,
  row,
  sent,
  server,
  standingHandlers,
} from '../__tests__/harness'
import {
  EMPTY_BY,
  mountRole,
  resetRole,
  roleHandlers,
  stubBrowserClone,
} from '../__tests__/role-harness'
import CoordinatorHomePage from './CoordinatorHomePage.vue'
import MemberHomePage from './MemberHomePage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => {
  stubBrowserClone()
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => {
  useConfirm().clear()
  useToast().clear()
  resetRole()
})
afterAll(() => server.close())

const MEMBER = { companyAdmin: false, rows: [{ department_id: 'd1', role: 'uye' }] }
const COORD = { companyAdmin: false, rows: [{ department_id: 'd1', role: 'koordinator' }] }

// Sunucu özeti: 35 açık (30 devam + 5 onayda), 7 geciken — yüklenen kümeden çok büyük.
const COUNTS_BODY = {
  total: 40,
  by_status: { ...EMPTY_BY, devam_ediyor: 30, onaya_sunuldu: 5, tamamlandi: 5 },
  overdue: 7,
  pending_date_requests: 0,
}
const FIRST = [row('devam_ediyor', { title: 'Sakin görev', end_on: '2099-01-10' })]
const URGENT = row('devam_ediyor', {
  title: 'Altıncı sayfadaki acil görev',
  priority: 'acil',
  end_on: '2020-01-01',
  is_overdue: true,
  days_overdue: 40,
})

type Page = Awaited<ReturnType<typeof mountRole>>
const region = (page: Page, name: string) => page.wrapper.get(`[data-region="${name}"]`)
const note = (page: Page, name: string) => region(page, name).find('[data-scope-note]')
// Özel uçlar önce (msw ilk eşleşeni kullanır); yardımcı okumalar (toplantı, ekip…) en sonda.
const mocks = (extra: RequestHandler[], over: Parameters<typeof roleHandlers>[0] = {}) => [
  http.get(`${ORIGIN}${COUNTS}`, () => json(COUNTS_BODY)),
  ...extra,
  ...roleHandlers(over),
]

describe('Ü1 kısmi küme (CX-F6-E-03)', () => {
  it('2. sayfa hatası: kuyruk "Tümü" kesin sunucu özeti; takvim/birimler "≥"; yeniden dene sürdürür', async () => {
    let fail = true
    server.use(
      ...mocks([
        ...standingHandlers(MEMBER),
        http.get(`${ORIGIN}${LIST}`, ({ request }) => {
          const cursor = new URL(request.url).searchParams.get('cursor')
          if (!cursor) return json({ items: FIRST, next_cursor: 'c2' })
          return fail
            ? json({ code: 'platform.internal', message: 'x', request_id: 'r', fields: [] }, 500)
            : json({ items: [URGENT], next_cursor: '' })
        }),
      ]),
    )
    const page = await mountRole(MemberHomePage, MEMBER_SCOPE)
    await vi.waitFor(() => expect(note(page, 'queue').attributes('data-scope')).toBe('failed'))
    expect(note(page, 'queue').text()).toContain('İlk 1 görev yüklendi')
    // Kesin sunucu özeti (35); türev (1) kesin gösterilmez.
    expect(region(page, 'queue').get('[data-testid="u1-queue-all"]').text()).toContain('35')
    expect(region(page, 'queue').get('[data-testid="u1-queue-sub"]').text()).toContain('35 açık')
    expect(page.wrapper.get('[data-testid="u1-cal-legend"]').text()).toContain('Geciken (≥0)')
    expect(page.wrapper.get('[data-testid="u1-cal-legend"]').text()).toContain('Yaklaşan (≥1)')
    expect(note(page, 'calendar').text()).toBe('İlk 1 görev içinde')
    expect(region(page, 'units').text()).toContain('≥1 görev')
    expect(note(page, 'units').exists()).toBe(true)

    fail = false
    await note(page, 'queue').get('[data-action="scope-more"]').trigger('click')
    await vi.waitFor(() => expect(note(page, 'queue').exists()).toBe(false))
    expect(page.wrapper.get('[data-testid="u1-cal-legend"]').text()).toContain('Geciken (1)')
    expect(note(page, 'calendar').exists()).toBe(false)
    expect(region(page, 'units').text()).not.toContain('≥')
    expect(region(page, 'queue').find('.rh-title').text()).toBe('Altıncı sayfadaki acil görev')
  })

  it('5 sayfa tavanı: "ilk N görev" etiketi + "Devam et"; 6. sayfadaki acil görev gelince etiket kalkar', async () => {
    server.use(
      ...mocks([
        ...standingHandlers(MEMBER),
        http.get(`${ORIGIN}${LIST}`, ({ request }) => {
          const cursor = new URL(request.url).searchParams.get('cursor')
          const n = cursor ? Number(cursor.slice(1)) : 1
          return n >= 6
            ? json({ items: [URGENT], next_cursor: '' })
            : json({
                items: [row('devam_ediyor', { end_on: '2099-01-10' })],
                next_cursor: `c${n + 1}`,
              })
        }),
      ]),
    )
    const page = await mountRole(MemberHomePage, MEMBER_SCOPE)
    await vi.waitFor(() => expect(note(page, 'queue').attributes('data-scope')).toBe('capped'))
    expect(sent(LIST)).toHaveLength(5)
    expect(note(page, 'queue').text()).toContain('Yalnız ilk 5 görev yüklendi')
    expect(region(page, 'queue').get('[data-testid="u1-queue-all"]').text()).toContain('35')
    await note(page, 'queue').get('[data-action="scope-more"]').trigger('click')
    await vi.waitFor(() => expect(sent(LIST)).toHaveLength(6))
    await vi.waitFor(() => expect(note(page, 'queue').exists()).toBe(false))
    expect(region(page, 'queue').find('.rh-title').text()).toBe('Altıncı sayfadaki acil görev')
  })

  it('sunucu sayacı yoksa kuyruk toplamı türev "≥" olur (sahte toplam yok)', async () => {
    server.use(
      ...standingHandlers(MEMBER),
      http.get(`${ORIGIN}${COUNTS}`, () =>
        json({ code: 'platform.internal', message: 'x', request_id: 'r', fields: [] }, 500),
      ),
      http.get(`${ORIGIN}${LIST}`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor')
        return cursor
          ? json({ code: 'platform.internal', message: 'x', request_id: 'r', fields: [] }, 500)
          : json({ items: FIRST, next_cursor: 'c2' })
      }),
    )
    const page = await mountRole(MemberHomePage, MEMBER_SCOPE)
    await vi.waitFor(() => expect(note(page, 'queue').attributes('data-scope')).toBe('failed'))
    expect(region(page, 'queue').get('[data-testid="u1-queue-all"]').text()).toContain('≥1')
  })
})

describe('K1 kısmi küme (CX-F6-E-03)', () => {
  it('2. sayfa hatası: birim şeridi etiketi + yeniden dene; ekip yükü ve dikkat "≥"', async () => {
    server.use(
      ...mocks(
        [
          ...standingHandlers(COORD),
          http.get(`${ORIGIN}${LIST}`, ({ request }) => {
            const cursor = new URL(request.url).searchParams.get('cursor')
            return cursor
              ? json({ code: 'platform.internal', message: 'x', request_id: 'r', fields: [] }, 500)
              : json({ items: [{ ...URGENT, assignee_account_ids: ['acc-2'] }], next_cursor: 'c2' })
          }),
        ],
        { members: [{ account_id: 'acc-2', full_name: 'Ali', department_role: 'uye' }] },
      ),
    )
    const page = await mountRole(CoordinatorHomePage, COORD_SCOPE)
    await vi.waitFor(() =>
      expect(page.wrapper.get('[data-partial]').attributes('data-scope')).toBe('failed'),
    )
    expect(page.wrapper.get('[data-partial]').text()).toContain('İlk 1 görev yüklendi')
    expect(page.wrapper.get('[data-cell="open"] [data-value]').text()).toBe('35')
    expect(page.wrapper.get('[data-cell="unassigned"] [data-value]').text()).toBe('≥0')
    expect(region(page, 'attention').find('.rp-count').text()).toBe('≥1')
    expect(region(page, 'team').text()).toContain('≥1')
    expect(note(page, 'team').exists()).toBe(true)
    expect(page.wrapper.find('[data-partial] [data-action="scope-more"]').exists()).toBe(true)
  })

  // CX-F6-E-07: sayaç hatası liste kapsamını/devam eylemini gizlemez; türevler alt sınır.
  const COUNTS_FAIL = http.get(`${ORIGIN}${COUNTS}`, () =>
    json({ code: 'platform.internal', message: 'x', request_id: 'r', fields: [] }, 500),
  )
  const pending = (title: string) => row('onaya_sunuldu', { title, end_on: '2099-01-10' })

  it('sayaç hatası + 2. sayfa hatası: liste eylemi görünür, aynı imleci sürdürür, sayaç düzelmeden yeni görevleri getirir', async () => {
    let fail = true
    const cursors: (string | null)[] = []
    server.use(
      COUNTS_FAIL,
      ...standingHandlers(COORD),
      http.get(`${ORIGIN}${LIST}`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor')
        cursors.push(cursor)
        if (!cursor) return json({ items: [pending('Birinci onay')], next_cursor: 'c2' })
        return fail
          ? json({ code: 'platform.internal', message: 'x', request_id: 'r', fields: [] }, 500)
          : json({ items: [pending('İkinci onay')], next_cursor: '' })
      }),
      ...roleHandlers(),
    )
    const page = await mountRole(CoordinatorHomePage, COORD_SCOPE)
    await vi.waitFor(() =>
      expect(page.wrapper.get('[data-partial]').attributes('data-scope')).toBe('failed'),
    )
    // Sayaç hatası bölge içinde; kapsam notu ve eylem yine de çizili.
    expect(page.wrapper.find('[data-region="unit"] [role="alert"]').exists()).toBe(true)
    expect(page.wrapper.get('[data-partial]').text()).toContain('İlk 1 görev yüklendi')
    expect(region(page, 'approvals').find('.rp-count').text()).toBe('≥1')
    const countCalls = sent(COUNTS).length

    fail = false
    await page.wrapper.get('[data-partial] [data-action="scope-more"]').trigger('click')
    await vi.waitFor(() => expect(page.wrapper.find('[data-partial]').exists()).toBe(false))
    expect(cursors.slice(-1)).toEqual(['c2'])
    expect(sent(COUNTS)).toHaveLength(countCalls)
    expect(region(page, 'approvals').find('.rp-count').text()).toBe('2')
    expect(region(page, 'approvals').text()).toContain('İkinci onay')
  })

  it('sayaç hatası + 5 sayfa tavanı: "Devam et" görünür, imleçten sürdürür; "Yeniden dene" yalnız sayaç', async () => {
    const cursors: (string | null)[] = []
    server.use(
      COUNTS_FAIL,
      ...standingHandlers(COORD),
      http.get(`${ORIGIN}${LIST}`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor')
        cursors.push(cursor)
        const n = cursor ? Number(cursor.slice(1)) : 1
        return n >= 6
          ? json({ items: [pending('Altıncı sayfa onayı')], next_cursor: '' })
          : json({ items: [pending(`Onay ${n}`)], next_cursor: `c${n + 1}` })
      }),
      ...roleHandlers(),
    )
    const page = await mountRole(CoordinatorHomePage, COORD_SCOPE)
    await vi.waitFor(() =>
      expect(page.wrapper.get('[data-partial]').attributes('data-scope')).toBe('capped'),
    )
    expect(sent(LIST)).toHaveLength(5)
    expect(region(page, 'approvals').find('.rp-count').text()).toBe('≥5')
    // "Yeniden dene" sayaç sorgusunu yeniler; liste istek sayısı değişmez.
    const countCalls = sent(COUNTS).length
    await page.wrapper.get('[data-region="unit"] [role="alert"] button').trigger('click')
    await vi.waitFor(() => expect(sent(COUNTS).length).toBeGreaterThan(countCalls))
    expect(sent(LIST)).toHaveLength(5)

    await page.wrapper.get('[data-partial] [data-action="scope-more"]').trigger('click')
    await vi.waitFor(() => expect(sent(LIST)).toHaveLength(6))
    expect(cursors.slice(-1)).toEqual(['c6'])
    await vi.waitFor(() => expect(page.wrapper.find('[data-partial]').exists()).toBe(false))
    expect(region(page, 'approvals').find('.rp-count').text()).toBe('6')
    expect(region(page, 'approvals').text()).toContain('Altıncı sayfa onayı')
  })
})
