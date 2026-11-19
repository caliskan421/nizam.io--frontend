import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import {
  COORD_SCOPE,
  COUNTS,
  DASHBOARD,
  http,
  json,
  LIST,
  ORIGIN,
  row,
  sent,
  server,
  standingHandlers,
} from '../__tests__/harness'
import { EMPTY_BY, mountRole, resetRole, roleHandlers } from '../__tests__/role-harness'
import CoordinatorHomePage from './CoordinatorHomePage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  useConfirm().clear()
  useToast().clear()
  resetRole()
})
afterAll(() => server.close())

const COORD = { companyAdmin: false, rows: [{ department_id: 'd1', role: 'koordinator' }] }
const A = { account_id: 'acc-2', full_name: 'Ayşe Kaya' }

const dialog = <T extends Element = HTMLElement>(testId: string) =>
  document.body.querySelector<T>(`[data-testid="${testId}"]`)

const ITEMS = [
  row('onaya_sunuldu', {
    title: 'Hidrofor',
    code: 'ALT-3',
    sequence_no: 3,
    file_count: 4,
    submitted_at: '2026-10-20T10:00:00Z',
    assignee_account_ids: ['acc-2'],
    assignees: [A],
  }),
  row('baslanmadi', {
    title: 'Sahipsiz iş',
    assignee_account_ids: [],
    priority: 'yuksek',
    has_pending_dependency: true,
    pending_dependency_count: 2,
  }),
  row('devam_ediyor', {
    title: 'Geciken iş',
    code: 'ALT-8',
    sequence_no: 8,
    has_pending_dependency: true,
    pending_dependency_count: 1,
    assignee_account_ids: ['acc-2'],
    assignees: [A],
    is_overdue: true,
    days_overdue: 21,
    end_on: '2026-09-30',
  }),
  row('iade_edildi', {
    title: 'İade iş',
    code: 'ALT-4',
    sequence_no: 4,
    assignee_account_ids: ['acc-2'],
    assignees: [A],
  }),
]

const MEMBERS = [
  {
    account_id: 'acc-1',
    full_name: 'Kadir Özbek',
    membership_id: 'm1',
    role: 'koordinator',
    status: 'active',
  },
  {
    account_id: 'acc-2',
    full_name: 'Ayşe Kaya',
    membership_id: 'm2',
    role: 'uye',
    status: 'active',
  },
]

const MEETING = {
  meeting_id: 'm1',
  program_id: 'p1',
  title: 'Haftalık toplantı',
  meeting_date: '2099-01-02T12:30:00Z',
  owner_department_id: 'd1',
  departments: [{ department_id: 'd1', department_name: 'Birim d1' }],
  members_included: true,
  invite_mode: 'coordinatorship',
  place: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  created_by_account_id: 'acc-1',
  created_by_role: 'coordinator',
  summary: { participant_count: 9 },
}

const REQUEST = {
  request_id: 'r1',
  work_item_id: ITEMS[2]!.work_item_id,
  status: 'rejected',
  old_start_on: '2026-09-01',
  old_end_on: '2026-09-30',
  new_start_on: '2026-09-01',
  new_end_on: '2026-10-31',
  reason: 'Tedarik gecikti',
  created_at: '2026-10-19T08:30:00Z',
  requested_by: { account_id: 'acc-2', full_name: 'Ayşe Kaya' },
  reviewed_at: '2026-10-21T09:00:00Z',
  reviewed_by: { account_id: 'acc-1', full_name: 'Kadir Özbek' },
  review_reason: '<i>tedarik</i> belgesi eksik',
}

function handlers() {
  return [
    ...standingHandlers(COORD),
    ...roleHandlers({
      items: ITEMS,
      counts: {
        by_status: {
          ...EMPTY_BY,
          onaya_sunuldu: 1,
          baslanmadi: 1,
          devam_ediyor: 1,
          iade_edildi: 1,
        },
        total: 4,
        overdue: 1,
        pending_date_requests: 2,
      },
      members: MEMBERS,
      meetings: [MEETING],
      requests: [REQUEST],
    }),
  ]
}

const $ = (page: Awaited<ReturnType<typeof mountRole>>, sel: string) => page.wrapper.find(sel)
const region = (page: Awaited<ReturnType<typeof mountRole>>, name: string) =>
  page.wrapper.get(`[data-region="${name}"]`)

