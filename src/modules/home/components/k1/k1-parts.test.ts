import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { COORD_SCOPE, row, server, standingHandlers } from '../../__tests__/harness'
import { mountRole, resetRole } from '../../__tests__/role-harness'
import { meetingView } from '../../model/role/meetings'
import { unitSummary } from '../../model/k1/summary'
import { teamLoad } from '../../model/k1/team'
import { counts as countsOf, item } from '../../__tests__/rows'
import ActivityCard from './ActivityCard.vue'
import ApprovalsCard from './ApprovalsCard.vue'
import AttentionCard from './AttentionCard.vue'
import BarSeg from './BarSeg.vue'
import DueText from './DueText.vue'
import MeetingsCard from './MeetingsCard.vue'
import QuickCard from './QuickCard.vue'
import RegionBody from './RegionBody.vue'
import RequestsCard from './RequestsCard.vue'
import TeamLoadCard from './TeamLoadCard.vue'
import UnassignedCard from './UnassignedCard.vue'
import UnitStrip from './UnitStrip.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetRole)
afterAll(() => server.close())

const COORD = { companyAdmin: false, rows: [{ department_id: 'd1', role: 'koordinator' }] }
const MEMBER = { companyAdmin: false, rows: [{ department_id: 'd1', role: 'uye' }] }
const mount = (component: object, props: Record<string, unknown> = {}) =>
  mountRole(component, COORD_SCOPE, props)

describe('BarSeg / RegionBody / DueText', () => {
  it('BarSeg: genişlik tek dinamik değer (--rh-w), 0–100 aralığına kırpılır', async () => {
    server.use(...standingHandlers(COORD))
    const a = await mount(BarSeg, { tone: 'late', width: 140 })
    expect(a.wrapper.get('span').attributes('style')).toContain('--rh-w: 100%')
    expect(a.wrapper.get('span').classes()).toContain('rh-seg-late')
    const b = await mount(BarSeg, { tone: 'doing', width: -5 })
    expect(b.wrapper.get('span').attributes('style')).toContain('--rh-w: 0%')
  })

  it('RegionBody: hata > yükleniyor > boş > içerik; "Yeniden dene" retry yayar', async () => {
    server.use(...standingHandlers(COORD))
    const ok = await mountRole(RegionBody, COORD_SCOPE, {})
    expect(ok.wrapper.find('[data-empty]').exists()).toBe(false)
    const loading = await mount(RegionBody, { loading: true })
    expect(loading.wrapper.find('[data-skeleton]').attributes('aria-busy')).toBe('true')
    const empty = await mount(RegionBody, { empty: 'Boş' })
    expect(empty.wrapper.get('[data-empty]').text()).toBe('Boş')
    const failed = await mount(RegionBody, {
      error: { messageKey: 'errors.client.network_error', requestId: null },
    })
    expect(failed.wrapper.get('[role="alert"]').exists()).toBe(true)
    await failed.wrapper.get('button').trigger('click')
    expect(failed.wrapper.emitted('retry')).toHaveLength(1)
  })

  it('DueText: gecikme sunucudan, kalan gün kurulum gününe göre', async () => {
    server.use(...standingHandlers(COORD))
    const late = await mount(DueText, {
      item: { end_on: '2026-10-20', is_overdue: true, days_overdue: 1 },
      today: '2026-10-21',
    })
    expect(late.wrapper.text()).toContain('bitiş 20.10')
    expect(late.wrapper.text()).toContain('1 gün geç')
    expect(late.wrapper.find('.rh-danger').exists()).toBe(true)
    const left = await mount(DueText, {
      item: { end_on: '2026-10-24', is_overdue: false, days_overdue: 0 },
      today: '2026-10-21',
    })
    expect(left.wrapper.text()).toContain('3 gün kaldı')
    expect(left.wrapper.find('.rh-danger').exists()).toBe(false)
  })
})

