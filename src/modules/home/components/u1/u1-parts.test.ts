import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { useConfirm } from '@/shared/ui/confirm'

import {
  http,
  json,
  MEMBER_SCOPE,
  ORIGIN,
  row,
  server,
  standingHandlers,
} from '../../__tests__/harness'
import { mountRole, resetRole, roleHandlers, stubBrowserClone } from '../../__tests__/role-harness'
import { counts as countsOf, item } from '../../__tests__/rows'
import { meetingView } from '../../model/role/meetings'
import { unitBreakdown } from '../../model/u1/departments'
import DeadlineCalendar from './DeadlineCalendar.vue'
import NoteDialog from './NoteDialog.vue'
import NotificationsCard from './NotificationsCard.vue'
import QuickTiles from './QuickTiles.vue'
import SummaryStrip from './SummaryStrip.vue'
import TodayQueue from './TodayQueue.vue'
import UnitsCard from './UnitsCard.vue'
import UploadDialog from './UploadDialog.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => {
  stubBrowserClone()
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => {
  useConfirm().clear()
  resetRole()
})
afterAll(() => server.close())

const MEMBER = { companyAdmin: false, rows: [{ department_id: 'd1', role: 'uye' }] }
const mount = (component: object, props: Record<string, unknown> = {}) =>
  mountRole(component, MEMBER_SCOPE, props)