describe('K1 koordinatör ana sayfası', () => {
  it('E-K1-01/02/05/07…13: selamlama, alt başlık, kicker ve altı kutu (pano ÇAĞRILMAZ)', async () => {
    server.use(...handlers())
    const page = await mountRole(CoordinatorHomePage, COORD_SCOPE)
    await vi.waitFor(() => expect(region(page, 'attention').findAll('[data-row]')).toHaveLength(1))
    expect(page.wrapper.get('[data-testid="home-greeting"]').text()).toBe('Merhaba Ayşe Nur Yılmaz')
    expect(page.wrapper.get('[data-testid="k1-subtitle"]').text()).toBe(
      'Birim d1 · koordinatör olarak birimin tüm görevlerini görüyorsun',
    )
    expect(page.wrapper.get('[data-testid="k1-kicker"]').text()).toBe('Birim d1 · 4 görev · bugün')
    const value = (key: string) => page.wrapper.get(`[data-cell="${key}"] [data-value]`).text()
    expect(
      ['open', 'overdue', 'pending', 'returned', 'unassigned', 'dateRequests'].map(value),
    ).toEqual(['4', '1', '1', '1', '1', '2'])
    expect(page.wrapper.get('[data-cell="overdue"]').text()).toContain('En uzunu 21 gün · ALT-8')
    expect(page.wrapper.get('[data-cell="returned"]').text()).toContain('ALT-4 · Ayşe Kaya')
    expect(page.wrapper.get('[data-cell="pending"]').attributes('href')).toBe(
      '/gorevler?durum=onaya_sunuldu',
    )
    expect(sent(DASHBOARD)).toHaveLength(0)
    // Tek yükleme: sayaç + liste birim süzgeciyle; toplantı ve ekip aynı birim; birim başına fan-out yok.
    expect(sent(COUNTS)[0]!.query.get('department_id')).toBe('d1')
    expect(sent(LIST)[0]!.query.get('department_id')).toBe('d1')
    expect(sent('/v1/meetings')[0]!.query.get('department_id')).toBe('d1')
    expect(sent('/v1/departments/d1/members')).toHaveLength(1)
    expect(sent(COUNTS)).toHaveLength(1)
  })

  it('E-K1-06/32/36/37/40/41: devre dışı/gizli/statik parçalar; rapor girişi YOK', async () => {
    server.use(...handlers())
    const page = await mountRole(CoordinatorHomePage, COORD_SCOPE)
    expect(page.wrapper.get('[data-testid="k1-unit-link"]').attributes('aria-disabled')).toBe(
      'true',
    )
    expect(page.wrapper.get('[data-quick="member"]').attributes('aria-disabled')).toBe('true')
    expect(page.wrapper.get('[data-testid="k1-team-link"]').attributes('aria-disabled')).toBe(
      'true',
    )
    expect(region(page, 'activity').find('[data-testid="audit-feed"]').exists()).toBe(true)
    const text = page.wrapper.text()
    for (const absent of ['Rapor', 'Canlı', 'Anlık toplantı'])
      expect(text, absent).not.toContain(absent)
    expect(page.wrapper.findAll('a').some((a) => a.attributes('href')?.includes('rapor'))).toBe(
      false,
    )
  })

  it('E-K1-14…22: onay, atanmamış ve dikkat kuyrukları aynı kümeden', async () => {
    // Yalnız `Date` sahte (göreli zaman 2026-10-20 15:00 İstanbul); zamanlayıcılar gerçek.
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-20T12:00:00Z') })
    server.use(...handlers())
    const page = await mountRole(CoordinatorHomePage, COORD_SCOPE)
    await vi.waitFor(() => expect(region(page, 'approvals').findAll('[data-row]')).toHaveLength(1))
    expect(region(page, 'approvals').text()).toContain('Hidrofor')
    // BE-137: alt yazı ve satır parçaları satır alanlarından (görev başına dosya listesi okunmaz).
    expect(region(page, 'approvals').get('[data-testid="k1-approvals-note"]').text()).toBe(
      'Kanıt yüklendi, kararını bekliyor · en eskisi 2 sa önce',
    )
    expect(region(page, 'approvals').get('[data-parts="sent"]').text()).toBe('gönderildi 2 sa önce')
    expect(region(page, 'approvals').get('[data-parts="files"]').text()).toBe('4 dosya')
    vi.useRealTimers()
    // Görev kodu sunucunun `code` alanından (BE-005; eski "—" yer tutucusu yok).
    expect(region(page, 'approvals').get('[data-task-code]').text()).toBe('ALT-3')
    expect(region(page, 'approvals').find('[data-design-stub]').exists()).toBe(false)
    expect(region(page, 'unassigned').findAll('[data-row]')).toHaveLength(1)
    expect(region(page, 'unassigned').text()).toContain('Sahipsiz iş')
    expect(region(page, 'unassigned').text()).toContain('Yüksek')
    // BE-138: kilit rozeti yalnız sayı; başlık notu ve "Bağımlılıklar" eylemi satır alanından.
    expect(region(page, 'unassigned').get('[data-lock]').text()).toBe('2 görev bekleniyor')
    const att = region(page, 'attention')
    expect(att.text()).toContain('Geciken iş')
    expect(att.text()).toContain('21 gün gecikti')
    expect(att.text()).toContain('talep reddedildi')
    expect(att.find('[data-action="extend"]').exists()).toBe(true)
    expect(att.get('[data-testid="k1-attention-note"]').text()).toBe(
      '1 geciken görev · 1 görev bağımlılık bekliyor',
    )
    expect(att.get('[data-action="dependencies"]').text()).toBe('Bağımlılıklar')
  })

  it('E-K1-17: "Onayla" ve "İade et" transitionWorkItem (X-Requested-With); başarıda liste yeniden okunur', async () => {
    const bodies: unknown[] = []
    const headers: string[] = []
    server.use(
      ...handlers(),
      http.post(`${ORIGIN}/v1/work-items/:id/transitions`, async ({ request, params }) => {
        bodies.push([params.id, await request.json()])
        headers.push(request.headers.get('X-Requested-With') ?? '')
        return json({
          work_item_id: params.id,
          from: 'onaya_sunuldu',
          to: 'tamamlandi',
          actor: 'koordinator',
        })
      }),
    )
    const page = await mountRole(CoordinatorHomePage, COORD_SCOPE)
    await vi.waitFor(() => expect($(page, '[data-action="approve"]').exists()).toBe(true))
    const lists = sent(LIST).length
    await page.wrapper.get('[data-action="approve"]').trigger('click')
    await vi.waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual([ITEMS[0]!.work_item_id, { to: 'tamamlandi' }])
    expect(headers[0]).not.toBe('')
    await vi.waitFor(() => expect(sent(LIST).length).toBeGreaterThan(lists))
    // BE-139: "İade et" önce isteğe bağlı gerekçe penceresini açar; boş gönderim gerekçesizdir.
    await page.wrapper.get('[data-action="return"]').trigger('click')
    await vi.waitFor(() => expect(dialog('k1-return-submit')).not.toBeNull())
    expect(bodies).toHaveLength(1)
    dialog<HTMLButtonElement>('k1-return-submit')!.click()
    await vi.waitFor(() => expect(bodies).toHaveLength(2))
    expect(bodies[1]).toEqual([ITEMS[0]!.work_item_id, { to: 'iade_edildi' }])
  })

  describe('iade gerekçesi akışı (BE-139, WORK-K96)', () => {
    const transitions = (bodies: unknown[]) =>
      http.post(`${ORIGIN}/v1/work-items/:id/transitions`, async ({ request, params }) => {
        bodies.push(await request.json())
        return json({
          work_item_id: params.id,
          from: 'onaya_sunuldu',
          to: 'iade_edildi',
          actor: 'koordinator',
        })
      })

    async function openReturn(bodies: unknown[]) {
      server.use(...handlers(), transitions(bodies))
      const page = await mountRole(CoordinatorHomePage, COORD_SCOPE)
      await vi.waitFor(() => expect($(page, '[data-action="return"]').exists()).toBe(true))
      const trigger = page.wrapper.get('[data-action="return"]')
      ;(trigger.element as HTMLElement).focus()
      await trigger.trigger('click')
      await vi.waitFor(() => expect(dialog('k1-return-input')).not.toBeNull())
      return { page, trigger }
    }

    function write(text: string): void {
      const input = dialog<HTMLTextAreaElement>('k1-return-input')!
      input.value = text
      input.dispatchEvent(new Event('input'))
    }

    it('dolu gerekçe kırpılıp gövdeye `reason` olarak gider', async () => {
      const bodies: unknown[] = []
      await openReturn(bodies)
      write('  imzalı liste eksik  ')
      dialog<HTMLButtonElement>('k1-return-submit')!.click()
      await vi.waitFor(() => expect(bodies).toHaveLength(1))
      expect(bodies[0]).toEqual({ to: 'iade_edildi', reason: 'imzalı liste eksik' })
    })

    it('1–2 karakter geçersiz: istek gitmez, hata görünür; düzeltince gider', async () => {
      const bodies: unknown[] = []
      await openReturn(bodies)
      write('ab')
      dialog<HTMLButtonElement>('k1-return-submit')!.click()
      await flushPromises()
      expect(bodies).toHaveLength(0)
      expect(document.body.textContent).toContain('Gerekçe 3–500 karakter olmalı')
      write('abc')
      dialog<HTMLButtonElement>('k1-return-submit')!.click()
      await vi.waitFor(() => expect(bodies).toEqual([{ to: 'iade_edildi', reason: 'abc' }]))
    })

    it('Vazgeç, Esc ve ✕: istek yok, odak "İade et" düğmesine döner', async () => {
      const bodies: unknown[] = []
      const { trigger } = await openReturn(bodies)
      const closers = [
        () => dialog<HTMLButtonElement>('k1-return-cancel')!.click(),
        () =>
          document
            .querySelector('[role="dialog"]')!
            .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
        () =>
          document
            .querySelector<HTMLButtonElement>('[role="dialog"] [aria-label="Kapat"]')!
            .click(),
      ]
      for (const [index, close] of closers.entries()) {
        if (index > 0) {
          ;(trigger.element as HTMLElement).focus()
          await trigger.trigger('click')
          await vi.waitFor(() => expect(dialog('k1-return-input')).not.toBeNull())
        }
        close()
        await vi.waitFor(() => expect(dialog('k1-return-input')).toBeNull())
        await vi.waitFor(() => expect(document.activeElement).toBe(trigger.element))
      }
      expect(bodies).toHaveLength(0)
    })
  })

  it('E-K1-22: "Üstlen" kendi hesabımı atar (addAssignments)', async () => {
    const calls: unknown[] = []
    server.use(
      ...handlers(),
      http.post(`${ORIGIN}/v1/work-items/:id/assignments`, async ({ request, params }) => {
        calls.push([params.id, await request.json()])
        return json({ added: 1 })
      }),
    )
    const page = await mountRole(CoordinatorHomePage, COORD_SCOPE)
    await vi.waitFor(() => expect($(page, '[data-action="claim"]').exists()).toBe(true))
    await page.wrapper.get('[data-action="claim"]').trigger('click')
    await vi.waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0]).toEqual([ITEMS[1]!.work_item_id, { account_ids: ['acc-1'] }])
  })

  it('yazma hatası: sunucu iletisi gösterilmez, kod → i18n; iyimser güncelleme yok', async () => {
    server.use(
      ...handlers(),
      http.post(`${ORIGIN}/v1/work-items/:id/transitions`, () =>
        HttpResponseFail('work.transition_not_allowed', 409),
      ),
    )
    const page = await mountRole(CoordinatorHomePage, COORD_SCOPE)
    await vi.waitFor(() => expect($(page, '[data-action="approve"]').exists()).toBe(true))
    await page.wrapper.get('[data-action="approve"]').trigger('click')
    await vi.waitFor(() => expect(useToast().current.value).not.toBeNull())
    expect(useToast().current.value!.message).not.toContain('sunucu iletisi')
    expect(region(page, 'approvals').findAll('[data-row]')).toHaveLength(1)
  })

  it('E-K1-26…28: ekip yükü satırları (rol, sen, açık/geciken); 4 görev = %100 ölçeği', async () => {
    server.use(...handlers())
    const page = await mountRole(CoordinatorHomePage, COORD_SCOPE)
    await vi.waitFor(() => expect(region(page, 'team').findAll('[data-row]')).toHaveLength(2))
    const rows = region(page, 'team').findAll('[data-row]')
    expect(rows[0]!.text()).toContain('Ayşe Kaya')
    expect(rows[0]!.text()).toContain('3 açık')
    expect(rows[0]!.text()).toContain('1 geciken')
    expect(rows[1]!.text()).toContain('Kadir Özbek')
    expect(rows[1]!.text()).toContain('sen')
    expect(rows[0]!.get('[data-seg="late"]').attributes('style')).toContain('--rh-w: 25%')
  })

  it('E-K1-34/35/38/39: toplantı ve tarih talebi bölgeleri', async () => {
    server.use(...handlers())
    const page = await mountRole(CoordinatorHomePage, COORD_SCOPE)
    await vi.waitFor(() => expect(region(page, 'meetings').findAll('[data-row]')).toHaveLength(1))
    const meeting = region(page, 'meetings').get('[data-row]')
    expect(meeting.text()).toContain('Haftalık toplantı')
    expect(meeting.text()).toContain('15:30')
    expect(meeting.text()).toContain('Üyeler katılıyor')
    expect(meeting.attributes('href')).toBe('/toplantilar/m1')
    await vi.waitFor(() => expect(region(page, 'requests').findAll('[data-row]')).toHaveLength(1))
    const req = region(page, 'requests').get('[data-row]')
    expect(req.text()).toContain('Geciken iş')
    expect(req.text()).toContain('Reddedildi')
    expect(req.text()).toContain('30.09 → 31.10')
    // BE-140: gönderim/karar günü ve karar notu satır alanlarından; not kullanıcı metnidir.
    expect(req.get('[data-parts="times"]').text()).toBe('19.10 gönderildi · 21.10 karar verildi')
    expect(req.get('[data-parts="note"]').text()).toBe(
      'Yönetici notu: <i>tedarik</i> belgesi eksik',
    )
    expect(req.find('i').exists()).toBe(false)
    expect(region(page, 'requests').text()).toContain('plan tarihini yönetici değiştirir')
  })

  it('boş küme: nötr metinler, sahte satır yok', async () => {
    server.use(...standingHandlers(COORD), ...roleHandlers())
    const page = await mountRole(CoordinatorHomePage, COORD_SCOPE)
    await vi.waitFor(() =>
      expect(region(page, 'approvals').text()).toContain('Onay bekleyen görev yok'),
    )
    expect(region(page, 'unassigned').text()).toContain('Atanmamış görev yok')
    expect(region(page, 'attention').text()).toContain('Dikkat gerektiren görev yok')
    expect(region(page, 'team').text()).toContain('Ekibinde henüz üye yok')
    expect(region(page, 'meetings').text()).toContain('Yaklaşan toplantı yok')
    expect(region(page, 'requests').text()).toContain('Tarih talebi yok')
    expect(page.wrapper.findAll('[data-row]')).toHaveLength(0)
  })

  it('bölge hatası bölge içinde: liste 500 → kuyruklar hatalı, şerit ve toplantılar sağlam; Yeniden dene', async () => {
    let fail = true
    server.use(
      http.get(`${ORIGIN}${LIST}`, () =>
        fail
          ? json({ code: 'platform.internal', message: 'x', request_id: 'r', fields: [] }, 500)
          : json({ items: ITEMS, next_cursor: '' }),
      ),
      ...handlers(),
    )
    const page = await mountRole(CoordinatorHomePage, COORD_SCOPE)
    await vi.waitFor(
      () => expect(region(page, 'approvals').find('[role="alert"]').exists()).toBe(true),
      {
        timeout: 4000,
      },
    )
    expect(page.wrapper.findAll('[data-cell]')).toHaveLength(6)
    expect(region(page, 'meetings').findAll('[data-row]')).toHaveLength(1)
    fail = false
    await region(page, 'approvals').get('[role="alert"] button').trigger('click')
    await vi.waitFor(() => expect(region(page, 'approvals').findAll('[data-row]')).toHaveLength(1))
  })

  it('kapsam eksik (birim yok): seçim notu, kapsamlı istek yok', async () => {
    server.use(...standingHandlers(COORD), ...roleHandlers())
    const page = await mountRole(CoordinatorHomePage, {
      programId: 'p1',
      lens: 'coordinator',
      departmentId: null,
    })
    await flushPromises()
    expect(page.wrapper.get('[data-testid="role-select"]').text()).toContain('Kapsam seçin')
    expect(sent(COUNTS)).toHaveLength(0)
    expect(sent(LIST)).toHaveLength(0)
  })
})

function HttpResponseFail(code: string, status: number) {
  return json({ code, message: 'sunucu iletisi', request_id: 'req-1', fields: [] }, status)
}
