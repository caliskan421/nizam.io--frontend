import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import RevertReasonDialog from './RevertReasonDialog.vue'

afterEach(() => (document.body.innerHTML = ''))

const $ = (s: string) => document.body.querySelector<HTMLElement>(s)

function input(value: string): void {
  const el = $('[name="reason"]') as HTMLInputElement
  el.value = value
  el.dispatchEvent(new Event('input'))
}

describe('RevertReasonDialog (geri alma gerekçesi, ≥ 3 bayt)', () => {
  it('kısa gerekçe gönderilmez, hata alanda; geçerli gerekçe submit', async () => {
    const wrapper = mount(RevertReasonDialog, { props: { open: true }, attachTo: document.body })
    input(' a ')
    $('[data-testid="wf-revert-submit"]')!.click()
    await flushPromises()
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(document.body.textContent).toContain('En az 3 karakterlik bir gerekçe yazın.')

    input('ğü')
    $('[data-testid="wf-revert-submit"]')!.click()
    await flushPromises()
    // "ğü" UTF-8'de 4 bayt: sözleşme bayt sayar.
    expect(wrapper.emitted('submit')).toEqual([['ğü']])
    wrapper.unmount()
  })

  it('açılışta alan temizlenir; istek sürerken kapatılamaz', async () => {
    const wrapper = mount(RevertReasonDialog, {
      props: { open: false, pending: true },
      attachTo: document.body,
    })
    await wrapper.setProps({ open: true })
    expect(($('[name="reason"]') as HTMLInputElement).value).toBe('')
    expect($('.t-modal__head button')).toBeNull()
    expect(($('[data-testid="wf-revert-submit"]') as HTMLButtonElement).disabled).toBe(true)
    wrapper.unmount()
  })
})
