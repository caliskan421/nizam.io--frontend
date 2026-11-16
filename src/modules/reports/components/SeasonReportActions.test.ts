import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { useToast } from '@/shared/ui'

import { mountWith, unmountAll } from '../__tests__/mount'
import {
  browserSave,
  http,
  json,
  ORIGIN,
  pdf,
  resetHarness,
  sent,
  server,
  standing,
  ticketOk,
} from '../__tests__/harness'
import { reportGate } from '../model/gate'
import SeasonReportActions from './SeasonReportActions.vue'

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

const DEPARTMENTS = http.get(`${ORIGIN}/v1/program/departments`, () =>
  json({
    departments: [
      { department_id: 'd1', display_name: 'Altyapı ve tesisat', code: 'ALT' },
      { department_id: 'd2', display_name: 'Operasyon' },
    ],
  }),
)

async function admin() {
  server.use(...standing({ admin: true }), DEPARTMENTS)
  const mounted = await mountWith(SeasonReportActions)
  await vi.waitFor(() =>
    expect(mounted.wrapper.find('[data-testid="season-actions"]').exists()).toBe(true),
  )
  return mounted
}

const trigger = () => document.querySelector<HTMLButtonElement>('[data-action="pick-sections"]')!
const dialog = () => document.querySelector('[role="dialog"]')
const sectionBox = (id: string) =>
  document.querySelector<HTMLInputElement>(`input[data-section="${id}"]`)!

