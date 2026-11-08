import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import ConfirmDialog from './ConfirmDialog.vue'
import type { ConfirmRequest } from './use-confirm'

afterEach(() => {
  document.body.innerHTML = ''
})

const request = (over: Partial<ConfirmRequest> = {}): ConfirmRequest => ({
  id: 1,
  options: {
    title: 'Toplantı silinsin mi?',
    description: 'Haftalık koordinasyon',
    body: ['Birinci paragraf.', 'İkinci paragraf.'],
    confirmLabel: 'Sil',
  },
  items: [],
  busy: false,
  ...over,
})

async function mountDialog(req: ConfirmRequest) {
  const wrapper = mount(ConfirmDialog, { props: { request: req }, attachTo: document.body })
  await flushPromises()
  const panel = document.querySelector('[role="alertdialog"]') as HTMLElement
  return { wrapper, panel }
}

describe('ConfirmDialog (silme onayı kalıbı)', () => {
  it('alertdialog: başlık ve açıklama bağlı; kapat simgesi yok; ilk odak Vazgeç', async () => {
    const { panel } = await mountDialog(request())
    expect(panel.getAttribute('aria-modal')).toBe('true')
    const title = document.getElementById(panel.getAttribute('aria-labelledby')!)
    expect(title?.textContent).toBe('Toplantı silinsin mi?')
    const desc = document.getElementById(panel.getAttribute('aria-describedby')!)
    expect(desc?.textContent?.trim()).toBe('Haftalık koordinasyon')
    expect(panel.querySelectorAll('.t-modal__body p')).toHaveLength(2)
    expect(panel.querySelector('[aria-label="Kapat"]')).toBeNull()
    expect(document.activeElement?.textContent?.trim()).toBe('Vazgeç')
    expect(panel.querySelector('[data-testid="confirm-items"]')).toBeNull()
  })

  it('Esc ve perde vazgeçer; kabul yayar', async () => {
    const { wrapper, panel } = await mountDialog(request())
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    const backdrop = document.querySelector('.t-modal-backdrop') as HTMLElement
    backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    ;(panel.querySelector('[data-testid="confirm-accept"]') as HTMLElement).click()
    expect(wrapper.emitted('cancel')).toHaveLength(2)
    expect(wrapper.emitted('accept')).toHaveLength(1)
  })

  it('istek sürerken düğmeler kapalı, Esc kapatmaz', async () => {
    const { wrapper, panel } = await mountDialog(request({ busy: true, items: ['Rapor'] }))
    expect(panel.getAttribute('aria-busy')).toBe('true')
    for (const button of panel.querySelectorAll('button')) expect(button.disabled).toBe(true)
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(wrapper.emitted('cancel')).toBeUndefined()
    expect(panel.querySelector('[data-testid="confirm-items"]')?.textContent).toContain('Rapor')
  })
})