describe('K1 bölgeleri (bileşen sözleşmesi)', () => {
  it('UnitStrip: altı kutu, ≥ ipucu, yükleme ve hata; "Birimim" devre dışı', async () => {
    server.use(...standingHandlers(COORD))
    const summary = unitSummary(
      countsOf({ by: { devam_ediyor: 2 }, overdue: 1 }),
      [item({ is_overdue: true, days_overdue: 5 })],
      false,
    )
    const page = await mount(UnitStrip, { unit: 'Birim d1', summary })
    expect(page.wrapper.findAll('[data-cell]')).toHaveLength(6)
    expect(page.wrapper.get('[data-cell="unassigned"] [data-value]').text()).toBe('≥1')
    expect(page.wrapper.get('[data-cell="overdue"]').text()).toContain('En uzunu ≥5 gün')
    expect(page.wrapper.find('[data-partial]').exists()).toBe(true)
    expect(page.wrapper.get('[data-testid="k1-unit-link"]').attributes('aria-disabled')).toBe(
      'true',
    )
    const loading = await mount(UnitStrip, { unit: 'x', summary: null, loading: true })
    expect(loading.wrapper.findAll('[data-skeleton]')).toHaveLength(6)
    const failed = await mount(UnitStrip, {
      unit: 'x',
      summary: null,
      error: { messageKey: 'errors.client.network_error', requestId: null },
    })
    expect(failed.wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('ApprovalsCard: yetkili koordinatörde Onayla/İade; üyede eylem DOM’da yok', async () => {
    const items = [row('onaya_sunuldu', { title: 'Hidrofor' })]
    server.use(...standingHandlers(COORD))
    const coord = await mount(ApprovalsCard, { items, count: 1, today: '2026-10-21' })
    await vi.waitFor(() =>
      expect(coord.wrapper.find('[data-action="approve"]').exists()).toBe(true),
    )
    expect(coord.wrapper.find('[data-action="return"]').exists()).toBe(true)
    resetRole()
    server.use(...standingHandlers(MEMBER))
    const member = await mount(ApprovalsCard, { items, count: 1, today: '2026-10-21' })
    expect(member.wrapper.findAll('[data-row]')).toHaveLength(1)
    expect(member.wrapper.find('[data-action]').exists()).toBe(false)
  })

  it('UnassignedCard: ≥ sayı, Ata/Üstlen; boş durum', async () => {
    server.use(...standingHandlers(COORD))
    const items = [row('baslanmadi', { assignee_account_ids: [] })]
    const page = await mount(UnassignedCard, { items, today: '2026-10-21', partial: true })
    await vi.waitFor(() => expect(page.wrapper.find('[data-action="claim"]').exists()).toBe(true))
    expect(page.wrapper.find('[data-action="assign"]').exists()).toBe(true)
    expect(page.wrapper.find('.rp-count').text()).toBe('≥1')
    const empty = await mount(UnassignedCard, { items: [], today: '2026-10-21' })
    expect(empty.wrapper.get('[data-empty]').text()).toBe('Atanmamış görev yok')
  })

  it('AttentionCard: bekleyen talepte "Talebi gör", yoksa "Süre uzat" (form açılır)', async () => {
    server.use(...standingHandlers(COORD))
    const pending = item({
      is_overdue: true,
      days_overdue: 2,
      pending_date_request: {
        request_id: 'r',
        new_start_on: '2026-11-01',
        new_end_on: '2026-11-09',
      },
    })
    const plain = item({ is_overdue: true, days_overdue: 1 })
    const rows = [pending, plain].map((i) => ({
      item: i,
      requestPending: i.pending_date_request !== null,
      requestRejected: false,
    }))
    const page = await mount(AttentionCard, { rows })
    await vi.waitFor(() => expect(page.wrapper.find('[data-action="extend"]').exists()).toBe(true))
    expect(page.wrapper.find('[data-action="view-request"]').exists()).toBe(true)
    await page.wrapper.get('[data-action="extend"]').trigger('click')
    await vi.waitFor(() =>
      expect(document.body.querySelector('[data-testid="tp-request-submit"]')).not.toBeNull(),
    )
  })

  it('TeamLoadCard / MeetingsCard / RequestsCard / QuickCard / ActivityCard', async () => {
    server.use(...standingHandlers(COORD))
    const rows = teamLoad(
      [{ accountId: 'a', fullName: 'Ali Veli', coordinator: false }],
      [item({ assignee_account_ids: ['a'] })],
      'a',
    )
    const team = await mount(TeamLoadCard, { rows, assigned: 1 })
    expect(team.wrapper.get('[data-row]').text()).toContain('sen')
    expect(team.wrapper.get('[data-testid="k1-team-link"]').attributes('aria-disabled')).toBe(
      'true',
    )

    const views = [
      meetingView(
        {
          meeting_id: 'm1',
          title: 'T',
          meeting_date: '2099-01-02T09:00:00Z',
          owner_department_id: 'd1',
          departments: [{ department_id: 'd1', department_name: 'Sistem' }],
          members_included: false,
          summary: { participant_count: 4 },
        } as never,
        'Europe/Istanbul',
        '2026-10-21',
      ),
    ]
    const meetings = await mount(MeetingsCard, { views, total: 1, more: true })
    expect(meetings.wrapper.get('.rp-count').text()).toBe('1+')
    expect(meetings.wrapper.get('[data-row]').text()).toContain('4 katılımcı')
    expect(meetings.wrapper.text()).not.toContain('Canlı')

    const requests = await mount(RequestsCard, { rows: [], pending: 0, decided: 0 })
    expect(requests.wrapper.get('[data-empty]').text()).toBe('Tarih talebi yok')

    const quick = await mount(QuickCard, { showTask: false, showMeeting: false })
    expect(quick.wrapper.findAll('[data-quick]').map((q) => q.attributes('data-quick'))).toEqual([
      'member',
      'request',
    ])
    const activity = await mount(ActivityCard)
    expect(activity.wrapper.find('[data-design-stub="BE-010"]').exists()).toBe(true)
    expect(activity.wrapper.text()).toContain('Henüz işlem geçmişi yok')
  })
})