describe('SeasonReportActions (E-13-01…08, 12)', () => {
  it('yönetici: PDF düğmesi + bitişik "Bölüm seç…" + "Önizle" bağlantısı (/arsiv/donem-raporu)', async () => {
    const { wrapper } = await admin()
    expect(wrapper.text()).toContain('Dönem sonu raporu (PDF)')
    expect(trigger().getAttribute('aria-label')).toBe('Bölüm seç… — varsayılan tam rapor')
    expect(wrapper.get('.report-action__row').element.contains(trigger())).toBe(true)
    const link = wrapper.get('[data-action="preview-season"]')
    expect(link.text()).toBe('Önizle')
    expect(link.attributes('href')).toBe('/arsiv/donem-raporu')
  })

  it('koordinatör ve üye hiçbir eylem görmez (olgu: şirket yöneticisi değil)', async () => {
    server.use(...standing({ rows: [['p1', 'd1', 'koordinator']] }), DEPARTMENTS)
    const { wrapper, queryClient } = await mountWith(SeasonReportActions, {
      scope: { programId: 'p1', lens: 'coordinator', departmentId: 'd1' },
    })
    await settleQueries(queryClient)
    await flushPromises()
    expect(wrapper.find('[data-testid="season-actions"]').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('PDF düğmesi tam raporu bilet akışıyla indirir (parametresiz)', async () => {
    server.use(
      ticketOk(),
      pdf({ 'Content-Disposition': 'attachment; filename="donem-raporu-2026-11-13.pdf"' }),
    )
    const { wrapper, queryClient } = await admin()
    await wrapper.get('.report-action .t-btn').trigger('click')
    await settleQueries(queryClient)
    await vi.waitFor(() => expect(saved.clicked).toEqual(['donem-raporu-2026-11-13.pdf']))
    expect(sent('POST', '/v1/download-tickets')[0]?.body).toMatchObject({
      method: 'GET',
      path: '/v1/reports/season/pdf',
    })
  })

  it('pencere: hepsi seçili açılır, kilitli kapak devre dışı, çipler etkin ("Tümü" basılı), sayı canlı', async () => {
    await admin()
    trigger().click()
    await vi.waitFor(() => expect(dialog()).not.toBeNull())
    const boxes = [...document.querySelectorAll<HTMLInputElement>('.report-picker__list input')]
    expect(boxes).toHaveLength(10)
    expect(boxes.every((b) => b.checked)).toBe(true)
    expect(boxes[0]?.disabled).toBe(true)
    expect(dialog()?.textContent).toContain('Kapak ve içindekiler')
    await vi.waitFor(() => expect(dialog()?.textContent).toContain('2 koordinatörlük'))
    const chips = [...document.querySelectorAll<HTMLButtonElement>('.report-chip')]
    expect(chips.map((c) => c.textContent?.trim())).toEqual(['Tümü', 'ALT', 'Operasyon'])
    expect(chips.every((c) => !c.disabled)).toBe(true)
    expect(chips.map((c) => c.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false'])
    expect(dialog()?.textContent).not.toMatch(/sayfa|yakında/)
    expect(document.querySelector('[data-design-stub="BE-122"]')).toBeNull()
    expect(document.querySelector('[data-action="confirm"]')?.hasAttribute('disabled')).toBe(false)
  })

  it('bir kutu kaldırılınca "Seçilenleri indir" ETKİN: bilet hedefi yalnız seçili bölümleri taşır', async () => {
    server.use(ticketOk(), pdf())
    const { queryClient } = await admin()
    trigger().click()
    await vi.waitFor(() => expect(dialog()).not.toBeNull())
    sectionBox('meetings').click()
    await vi.waitFor(() =>
      expect(sectionBox('departments').getAttribute('aria-checked')).toBe('mixed'),
    )
    const confirm = document.querySelector<HTMLButtonElement>('[data-action="confirm"]')!
    expect(confirm.disabled).toBe(false)
    expect(document.querySelector('.report-picker__hint')).toBeNull()
    confirm.click()
    await vi.waitFor(() => expect(dialog()).toBeNull())
    await settleQueries(queryClient)
    await vi.waitFor(() => expect(saved.clicked).toHaveLength(1))
    expect(sent('POST', '/v1/download-tickets')[0]?.body).toMatchObject({
      method: 'GET',
      path: '/v1/reports/season/pdf?sections=summary,gantt,general,tasks,details,files,appendix',
    })
  })

  it('hiçbir bölüm seçili değilken gönderme engellenir (sunucu boş seçimi "hepsi" sayar)', async () => {
    await admin()
    trigger().click()
    await vi.waitFor(() => expect(dialog()).not.toBeNull())
    for (const id of ['summary', 'gantt', 'general', 'departments', 'appendix'])
      sectionBox(id).click()
    const confirm = document.querySelector<HTMLButtonElement>('[data-action="confirm"]')!
    await vi.waitFor(() => expect(confirm.disabled).toBe(true))
    expect(document.querySelector('.report-picker__hint')?.textContent).toContain('En az bir bölüm')
    confirm.click()
    expect(dialog()).not.toBeNull()
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(0)
    sectionBox('gantt').click()
    await vi.waitFor(() => expect(confirm.disabled).toBe(false))
  })

  it('koordinatörlük çipleri: Tümü açıkken çip daraltır, ekler/çıkarır, son çip çıkınca Tümü; department_ids programdaki sırayla', async () => {
    server.use(ticketOk(), pdf())
    const { queryClient } = await admin()
    trigger().click()
    await vi.waitFor(() => expect(dialog()?.textContent).toContain('2 koordinatörlük'))
    const chip = (id: string) =>
      document.querySelector<HTMLButtonElement>(`.report-chip[data-chip="${id}"]`)!
    const pressed = () => ['all', 'd1', 'd2'].map((id) => chip(id).getAttribute('aria-pressed'))
    chip('d2').click()
    await vi.waitFor(() => expect(pressed()).toEqual(['false', 'false', 'true']))
    expect(dialog()?.textContent).toContain('1 koordinatörlük')
    chip('d1').click()
    await vi.waitFor(() => expect(pressed()).toEqual(['false', 'true', 'true']))
    chip('d1').click()
    chip('d2').click()
    await vi.waitFor(() => expect(pressed()).toEqual(['true', 'false', 'false']))
    chip('d2').click()
    chip('d1').click()
    await vi.waitFor(() => expect(pressed()).toEqual(['false', 'true', 'true']))
    document.querySelector<HTMLButtonElement>('[data-action="confirm"]')!.click()
    await vi.waitFor(() => expect(dialog()).toBeNull())
    await settleQueries(queryClient)
    await vi.waitFor(() => expect(saved.clicked).toHaveLength(1))
    // Hepsi seçili bölüm + iki koordinatörlük = daraltma değil ama süzgeç açıkça seçildi: kimlikler gider.
    expect(sent('POST', '/v1/download-tickets')[0]?.body).toMatchObject({
      path: '/v1/reports/season/pdf?department_ids=d1,d2',
    })
  })

  it('bölüm + koordinatörlük birlikte: iki parametre', async () => {
    server.use(ticketOk(), pdf())
    const { queryClient } = await admin()
    trigger().click()
    await vi.waitFor(() => expect(dialog()?.textContent).toContain('2 koordinatörlük'))
    sectionBox('appendix').click()
    document.querySelector<HTMLButtonElement>('.report-chip[data-chip="d1"]')!.click()
    document.querySelector<HTMLButtonElement>('[data-action="confirm"]')!.click()
    await vi.waitFor(() => expect(dialog()).toBeNull())
    await settleQueries(queryClient)
    await vi.waitFor(() => expect(saved.clicked).toHaveLength(1))
    expect(sent('POST', '/v1/download-tickets')[0]?.body).toMatchObject({
      path: '/v1/reports/season/pdf?sections=summary,gantt,general,tasks,details,meetings,files&department_ids=d1',
    })
  })

  it('hepsi seçiliyken "Seçilenleri indir": parametresiz tam rapor; pencere kapanır, ana düğme indirir, odak tetikleyicide', async () => {
    server.use(ticketOk(), pdf())
    const { wrapper, queryClient } = await admin()
    trigger().focus()
    trigger().click()
    await vi.waitFor(() => expect(dialog()).not.toBeNull())
    ;(document.querySelector('[data-action="confirm"]') as HTMLButtonElement).click()
    await vi.waitFor(() => expect(dialog()).toBeNull())
    await settleQueries(queryClient)
    await vi.waitFor(() => expect(saved.clicked).toHaveLength(1))
    expect(sent('POST', '/v1/download-tickets')[0]?.body).toMatchObject({
      path: '/v1/reports/season/pdf',
    })
    expect(wrapper.get('[data-testid="report-card"]').text()).toContain('indirildi')
    expect(document.activeElement).toBe(trigger())
  })

  it.each([
    [
      'Esc',
      () =>
        dialog()!.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
        ),
    ],
    ['✕', () => document.querySelector<HTMLButtonElement>('.t-modal__head .t-iconbtn')!.click()],
    ['Vazgeç', () => document.querySelector<HTMLButtonElement>('[data-action="cancel"]')!.click()],
  ])('kapanış yolu %s: odak "Bölüm seç…" düğmesine döner, gövdeye düşmez', async (_name, close) => {
    await admin()
    trigger().focus()
    trigger().click()
    await vi.waitFor(() => expect(dialog()).not.toBeNull())
    close()
    await vi.waitFor(() => expect(dialog()).toBeNull())
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger()))
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(0)
  })

  it('pencere her açılışta yeniden hepsi seçili (seçim hatırlanmaz)', async () => {
    await admin()
    trigger().click()
    await vi.waitFor(() => expect(dialog()).not.toBeNull())
    sectionBox('gantt').click()
    document.querySelector<HTMLButtonElement>('[data-action="cancel"]')!.click()
    await vi.waitFor(() => expect(dialog()).toBeNull())
    trigger().click()
    await vi.waitFor(() => expect(dialog()).not.toBeNull())
    expect(sectionBox('gantt').checked).toBe(true)
  })
})
