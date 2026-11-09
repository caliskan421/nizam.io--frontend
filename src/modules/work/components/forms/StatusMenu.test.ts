import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import {
  COORD_SCOPE,
  errorEnvelope,
  http,
  json,
  ORIGIN,
  sent,
  server,
  workItem,
} from '../../model/__tests__/harness'
import type { WorkItemStatus } from '../../model/types'
import { $, formsHarness, ME, resetForms, type WhoSeed } from './__tests__/forms-harness'
import StatusMenu from './StatusMenu.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetForms())
afterAll(() => server.close())

const PATH = '/v1/work-items/w1/transitions'
const COORD: WhoSeed = { rows: [{ departmentId: 'd2', role: 'koordinator' }] }

function render(status: WorkItemStatus, who: WhoSeed = COORD, assigned = false) {
  const h = formsHarness(COORD_SCOPE, who)
  const item = workItem({ status, assignee_account_ids: assigned ? [ME] : ['acc-1'] })
  return { h, wrapper: h.mount(StatusMenu, { item }) }
}

const menuItems = () =>
  [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')].map((el) =>
    el.getAttribute('data-to'),
  )

describe('StatusMenu (E-03-44 → E-03-58)', () => {
  it('yönetici tek başına: salt okunur durum etiketi, düğme yok', () => {
    render('devam_ediyor', { companyAdmin: true })
    expect($('[data-testid="wf-status-label"]')?.textContent?.trim()).toBe('Devam ediyor')
    expect($('[data-testid="wf-status-trigger"]')).toBeNull()
    expect($('.rp-dot--doing')).not.toBeNull()
  })

  it('üye için hedefsiz durum (onaya_sunuldu) salt okunur', () => {
    render('onaya_sunuldu', { rows: [{ departmentId: 'd2', role: 'uye' }] }, true)
    expect($('[data-testid="wf-status-label"]')?.textContent?.trim()).toBe('Onay bekliyor')
  })

  it('koordinatör: tasarım seçicisi; menü yalnız matris hedefleri', async () => {
    render('iade_edildi')
    const trigger = $('[data-testid="wf-status-trigger"]')!
    expect(trigger.className).toContain('rp-selbtn')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    trigger.click()
    await nextTick()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(menuItems()).toEqual(['baslanmadi', 'devam_ediyor', 'tamamlandi'])
    expect(document.activeElement?.getAttribute('data-to')).toBe('baslanmadi')
  })

  it('hedef seçimi → geçiş isteği → transitioned; menü kapanır', async () => {
    server.use(
      http.post(`${ORIGIN}${PATH}`, () =>
        json({ work_item_id: 'w1', from: 'devam_ediyor', to: 'tamamlandi', actor: 'koordinator' }),
      ),
    )
    const { wrapper } = render('devam_ediyor')
    $('[data-testid="wf-status-trigger"]')!.click()
    await nextTick()
    $('[data-to="tamamlandi"]')!.click()
    await vi.waitFor(() => expect(wrapper.emitted('transitioned')).toHaveLength(1))
    expect(sent('POST', PATH)[0]!.body).toEqual({ to: 'tamamlandi' })
    expect(menuItems()).toEqual([])
  })

  it('geri alma: gerekçe penceresi → gerekçeli istek', async () => {
    server.use(
      http.post(`${ORIGIN}${PATH}`, () =>
        json({ work_item_id: 'w1', from: 'tamamlandi', to: 'devam_ediyor', actor: 'koordinator' }),
      ),
    )
    const { wrapper } = render('tamamlandi')
    $('[data-testid="wf-status-trigger"]')!.click()
    await nextTick()
    $('[data-to="devam_ediyor"]')!.click()
    await nextTick()
    expect(sent('POST', PATH)).toHaveLength(0)
    const reason = $('[name="reason"]') as HTMLInputElement
    reason.value = 'yanlış onay'
    reason.dispatchEvent(new Event('input'))
    $('[data-testid="wf-revert-submit"]')!.click()
    await vi.waitFor(() => expect(wrapper.emitted('transitioned')).toHaveLength(1))
    expect(sent('POST', PATH)[0]!.body).toEqual({ to: 'devam_ediyor', reason: 'yanlış onay' })
    await nextTick()
    expect($('[name="reason"]')).toBeNull()
  })

  it('422 work.attachment_required → requestEvidence', async () => {
    server.use(http.post(`${ORIGIN}${PATH}`, () => errorEnvelope('work.attachment_required', 422)))
    const { wrapper } = render('devam_ediyor', COORD, true)
    $('[data-testid="wf-status-trigger"]')!.click()
    await nextTick()
    $('[data-to="onaya_sunuldu"]')!.click()
    await vi.waitFor(() => expect(wrapper.emitted('requestEvidence')).toHaveLength(1))
    expect(wrapper.emitted('transitioned')).toBeUndefined()
  })

  it('Esc ve dışarı tıklama menüyü kapatır; Esc odağı tetiğe döndürür', async () => {
    render('devam_ediyor')
    const trigger = $('[data-testid="wf-status-trigger"]')!
    trigger.click()
    await nextTick()
    $('[role="menu"]')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await nextTick()
    await nextTick()
    expect(menuItems()).toEqual([])
    expect(document.activeElement).toBe(trigger)

    trigger.click()
    await nextTick()
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await nextTick()
    expect(menuItems()).toEqual([])
  })
})
