import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { createFakeBackend } from '../../../../tests/support/fake-backend'

const backend = createFakeBackend()
beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  backend.server.resetHandlers()
  backend.reset()
  document.body.innerHTML = ''
})
afterAll(() => backend.server.close())

// Giriş formu shared/ui ile (O4 görsel borç): etiket ↔ alan bağı, birincil düğme, hata kodu → i18n.
async function mountPage() {
  vi.stubGlobal('BroadcastChannel', undefined)
  vi.resetModules()
  const pinia = createPinia()
  setActivePinia(pinia)
  const { useSessionStore } = await import('@/shared/session/store')
  const { i18n } = await import('@/shared/i18n')
  const { default: SessionPage } = await import('./SessionPage.vue')
  const session = useSessionStore()
  await session.bootstrap()
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = mount(SessionPage, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }], i18n] },
    attachTo: document.body,
  })
  await flushPromises()
  return { wrapper, session }
}

describe('oturum sayfası (giriş formu)', () => {
  it('alanlar UiField + UiInput: etiket alana bağlı, t-input sınıfı, birincil gönder düğmesi', async () => {
    const { wrapper } = await mountPage()
    const form = wrapper.get('[data-testid="login-form"]')
    for (const [name, label] of [
      ['email', 'E-posta'],
      ['password', 'Parola'],
    ] as const) {
      const input = form.get(`input[name="${name}"]`)
      expect(input.classes()).toContain('t-input')
      const id = input.attributes('id')
      expect(id).toBeTruthy()
      expect(form.get(`label[for="${id}"]`).text()).toBe(label)
    }
    const submit = form.get('button[type="submit"]')
    expect(submit.classes()).toEqual(expect.arrayContaining(['t-btn', 't-btn--primary']))
    expect(submit.text()).toBe('Giriş')
  })

  it('yanlış parola: hata kodu metni (sunucu mesajı değil), alert rolüyle', async () => {
    const { wrapper } = await mountPage()
    await wrapper.get('input[name="email"]').setValue('yonetici@example.test')
    await wrapper.get('input[name="password"]').setValue('yanlis')
    await wrapper.get('[data-testid="login-form"]').trigger('submit')
    await flushPromises()
    const alert = wrapper.get('[data-testid="error"]')
    expect(alert.attributes('role')).toBe('alert')
    expect(alert.get('[data-code]').attributes('data-code')).toBe('identity.credentials_invalid')
    expect(alert.text()).toContain('E-posta veya parola hatalı.')
  })

  it('doğru parola: oturum açılır, /v1/me e-postası ve eylem düğmeleri görünür', async () => {
    const { wrapper } = await mountPage()
    await wrapper.get('input[name="email"]').setValue('yonetici@example.test')
    await wrapper.get('input[name="password"]').setValue('dogru-parola')
    await wrapper.get('[data-testid="login-form"]').trigger('submit')
    await flushPromises()
    await flushPromises()
    expect(wrapper.get('[data-testid="me-email"]').text()).toBe('yonetici@example.test')
    expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="logout"]').classes()).toContain('t-btn')
    expect(wrapper.get('[data-testid="reload-me"]').classes()).toContain('t-btn')
  })
})
