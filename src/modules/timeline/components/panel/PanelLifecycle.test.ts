// KESİN 27: panel kapanış yolları (✕, Esc, eylem sonrası söküm) ve odak/ARIA dönüşü.
import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { settleQueries } from '@/shared/http/__tests__/settle'

import {
  ADMIN_SCOPE,
  ganttTask,
  http,
  json,
  ORIGIN,
  server,
  workItem,
} from '../../__tests__/harness'
import { $, panelHarness, resetPanel } from './__tests__/panel-harness'
import SelectedTaskPanel from './SelectedTaskPanel.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetPanel)
afterAll(() => server.close())

/** Gantt çubuğunu taklit eden, panel açılırken odakta olan öğe. */
function openerBar(): HTMLElement {
  const bar = document.createElement('button')
  bar.setAttribute('data-testid', 'bar')
  document.body.append(bar)
  bar.focus()
  return bar
}

async function render() {
  server.use(
    http.get(`${ORIGIN}/v1/work-items/w1`, () => json(workItem())),
    http.get(`${ORIGIN}/v1/work-items/w1/files`, () => json({ files: [] })),
  )
  const bar = openerBar()
  const h = panelHarness(ADMIN_SCOPE, { companyAdmin: true })
  const wrapper = h.mount(SelectedTaskPanel, {
    task: ganttTask(),
    face: 'admin',
    departmentName: 'Altyapı',
  })
  await settleQueries(h.queryClient)
  return { h, wrapper, bar }
}

const esc = (target: EventTarget = document.body) =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
  )

describe('kapat + Esc + odak dönüşü (E-03C-57)', () => {
  it('✕ close yayar; üst bileşen sökünce odak çubuğa döner', async () => {
    const { wrapper, bar } = await render()
    ;($('[data-testid="tp-close"]') as HTMLElement).focus()
    $('[data-testid="tp-close"]')!.click()
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
    expect(document.activeElement).toBe(bar)
  })

  it('Esc (belgede) close yayar; söküm sonrası odak çubukta', async () => {
    const { wrapper, bar } = await render()
    ;($('[data-testid="tp-start"]') as HTMLElement).focus()
    esc($('[data-testid="tp-start"]')!)
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
    expect(document.activeElement).toBe(bar)
  })

  it('odak zaten başka yerdeyse (çubuk dışı, panel dışı) sökümde çalınmaz', async () => {
    const { wrapper } = await render()
    const other = document.createElement('input')
    document.body.append(other)
    other.focus()
    wrapper.unmount()
    expect(document.activeElement).toBe(other)
  })

  it('odak gövdeye düşmüşse söküm çubuğa döndürür', async () => {
    const { wrapper, bar } = await render()
    ;(document.activeElement as HTMLElement).blur()
    wrapper.unmount()
    expect(document.activeElement).toBe(bar)
  })

  it('Esc zaten tüketildiyse (menü/pencere) panel kapanmaz', async () => {
    const { wrapper } = await render()
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    event.preventDefault()
    document.body.dispatchEvent(event)
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('"Liste görünümünde aç" görev kimliğiyle yayılır (başlıkta ve menüde)', async () => {
    const { wrapper } = await render()
    $('[data-testid="tp-open-list"]')!.click()
    $('[data-testid="tp-more"]')!.click()
    await flushPromises()
    ;($('[data-action="openInList"]') as HTMLElement).click()
    await flushPromises()
    expect(wrapper.emitted('openInList')).toEqual([['w1'], ['w1']])
  })

  it('söküm sonrası belge dinleyicisi kalmaz: Esc artık close üretmez', async () => {
    const { wrapper } = await render()
    wrapper.unmount()
    esc()
    expect(wrapper.emitted('close')).toBeUndefined()
  })
})

describe('"Diğer işlemler" menüsü — odak ve ARIA (KESİN 27)', () => {
  it('menü açılır (aria-expanded), Esc kapatır ve odak tetikleyiciye döner; panel kapanmaz', async () => {
    const { wrapper } = await render()
    const more = $('[data-testid="tp-more"]') as HTMLButtonElement
    expect(more.getAttribute('aria-expanded')).toBe('false')
    more.click()
    await flushPromises()
    expect(more.getAttribute('aria-expanded')).toBe('true')
    const menu = $('[role="menu"]')!
    expect(menu.getAttribute('aria-label')).toBe('Görev işlemleri')
    esc(menu.querySelector('[role="menuitem"]')!)
    await flushPromises()
    expect($('[role="menu"]')).toBeNull()
    expect(more.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(more)
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('bir işlem seçilince menü kapanır, odak tetikleyiciye döner, pencere açılır; pencere Esc ile kapanınca odak yine tetikleyicide', async () => {
    const { h } = await render()
    server.use(
      http.get(`${ORIGIN}/v1/work-items/w1/dependencies`, () =>
        json({ dependencies: [], dependents: [] }),
      ),
      http.get(`${ORIGIN}/v1/work-items/gantt/admin`, () => json({ tasks: [], links: [] })),
    )
    const more = $('[data-testid="tp-more"]') as HTMLButtonElement
    more.click()
    await flushPromises()
    ;($('[data-action="removeDependency"]') as HTMLElement).click()
    await flushPromises()
    await settleQueries(h.queryClient)
    expect($('[role="menu"]')).toBeNull()
    const dialog = $('[role="dialog"]')!
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    esc(dialog)
    await flushPromises()
    expect($('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(more)
  })

  it('menü dışına işaretçi basışı menüyü kapatır', async () => {
    await render()
    $('[data-testid="tp-more"]')!.click()
    await flushPromises()
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flushPromises()
    expect($('[role="menu"]')).toBeNull()
  })
})
