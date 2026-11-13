// 05 iş yükü raporu (E-13-59…62): başlık düğmesi, satır başı seçim, seçim çubuğu, indirme ve 422
// yolu — GERÇEK `UsersPage` + GERÇEK `ReportActionButton` (komşu bileşen taslağı yok); yalnız W74
// formları sayfada kullanılmadığından taslaklanmaz (diyaloglar kapalı kalır).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { browserSave, pdf, ticketOk } from '@/shared/download/__tests__/harness'
import { settleQueries } from '@/shared/http/__tests__/settle'
import { useToast } from '@/shared/ui'

import { errorEnvelope, http, ORIGIN, resetHarness, sent, server } from '../__tests__/harness'
import {
  baseHandlers,
  mountWith,
  settle,
  unmountAll,
  usersHandler,
} from '../components/users/__tests__/users-harness'
import UsersPage from './UsersPage.vue'
import { reportGate } from '@/modules/reports/public'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

let saved: ReturnType<typeof browserSave>
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  saved = browserSave()
  useToast().clear()
})
afterEach(() => {
  unmountAll()
  reportGate.reset()
  resetHarness()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

const WORKLOAD = (ids: string[]) => ({
  method: 'POST',
  path: '/v1/reports/workload',
  body: { member_ids: ids },
})
const NON_ADMIN = {
  accountId: 'me',
  companyAdmin: false,
  rows: [{ department_id: 'd1', role: 'koordinator' }],
}

async function mountPage(fixture?: typeof NON_ADMIN, selection?: Parameters<typeof mountWith>[2]) {
  server.use(...baseHandlers(fixture), usersHandler())
  const mounted = await mountWith(UsersPage, {}, selection)
  await vi.waitFor(() => expect(mounted.wrapper.findAll('[data-account]').length).toBe(3))
  return mounted
}

type Wrapper = Awaited<ReturnType<typeof mountPage>>['wrapper']
const pick = (w: Wrapper, id: string) => w.get(`[data-account="${id}"] [data-testid="user-pick"]`)
const button = (w: Wrapper) => w.get('[data-testid="users-workload"] button')

describe('05 iş yükü raporu — görünürlük (E-13-59, 60)', () => {
  it('ŞY: başlıkta "İş yükü raporu (PDF)" (seçim yokken sayı yok), Tümünü seç + satır kutuları (aria-label kişi adıyla)', async () => {
    const { wrapper } = await mountPage()
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="users-workload"]').exists()).toBe(true),
    )
    expect(button(wrapper).text()).toBe('İş yükü raporu (PDF)')
    expect(wrapper.get('[data-testid="users-pick-all"]').attributes('aria-label')).toBe(
      'Tümünü seç',
    )
    expect(pick(wrapper, 'u1').attributes('aria-label')).toBe('Ayşe Demir rapora ekle')
    expect(wrapper.findAll('[data-testid="user-pick"]')).toHaveLength(3)
    expect(wrapper.find('[data-testid="users-selbar"]').exists()).toBe(false)
  })

  it('ŞY olmayan (koordinatör) hesapta düğme ve kutular çizilmez (üye rapor görmez)', async () => {
    const { wrapper, queryClient } = await mountPage(NON_ADMIN)
    await settleQueries(queryClient)
    await settle()
    expect(wrapper.find('[data-testid="users-workload"]').exists()).toBe(false)
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(0)
  })

  it('program seçili değil: düğme devre dışı + gerekçe, istek yok', async () => {
    server.use(...baseHandlers(), usersHandler())
    const { wrapper } = await mountWith(
      UsersPage,
      {},
      { selection: { programId: null, lens: 'admin', departmentId: null } },
    )
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="users-workload"]').exists()).toBe(true),
    )
    expect(button(wrapper).attributes('disabled')).toBeDefined()
    expect(button(wrapper).attributes('title')).toBe('Önce bir program seçin.')
    await button(wrapper).trigger('click')
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(0)
  })
})

