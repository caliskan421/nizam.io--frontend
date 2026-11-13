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

  it('pencere: hepsi seçili açılır, kilitli kapak devre dışı, çipler devre dışı, sayı canlı', async () => {
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
    expect(chips.every((c) => c.disabled)).toBe(true)
    expect(dialog()?.textContent).not.toMatch(/sayfa/)
    expect(document.querySelector('[data-action="confirm"]')?.hasAttribute('disabled')).toBe(false)
  })

  it('bir kutu kaldırılınca "Seçilenleri indir" devre dışı + açıklama; istek yok', async () => {
    await admin()
    trigger().click()
    await vi.waitFor(() => expect(dialog()).not.toBeNull())
    sectionBox('meetings').click()
    await vi.waitFor(() =>
      expect(document.querySelector('[data-action="confirm"]')?.hasAttribute('disabled')).toBe(
        true,
      ),
    )
    expect(document.querySelector('[data-design-stub="BE-122"]')).not.toBeNull()
    expect(document.querySelector('.report-picker__hint')?.textContent).toContain(
      'yalnız tam rapor',
    )
    expect(sectionBox('departments').getAttribute('aria-checked')).toBe('mixed')
    ;(document.querySelector('[data-action="confirm"]') as HTMLButtonElement).click()
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(0)
  })

  it('hepsi seçiliyken "Seçilenleri indir": pencere kapanır, ana düğme indirir, odak tetikleyicide', async () => {
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