describe('Ü1 bölgeleri (bileşen sözleşmesi)', () => {
  it('SummaryStrip: açık = 0 → nötr not; yükleme iskeleti; hata bölge içi', async () => {
    server.use(...standingHandlers(MEMBER))
    const zero = await mount(SummaryStrip, {
      counts: { ...countsOf({ by: { tamamlandi: 3 } }) },
    })
    expect(zero.wrapper.get('[data-cell="overdue"]').text()).toContain('Açık görevin yok')
    expect(zero.wrapper.get('[data-cell="open"] [data-value]').text()).toBe('0')
    const loading = await mount(SummaryStrip, { counts: null, loading: true })
    expect(loading.wrapper.findAll('[data-skeleton]')).toHaveLength(4)
    const failed = await mount(SummaryStrip, {
      counts: null,
      error: { messageKey: 'errors.client.network_error', requestId: null },
    })
    expect(failed.wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('NotificationsCard: sayaç yoksa "yeni" çizilmez; liste F7 (nötr)', async () => {
    server.use(...standingHandlers(MEMBER))
    const none = await mount(NotificationsCard, { unread: null })
    expect(none.wrapper.find('[data-unread]').exists()).toBe(false)
    expect(none.wrapper.text()).toContain('Henüz bildirim yok')
    const some = await mount(NotificationsCard, { unread: 2 })
    expect(some.wrapper.get('[data-unread]').text()).toBe('2 yeni')
  })

  it('UnitsCard: boş durum; "Koordinatör:" yok', async () => {
    server.use(...standingHandlers(MEMBER))
    const empty = await mount(UnitsCard, { rows: [] })
    expect(empty.wrapper.get('[data-empty]').text()).toBe('Bir koordinatörlüğe üye değilsin')
    const rows = unitBreakdown([{ departmentId: 'a', displayName: 'Altyapı' }], [])
    const one = await mount(UnitsCard, { rows })
    expect(one.wrapper.text()).toContain('Açık görev yok')
    expect(one.wrapper.text()).not.toContain('Koordinatör:')
  })

  it('DeadlineCalendar: hücre etiketleri ve ağsız gezinme', async () => {
    server.use(...standingHandlers(MEMBER))
    const page = await mount(DeadlineCalendar, {
      today: '2026-10-21',
      timeZone: 'Europe/Istanbul',
      items: [
        item({ end_on: '2026-10-21' }),
        item({ end_on: '2026-10-05', is_overdue: true, days_overdue: 16 }),
      ],
    })
    const label = (day: string) => page.wrapper.get(`[data-day="${day}"]`).attributes('aria-label')
    expect(label('2026-10-21')).toBe('21 Ekim, bugün, yaklaşan son tarih')
    expect(label('2026-10-05')).toBe('5 Ekim, geciken son tarih')
    expect(page.wrapper.get('[data-testid="u1-cal-title"]').text()).toBe('Son tarihlerim · Ekim')
    await page.wrapper.get('[data-action="next"]').trigger('click')
    expect(page.wrapper.get('[data-testid="u1-cal-title"]').text()).toBe('Son tarihlerim · Kasım')
    expect(page.wrapper.findAll('[data-day]')).toHaveLength(42)
  })

  it('QuickTiles: yetkisiz kutucuk DOM’da yok; toplantı yoksa devre dışı; 90 MB yok', async () => {
    server.use(...standingHandlers(MEMBER))
    const page = await mount(QuickTiles, { nextMeeting: null, canUpload: false, canNote: false })
    expect(page.wrapper.findAll('[data-quick]').map((q) => q.attributes('data-quick'))).toEqual([
      'message',
      'meetingNote',
    ])
    expect(page.wrapper.get('[data-quick="meetingNote"]').attributes('aria-disabled')).toBe('true')
    const view = meetingView(
      {
        meeting_id: 'm1',
        title: 'Toplantı',
        meeting_date: '2099-01-02T09:00:00Z',
        owner_department_id: 'd1',
        departments: [],
        members_included: false,
      } as never,
      'Europe/Istanbul',
      '2026-10-21',
    )
    const withMeeting = await mount(QuickTiles, {
      nextMeeting: view,
      canUpload: true,
      canNote: true,
    })
    expect(withMeeting.wrapper.get('[data-quick="meetingNote"]').attributes('href')).toBe(
      '/toplantilar/m1',
    )
    await withMeeting.wrapper.get('[data-quick="upload"]').trigger('click')
    await withMeeting.wrapper.get('[data-quick="note"]').trigger('click')
    expect(withMeeting.wrapper.emitted('upload')).toHaveLength(1)
    expect(withMeeting.wrapper.emitted('note')).toHaveLength(1)
    expect(withMeeting.wrapper.text()).not.toContain('90 MB')
  })

  it('TodayQueue: yetkisiz üye/yönetici eylemi yok; boş durum', async () => {
    server.use(...standingHandlers(MEMBER))
    const empty = await mount(TodayQueue, { items: [], today: '2026-10-21', unitNames: new Map() })
    expect(empty.wrapper.get('[data-empty]').text()).toBe('Bugün için görev yok')
    expect(empty.wrapper.find('[data-testid="u1-queue-sub"]').exists()).toBe(false)
  })
})

/** KESİN 27: pencere kapanınca odak tetikleyiciye döner (Esc, ✕, eylem sonrası). */
describe('Ü1 pencereleri — odak dönüşü', () => {
  const ITEMS = [row('devam_ediyor', { title: 'Devam görev' })]

  async function opened(component: object, extra: Record<string, unknown> = {}) {
    server.use(...standingHandlers(MEMBER), ...roleHandlers({ items: ITEMS }))
    const host = {
      components: { Dialog: component },
      data: () => ({ open: false, extra }),
      template: `<div><button data-trigger @click="open = true">aç</button><Dialog v-model:open="open" :items="items" v-bind="extra" /></div>`,
      computed: { items: () => ITEMS },
    }
    const page = await mount(host)
    const trigger = page.wrapper.get<HTMLButtonElement>('[data-trigger]')
    trigger.element.focus()
    await trigger.trigger('click')
    await vi.waitFor(() => expect(document.body.querySelector('[role="dialog"]')).not.toBeNull())
    return { page, trigger }
  }

  it.each([
    ['UploadDialog', UploadDialog, { preset: null }],
    ['NoteDialog', NoteDialog, {}],
  ])('%s: Esc ve ✕ ile kapanınca odak tetikleyiciye döner', async (_name, component, extra) => {
    const { trigger } = await opened(component, extra)
    document
      .querySelector('[role="dialog"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await vi.waitFor(() => expect(document.body.querySelector('[role="dialog"]')).toBeNull())
    expect(document.activeElement).toBe(trigger.element)

    trigger.element.focus()
    await trigger.trigger('click')
    await vi.waitFor(() => expect(document.body.querySelector('[role="dialog"]')).not.toBeNull())
    ;(document.body.querySelector('[aria-label="Kapat"]') as HTMLButtonElement).click()
    await vi.waitFor(() => expect(document.body.querySelector('[role="dialog"]')).toBeNull())
    expect(document.activeElement).toBe(trigger.element)
  })

  it('NoteDialog: başarıdan sonra kapanır, odak tetikleyicide; boş not gönderilmez', async () => {
    const notes: unknown[] = []
    server.use(
      http.post(`${ORIGIN}/v1/work-items/:id/notes`, async ({ request }) => {
        notes.push(await request.json())
        return json({ note_id: 'n1' }, 201)
      }),
    )
    const { trigger } = await opened(NoteDialog)
    const submit = () =>
      (document.body.querySelector('[data-testid="u1-note-submit"]') as HTMLButtonElement).click()
    submit()
    await vi.waitFor(() => expect(document.body.textContent).toContain('Zorunlu alan'))
    expect(notes).toHaveLength(0)
    const text = document.body.querySelector<HTMLTextAreaElement>('[data-testid="u1-note-input"]')!
    text.value = 'Not'
    text.dispatchEvent(new Event('input'))
    submit()
    await vi.waitFor(() => expect(notes).toEqual([{ content: 'Not' }]))
    await vi.waitFor(() => expect(document.body.querySelector('[role="dialog"]')).toBeNull())
    expect(document.activeElement).toBe(trigger.element)
  })
})