describe('05 iş yükü raporu — seçim (E-13-60…62)', () => {
  it('seçilemeyen satır (program iş yükünde değil): devre dışı kutu + ipucu; Tümünü seç onu atlar', async () => {
    const { wrapper } = await mountPage()
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="users-pick-all"]').exists()).toBe(true),
    )
    const u3 = pick(wrapper, 'u3')
    expect(u3.attributes('disabled')).toBeDefined()
    expect(u3.attributes('title')).toBe('Bu hesap seçili programın iş yükünde değil.')
    expect(pick(wrapper, 'u1').attributes('disabled')).toBeUndefined()

    await wrapper.get('[data-testid="users-pick-all"]').setValue(true)
    expect(wrapper.get('[data-testid="users-selcount"]').text()).toBe('2 üye seçili')
    expect((pick(wrapper, 'u3').element as HTMLInputElement).checked).toBe(false)
    expect(button(wrapper).text()).toBe('Seçilenlerin iş yükü (PDF) · 2')
    // İkinci basış hepsini kaldırır.
    await wrapper.get('[data-testid="users-pick-all"]').setValue(false)
    expect(wrapper.find('[data-testid="users-selbar"]').exists()).toBe(false)
    expect(button(wrapper).text()).toBe('İş yükü raporu (PDF)')
  })

  it('kutuya tıklamak yan paneli açmaz; seçili satır vurgulanır', async () => {
    const { wrapper, router } = await mountPage()
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="users-pick-all"]').exists()).toBe(true),
    )
    await pick(wrapper, 'u1').setValue(true)
    expect(router.currentRoute.value.query.secili).toBeUndefined()
    expect(wrapper.find('.rp-aside').exists()).toBe(false)
    expect(wrapper.get('[data-account="u1"]').classes()).toContain('rp-sel')
    expect(wrapper.get('[data-account="u2"]').classes()).not.toContain('rp-sel')
  })

  it('seçim süzgeç/sekme değişiminde korunur; "Seçimi temizle" temizler ve odak Tümünü seç kutusuna döner', async () => {
    const { wrapper } = await mountPage()
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="users-pick-all"]').exists()).toBe(true),
    )
    await pick(wrapper, 'u1').setValue(true)
    await wrapper.findAll('.rp-seg button')[2]!.trigger('click')
    await settle()
    expect(wrapper.get('[data-testid="users-selcount"]').text()).toBe('1 üye seçili')
    expect(button(wrapper).text()).toBe('Seçilenlerin iş yükü (PDF) · 1')

    await wrapper.get('[data-testid="users-selclear"]').trigger('click')
    expect(wrapper.find('[data-testid="users-selbar"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get('[data-testid="users-pick-all"]').element)
  })

  it('program değişince seçim temizlenir', async () => {
    const { wrapper, store } = await mountPage()
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="users-pick-all"]').exists()).toBe(true),
    )
    await pick(wrapper, 'u1').setValue(true)
    store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await settle()
    expect(wrapper.find('[data-testid="users-selbar"]').exists()).toBe(false)
  })
})

describe('05 iş yükü raporu — indirme (E-13-59, 62)', () => {
  it('seçim yokken bilet gövdesi member_ids: [] (bütün üyeler); dosya adıyla bildirim', async () => {
    server.use(
      ticketOk(),
      pdf({ 'Content-Disposition': 'attachment; filename="is-yuku-raporu-2026-11-13.pdf"' }),
    )
    const { wrapper, queryClient } = await mountPage()
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="users-workload"]').exists()).toBe(true),
    )
    await button(wrapper).trigger('click')
    await settleQueries(queryClient)
    await vi.waitFor(() => expect(saved.clicked).toEqual(['is-yuku-raporu-2026-11-13.pdf']))
    expect(sent('POST', '/v1/download-tickets').map((r) => r.body)).toEqual([WORKLOAD([])])
    expect(useToast().current.value?.message).toContain('is-yuku-raporu-2026-11-13.pdf')
  })

  it('seçim varken bilet gövdesi seçilen kimlikler', async () => {
    server.use(ticketOk(), pdf())
    const { wrapper, queryClient } = await mountPage()
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="users-pick-all"]').exists()).toBe(true),
    )
    await pick(wrapper, 'u2').setValue(true)
    await pick(wrapper, 'u1').setValue(true)
    await button(wrapper).trigger('click')
    await settleQueries(queryClient)
    await vi.waitFor(() => expect(sent('POST', '/v1/download-tickets')).toHaveLength(1))
    expect(sent('POST', '/v1/download-tickets')[0]!.body).toEqual(WORKLOAD(['u2', 'u1']))
  })

  it('422 reporting.input_invalid: seçim yenilenir (temizlenir), bildirim, otomatik tekrar yok', async () => {
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () => errorEnvelope('reporting.input_invalid', 422)),
    )
    const { wrapper, queryClient } = await mountPage()
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="users-pick-all"]').exists()).toBe(true),
    )
    await pick(wrapper, 'u1').setValue(true)
    await button(wrapper).trigger('click')
    await settleQueries(queryClient)
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="users-selbar"]').exists()).toBe(false),
    )
    expect(useToast().current.value?.message).toBe('Seçim güncellendi, yeniden deneyin.')
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(1)
    expect(saved.clicked).toEqual([])
  })

  it('429 export_in_progress: seçim korunur (yalnız 422 temizler)', async () => {
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () =>
        errorEnvelope('reporting.export_in_progress', 429),
      ),
    )
    const { wrapper, queryClient } = await mountPage()
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="users-pick-all"]').exists()).toBe(true),
    )
    await pick(wrapper, 'u1').setValue(true)
    await button(wrapper).trigger('click')
    await settleQueries(queryClient)
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(wrapper.get('[data-testid="users-selcount"]').text()).toBe('1 üye seçili')
  })
})
