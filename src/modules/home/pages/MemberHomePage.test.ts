import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import {
  COUNTS,
  DASHBOARD,
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

const MEMBER = {
  companyAdmin: false,
  rows: [
    { department_id: 'd1', role: 'uye' },
    { department_id: 'd2', role: 'uye' },
  ],
}

const ITEMS = [
  row('devam_ediyor', { title: 'Devam görev', end_on: '2099-01-10', priority: 'orta' }),
  row('iade_edildi', { title: 'İade görev', end_on: '2099-01-05', department_id: 'd2' }),
  row('baslanmadi', { title: 'Başlanmamış görev', end_on: '2099-02-01' }),
  row('onaya_sunuldu', { title: 'Onaydaki görev', end_on: '2099-01-01' }),
  row('devam_ediyor', {
    title: 'Geciken görev',
    end_on: '2020-01-01',
    is_overdue: true,
    days_overdue: 9,
    priority: 'acil',
    subtask_counts: { total: 4, done: 2 },
    completion_evidence_required: true,
  }),
]

const COUNTS_BODY = {
  total: 6,
  by_status: {
    ...EMPTY_BY,
    devam_ediyor: 2,
    iade_edildi: 1,
    baslanmadi: 1,
    onaya_sunuldu: 1,
    tamamlandi: 1,
  },
  overdue: 1,
  pending_date_requests: 0,
}

const MEETING = {
  meeting_id: 'm9',
  program_id: 'p1',
  title: 'Hidrofor teslim kontrolü',
  meeting_date: '2099-01-02T12:30:00Z',
  owner_department_id: 'd1',
  departments: [{ department_id: 'd1', department_name: 'Birim d1' }],
  members_included: true,
  invite_mode: 'coordinatorship',
  place: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  created_by_account_id: 'acc-9',
  created_by_role: 'admin',
}

const handlers = () => [
  ...standingHandlers(MEMBER),
  ...roleHandlers({ items: ITEMS, counts: COUNTS_BODY, meetings: [MEETING], unread: 3 }),
]

type Page = Awaited<ReturnType<typeof mountRole>>
const region = (page: Page, name: string) => page.wrapper.get(`[data-region="${name}"]`)
const rowsOf = (page: Page) => region(page, 'queue').findAll('[data-row]')
const ready = (page: Page) => vi.waitFor(() => expect(rowsOf(page).length).toBeGreaterThan(0))

describe('Ü1 üye ana sayfası', () => {
  it('E-Ü1-01/02/04…08: selamlama, kapsam etiketi ve dört kart; tek yükleme program geneli, pano yok', async () => {
    server.use(...handlers())
    const page = await mountRole(MemberHomePage, MEMBER_SCOPE)
    await ready(page)
    expect(page.wrapper.get('[data-testid="home-greeting"]').text()).toBe('Merhaba Ayşe Nur Yılmaz')
    expect(page.wrapper.get('[data-testid="u1-subtitle"]').text()).toBe(
      'Birim d1 · üye olarak yalnız sana atanan görevleri görüyorsun',
    )
    const value = (key: string) => page.wrapper.get(`[data-cell="${key}"] [data-value]`).text()
    expect(['open', 'overdue', 'pending', 'returned'].map(value)).toEqual(['5', '1', '1', '1'])
    const open = page.wrapper.get('[data-cell="open"]').text()
    expect(open).toContain('2 devam · 1 onayda · 1 iade · 1 başlamadı')
    expect(page.wrapper.get('[data-cell="overdue"]').text()).toContain('Açık görevlerinin %20’si')
    expect(page.wrapper.get('[data-cell="pending"]').text()).toContain('Koordinatör onayında')
    expect(page.wrapper.get('[data-cell="returned"]').text()).toContain('Tekrar başlayabilirsin')
    const list = sent(LIST)[0]!
    expect(list.query.has('department_id')).toBe(false)
    expect(list.query.getAll('assignee_account_id')).toEqual(['acc-1'])
    expect(sent(COUNTS)[0]!.query.getAll('assignee_account_id')).toEqual(['acc-1'])
    expect(sent(COUNTS)[0]!.query.has('department_id')).toBe(false)
    expect(sent(DASHBOARD)).toHaveLength(0)
    expect(sent(LIST)).toHaveLength(1)
  })

  it('E-Ü1-09…17: kuyruk sırası (iade, geciken, öncelik, bitiş; onayda sona), ilk beş, rozetler', async () => {
    server.use(...handlers())
    const page = await mountRole(MemberHomePage, MEMBER_SCOPE)
    await ready(page)
    const titles = rowsOf(page).map((r) => r.find('.rh-title').text())
    expect(titles).toEqual([
      'İade görev',
      'Geciken görev',
      'Devam görev',
      'Başlanmamış görev',
      'Onaydaki görev',
    ])
    expect(page.wrapper.get('[data-testid="u1-queue-sub"]').text()).toContain(
      'Önceliğe ve son tarihe göre sıralandı · 5 açık görevinden 5’i',
    )
    expect(page.wrapper.get('[data-testid="u1-queue-all"]').text()).toContain('5')
    const review = rowsOf(page)[4]!
    expect(review.get('[data-badge="review"]').attributes('title')).toBe('Koordinatör onayında')
    expect(review.findAll('button')).toHaveLength(0)
    const late = rowsOf(page)[1]!
    expect(late.text()).toContain('Alt görev 2/4')
    expect(late.text()).toContain('9 gün geç')
    expect(late.find('[data-design-stub="BE-005"]').exists()).toBe(true)
    // Kanıt cümlesi yalnız o alan true olan görev kuyrukta varken.
    expect(page.wrapper.find('[data-testid="u1-queue-evidence"]').exists()).toBe(true)
    // Satır eylemleri durumdan.
    const actions = (r: ReturnType<typeof rowsOf>[number]) =>
      r.findAll('[data-action]').map((b) => b.attributes('data-action'))
    expect(actions(rowsOf(page)[0]!)).toEqual(['restart'])
    expect(actions(late)).toEqual(['evidence', 'complete'])
    expect(actions(rowsOf(page)[3]!)).toEqual(['start'])
  })

  it('E-Ü1-12/14/15: "Tekrar başla" own-status; "Göreve başla" ve "Tamamlandı bildir" transitions', async () => {
    const calls: string[] = []
    server.use(
      http.patch(`${ORIGIN}/v1/work-items/:id/own-status`, async ({ request, params }) => {
        calls.push(`own:${String(params.id)}:${JSON.stringify(await request.json())}`)
        return json({
          work_item_id: params.id,
          from: 'iade_edildi',
          to: 'devam_ediyor',
          actor: 'uye',
        })
      }),
      http.post(`${ORIGIN}/v1/work-items/:id/transitions`, async ({ request, params }) => {
        calls.push(`tr:${String(params.id)}:${JSON.stringify(await request.json())}`)
        return json({ work_item_id: params.id, from: 'x', to: 'y', actor: 'uye' })
      }),
      ...handlers(),
    )
    const page = await mountRole(MemberHomePage, MEMBER_SCOPE)
    await ready(page)
    await rowsOf(page)[0]!.get('[data-action="restart"]').trigger('click')
    await vi.waitFor(() => expect(calls).toHaveLength(1))
    await rowsOf(page)[3]!.get('[data-action="start"]').trigger('click')
    await vi.waitFor(() => expect(calls).toHaveLength(2))
    await rowsOf(page)[1]!.get('[data-action="complete"]').trigger('click')
    await vi.waitFor(() => expect(calls).toHaveLength(3))
    expect(calls).toEqual([
      `own:${ITEMS[1]!.work_item_id}:{"to":"devam_ediyor"}`,
      `tr:${ITEMS[2]!.work_item_id}:{"to":"devam_ediyor"}`,
      `tr:${ITEMS[4]!.work_item_id}:{"to":"onaya_sunuldu"}`,
    ])
  })

  it('work.attachment_required: kanıt yükleme penceresi açılır, görev sabit', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items/:id/transitions`, () =>
        json(
          {
            code: 'work.attachment_required',
            message: 'sunucu iletisi',
            request_id: 'r',
            fields: [],
          },
          422,
        ),
      ),
      ...handlers(),
    )
    const page = await mountRole(MemberHomePage, MEMBER_SCOPE)
    await ready(page)
    await rowsOf(page)[1]!.get('[data-action="complete"]').trigger('click')
    const select = await vi.waitFor(() => {
      const el = document.body.querySelector<HTMLSelectElement>('[data-testid="u1-upload-task"]')
      expect(el).not.toBeNull()
      return el!
    })
    expect(select.value).toBe(ITEMS[4]!.work_item_id)
    expect(select.disabled).toBe(true)
    expect(useToast().current.value?.message).toBe('Önce kanıt dosyası yükleyin')
  })

  it('E-Ü1-03/19: "Kanıt yükle" — görev, etiket ve dosya zorunlu; multipart gönderilir', async () => {
    const uploads: string[] = []
    server.use(
      http.post(`${ORIGIN}/v1/work-items/:id/files`, ({ request, params }) => {
        uploads.push(`${String(params.id)}?${new URL(request.url).searchParams.get('tag')}`)
        return json({ file_id: 'f1' }, 201)
      }),
      ...handlers(),
    )
    const page = await mountRole(MemberHomePage, MEMBER_SCOPE)
    await ready(page)
    await page.wrapper.get('[data-testid="u1-upload"]').trigger('click')
    const body = () => document.body
    await vi.waitFor(() =>
      expect(body().querySelector('[data-testid="u1-upload-submit"]')).not.toBeNull(),
    )
    ;(body().querySelector('[data-testid="u1-upload-submit"]') as HTMLButtonElement).click()
    await vi.waitFor(() => expect(body().textContent).toContain('Zorunlu alan'))
    expect(uploads).toHaveLength(0)
    const set = (testid: string, value: string) => {
      const el = body().querySelector<HTMLSelectElement>(`[data-testid="${testid}"]`)!
      el.value = value
      el.dispatchEvent(new Event('change'))
    }
    set('u1-upload-task', ITEMS[0]!.work_item_id)
    set('u1-upload-tag', 'cikti')
    const input = body().querySelector<HTMLInputElement>('[data-testid="u1-upload-file"]')!
    Object.defineProperty(input, 'files', {
      value: [new File(['abc'], 'kanit.pdf', { type: 'application/pdf' })],
      configurable: true,
    })
    input.dispatchEvent(new Event('change'))
    ;(body().querySelector('[data-testid="u1-upload-submit"]') as HTMLButtonElement).click()
    await vi.waitFor(() =>
      expect(uploads, body().textContent ?? '').toEqual([`${ITEMS[0]!.work_item_id}?cikti`]),
    )
    await vi.waitFor(() => expect(useToast().current.value?.message).toBe('Dosya yüklendi'))
  })

  it('E-Ü1-20: "Not yaz" — görev seçici + not; addWorkItemNote', async () => {
    const notes: unknown[] = []
    server.use(
      http.post(`${ORIGIN}/v1/work-items/:id/notes`, async ({ request, params }) => {
        notes.push([params.id, await request.json()])
        return json({ note_id: 'n1' }, 201)
      }),
      ...handlers(),
    )
    const page = await mountRole(MemberHomePage, MEMBER_SCOPE)
    await ready(page)
    await page.wrapper.get('[data-quick="note"]').trigger('click')
    const body = () => document.body
    await vi.waitFor(() =>
      expect(body().querySelector('[data-testid="u1-note-input"]')).not.toBeNull(),
    )
    const select = body().querySelector<HTMLSelectElement>('[data-testid="u1-note-task"]')!
    select.value = ITEMS[0]!.work_item_id
    select.dispatchEvent(new Event('change'))
    const text = body().querySelector<HTMLTextAreaElement>('[data-testid="u1-note-input"]')!
    text.value = '  İlerleme var  '
    text.dispatchEvent(new Event('input'))
    ;(body().querySelector('[data-testid="u1-note-submit"]') as HTMLButtonElement).click()
    await vi.waitFor(() => expect(notes).toHaveLength(1))
    expect(notes[0]).toEqual([ITEMS[0]!.work_item_id, { content: 'İlerleme var' }])
  })

  it('E-Ü1-21…24: koordinatöre yaz devre dışı; toplantı notu 09b’ye; bildirim sayacı canlı, liste yok', async () => {
    server.use(...handlers())
    const page = await mountRole(MemberHomePage, MEMBER_SCOPE)
    await ready(page)
    expect(page.wrapper.get('[data-quick="message"]').attributes('aria-disabled')).toBe('true')
    await vi.waitFor(() =>
      expect(page.wrapper.get('[data-quick="meetingNote"]').attributes('href')).toBe(
        '/toplantilar/m9',
      ),
    )
    expect(page.wrapper.get('[data-quick="meetingNote"]').text()).toContain(
      'Hidrofor teslim kontrolü',
    )
    await vi.waitFor(() => expect(region(page, 'notifications').text()).toContain('3 yeni'))
    expect(region(page, 'notifications').text()).toContain('Henüz bildirim yok')
    expect(page.wrapper.get('[data-testid="u1-notif-all"]').attributes('aria-disabled')).toBe(
      'true',
    )
    expect(page.wrapper.text()).not.toContain('Rapor')
    expect(page.wrapper.text()).not.toContain('90 MB')
  })

  it('E-Ü1-25…27: takvim — ay gezinmesi ağsız, lejant, hücre etiketleri', async () => {
    server.use(...handlers())
    const page = await mountRole(MemberHomePage, MEMBER_SCOPE)
    await ready(page)
    const before = requestsCount()
    const title = () => page.wrapper.get('[data-testid="u1-cal-title"]').text()
    const first = title()
    await page.wrapper.get('[data-action="next"]').trigger('click')
    expect(title()).not.toBe(first)
    await page.wrapper.get('[data-action="prev"]').trigger('click')
    expect(title()).toBe(first)
    expect(requestsCount()).toBe(before)
    expect(page.wrapper.get('[data-testid="u1-cal-legend"]').text()).toBe(
      'Geciken (1)   Yaklaşan (4)'.replace(/ {3}/g, ' '),
    )
    expect(region(page, 'calendar').find('[data-today="true"]').attributes('aria-label')).toContain(
      ', bugün',
    )
  })

  it('E-Ü1-28…32: toplantılar, koordinatörlüklerim (birim kırılımı, koordinatör adı yok)', async () => {
    server.use(...handlers())
    const page = await mountRole(MemberHomePage, MEMBER_SCOPE)
    await ready(page)
    await vi.waitFor(() => expect(region(page, 'meetings').findAll('[data-row]')).toHaveLength(1))
    expect(sent('/v1/meetings')[0]!.query.has('department_id')).toBe(false)
    const units = region(page, 'units').findAll('[data-row]')
    expect(units).toHaveLength(2)
    expect(units[0]!.text()).toContain('Birim d1')
    expect(units[0]!.text()).toContain('4 görev')
    expect(units[0]!.text()).toContain('1 gecikmiş')
    expect(units[1]!.text()).toContain('1 görev')
    expect(region(page, 'units').text()).not.toContain('Koordinatör:')
    expect(region(page, 'units').text()).toContain('Koordinatörlük atamalarını yönetici yapar.')
  })

  it('boş küme ve hata: nötr metin; yazı yetkisiz (yönetici dışı) eylemler yalnız olguyla', async () => {
    server.use(...standingHandlers(MEMBER), ...roleHandlers())
    const page = await mountRole(MemberHomePage, MEMBER_SCOPE)
    await vi.waitFor(() => expect(region(page, 'queue').text()).toContain('Bugün için görev yok'))
    expect(page.wrapper.find('[data-testid="u1-upload"]').exists()).toBe(false)
    expect(page.wrapper.find('[data-quick="upload"]').exists()).toBe(false)
    expect(region(page, 'units').findAll('[data-row]')).toHaveLength(2)
    expect(page.wrapper.get('[data-cell="overdue"]').text()).toContain('Açık görevin yok')
  })

  it('bölge hatası: liste 500 → kuyruk hatalı, kartlar sağlam', async () => {
    server.use(
      http.get(`${ORIGIN}${LIST}`, () =>
        json({ code: 'platform.internal', message: 'x', request_id: 'r', fields: [] }, 500),
      ),
      ...handlers(),
    )
    const page = await mountRole(MemberHomePage, MEMBER_SCOPE)
    await vi.waitFor(() => expect(region(page, 'queue').find('[role="alert"]').exists()).toBe(true))
    expect(page.wrapper.get('[data-cell="open"] [data-value]').text()).toBe('5')
  })

  it('kapsam eksik: seçim notu, kapsamlı istek yok', async () => {
    server.use(...standingHandlers(MEMBER), ...roleHandlers())
    const page = await mountRole(MemberHomePage, {
      programId: null,
      lens: 'member',
      departmentId: null,
    })
    expect(page.wrapper.get('[data-testid="role-select"]').text()).toContain('Kapsam seçin')
    expect(sent(LIST)).toHaveLength(0)
  })
})

function requestsCount(): number {
  return sent(LIST).length + sent(COUNTS).length + sent('/v1/meetings').length
}
