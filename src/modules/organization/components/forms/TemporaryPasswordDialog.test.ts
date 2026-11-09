import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import {
  ADMIN_SCOPE,
  errorEnvelope,
  http,
  HttpResponse,
  json,
  ORIGIN,
  sent,
  server,
} from '../../__tests__/harness'
import { $, click, formsHarness, resetForms, setValue, toasts } from './__tests__/harness'
import TemporaryPasswordDialog from './TemporaryPasswordDialog.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetForms())
afterAll(() => server.close())

const SECRET = 'Gizli-Parola-42'
const ACCOUNTS = `${ORIGIN}/v1/admin/accounts/:id`

function containsSecret(value: unknown): boolean {
  return JSON.stringify(value ?? null).includes(SECRET)
}

async function openDialog() {
  const h = formsHarness(ADMIN_SCOPE)
  const wrapper = h.mount(TemporaryPasswordDialog, { open: true, accountId: 'u1' })
  await h.flush()
  return { h, wrapper }
}

async function typeAndSubmit(value = SECRET) {
  setValue('[name="password"]', value)
  await nextTick()
  click('[data-testid="of-submit"]')
}

describe('TemporaryPasswordDialog (05 satır dışı "Geçici parola belirle"; P14)', () => {
  it('kapalıyken pencere yok; açıkken parola alanı (new-password)', async () => {
    const h = formsHarness(ADMIN_SCOPE)
    h.mount(TemporaryPasswordDialog, { open: false, accountId: 'u1' })
    expect($('[role="dialog"]')).toBeNull()
    resetForms()

    await openDialog()
    const input = $('[name="password"]') as HTMLInputElement
    expect(input.type).toBe('password')
    expect(input.getAttribute('autocomplete')).toBe('new-password')
  })

  it('K-2: geçersiz gönderimde odak ilk hatalı alana; Esc pencereyi kapatır', async () => {
    const { wrapper } = await openDialog()
    const submit = $('[data-testid="of-submit"]') as HTMLButtonElement
    submit.focus()
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect(document.body.textContent).toContain('Parola gerekli.'))
    const input = $('[name="password"]') as HTMLInputElement
    await vi.waitFor(() => expect(document.activeElement).toBe(input))
    expect(input.getAttribute('aria-invalid')).toBe('true')
    input.blur()
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )
    await nextTick()
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('boş parola → alan hatası, istek yok', async () => {
    await openDialog()
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect(document.body.textContent).toContain('Parola gerekli.'))
    expect(sent('PATCH', '/v1/admin/accounts/u1')).toHaveLength(0)
  })

  it('başarı: gövde {password, force_password_change}; done parolasız; parola hiçbir yerde kalmaz', async () => {
    server.use(http.patch(ACCOUNTS, () => json({ account_id: 'u1', revoked_sessions: 2 })))
    const { h, wrapper } = await openDialog()
    await typeAndSubmit()
    await vi.waitFor(() => expect(wrapper.emitted('done')).toBeTruthy())

    const [req] = sent('PATCH', '/v1/admin/accounts/u1')
    await vi.waitFor(() => expect(req!.body).toBeDefined())
    expect(req!.body).toEqual({ password: SECRET, force_password_change: true })
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(wrapper.emitted('done')).toEqual([[]])
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    expect(toasts()).toContain('Geçici parola belirlendi; 2 oturum kapatıldı.')

    // Sızma yok: emit, DOM, sorgu ve mutasyon önbelleği, bileşen durumu.
    expect(containsSecret(wrapper.emitted())).toBe(false)
    expect(document.body.innerHTML).not.toContain(SECRET)
    await vi.waitFor(() => expect(h.queryClient.getMutationCache().getAll()).toHaveLength(0))
    for (const query of h.queryClient.getQueryCache().getAll()) {
      expect(containsSecret(query.state.data)).toBe(false)
    }
    await wrapper.setProps({ open: true })
    await nextTick()
    expect(($('[name="password"]') as HTMLInputElement).value).toBe('')
  })

  it('422 parola kuralı alana; alan boşaltılır', async () => {
    server.use(
      http.patch(ACCOUNTS, () =>
        errorEnvelope('identity.input_invalid', 422, [
          { field: 'password', code: 'identity.password_too_short', message: 'x' },
        ]),
      ),
    )
    const { wrapper } = await openDialog()
    await typeAndSubmit('k')
    await vi.waitFor(() => expect(document.body.textContent).toContain('Parola çok kısa.'))
    expect(($('[name="password"]') as HTMLInputElement).value).toBe('')
    expect($('[name="password"]')?.getAttribute('aria-invalid')).toBe('true')
    expect(wrapper.emitted('done')).toBeUndefined()
  })

  it('sonuç bilinmiyor: yerinde bildirim, "Yeniden gönder" yok, tek istek, parola DOM’da yok', async () => {
    server.use(http.patch(ACCOUNTS, () => HttpResponse.error()))
    const { h } = await openDialog()
    await typeAndSubmit()
    await vi.waitFor(() => expect($('[data-testid="outcome-notice"]')).not.toBeNull())
    expect($('[data-testid="outcome-retry"]')).toBeNull()
    expect(sent('PATCH', '/v1/admin/accounts/u1')).toHaveLength(1)
    expect(document.body.innerHTML).not.toContain(SECRET)
    await vi.waitFor(() => expect(h.queryClient.getMutationCache().getAll()).toHaveLength(0))
  })

  it('çift tık tek istek; istek sürerken pencere kapatılamaz', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.patch(ACCOUNTS, async () => {
        await gate
        return json({ account_id: 'u1' })
      }),
    )
    const { wrapper } = await openDialog()
    setValue('[name="password"]', SECRET)
    await nextTick()
    click('[data-testid="of-submit"]')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() =>
      expect(($('[data-testid="of-submit"]') as HTMLButtonElement).disabled).toBe(true),
    )
    expect($('.t-modal__head button')).toBeNull()
    release()
    await vi.waitFor(() => expect(wrapper.emitted('done')).toBeTruthy())
    expect(sent('PATCH', '/v1/admin/accounts/u1')).toHaveLength(1)
    expect(toasts()).toContain('Geçici parola belirlendi.')
  })

  it('kapsam değişince açık pencere kapanır; sökülmüş bileşen geç yanıtta bildirim yapmaz', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.patch(ACCOUNTS, async () => {
        await gate
        return json({ account_id: 'u1' })
      }),
    )
    const { h, wrapper } = await openDialog()
    await typeAndSubmit()
    await vi.waitFor(() => expect(sent('PATCH', '/v1/admin/accounts/u1')).toHaveLength(1))
    h.store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await nextTick()
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    wrapper.unmount()
    release()
    await h.flush()
    expect(toasts()).toEqual([])
  })
})
