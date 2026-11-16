import { mount } from '@vue/test-utils'
import { afterEach, expect, it } from 'vitest'

import ReturnReasonDialog from './ReturnReasonDialog.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

// W178 KUSUR 5: gerekçe alanı `.role-home-dialog` kapsamında (iç boşluk + odak halkası kuralları
// bu kapsama bağlıdır; kapsamsız alan tarayıcı sıfırlamasıyla kenara yapışıyordu).
it('gerekçe alanı .role-home-dialog kapsamındadır ve gönderim gerekçeyi taşır', async () => {
  const wrapper = mount(ReturnReasonDialog, {
    attachTo: document.body,
    props: { title: 'Motor testi', open: true },
  })
  const input = document.querySelector<HTMLTextAreaElement>('[data-testid="k1-return-input"]')!
  expect(input.closest('.role-home-dialog')).not.toBeNull()
  input.value = 'İmza eksik'
  input.dispatchEvent(new Event('input'))
  document.querySelector<HTMLButtonElement>('[data-testid="k1-return-submit"]')!.click()
  await wrapper.vm.$nextTick()
  expect(wrapper.emitted('submit')?.[0]).toEqual(['İmza eksik'])
  wrapper.unmount()
})
