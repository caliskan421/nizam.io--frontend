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
import UserCreateDialog from './UserCreateDialog.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetForms())
afterAll(() => server.close())

const USERS = `${ORIGIN}/v1/admin/users`

async function openDialog(departmentId: string | null = 'd2', list = DEPARTMENTS) {
  server.use(http.get(`${ORIGIN}/v1/admin/users`, () => json({ users: [], next_cursor: '' })))
  const h = formsHarness(ADMIN_SCOPE)
  h.departments(list)
  const wrapper = h.mount(UserCreateDialog, { open: true, departmentId })
  await h.flush()
  return { h, wrapper }
}

const DEPARTMENTS = [
  { id: 'd1', name: 'Yazılım' },
  { id: 'd2', name: 'Elektronik' },
]

async function fill(email = 'yeni@ornek.test', name = 'Yeni Kişi') {
  setValue('[name="email"]', email)
  setValue('[name="fullName"]', name)
  await nextTick()
}

describe('UserCreateDialog (E-05-05 "Kullanıcı oluştur"; P14)', () => {
  it('alanlar; parola alanı yok; birim önseçili; ŞY rol seçer', async () => {
    await openDialog()
    for (const name of ['email', 'fullName', 'departmentId', 'role']) {
      expect($(`[name="${name}"]`), name).not.toBeNull()
    }
    expect($('[type="password"]')).toBeNull()
    expect(($('[name="departmentId"]') as HTMLSelectElement).value).toBe('d2')
    expect(($('[name="role"]') as HTMLSelectElement).value).toBe('member')
  })

  it('geçersiz e-posta → alan hatası, istek yok', async () => {
    await openDialog()
    await fill('gecersiz')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain('Geçerli bir e-posta adresi yazın.'),
    )
    expect(sent('POST', '/v1/admin/users')).toHaveLength(0)
  })

  it('başarı: createUser gövdesi (S1, anahtarsız; parola yok) → created(account_id) + kapanış', async () => {
    server.use(
      http.post(USERS, () =>
        json({ account_id: 'acc-9', created: true, membership_id: 'm9' }, 201),
      ),
    )
    const { wrapper } = await openDialog()
    await fill()
    setValue('[name="role"]', 'coordinator')
    await nextTick()
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect(wrapper.emitted('created')).toEqual([['acc-9']]))
    const [req] = sent('POST', '/v1/admin/users')
    await vi.waitFor(() => expect(req!.body).toBeDefined())
    expect(req!.body).toEqual({
      email: 'yeni@ornek.test',
      full_name: 'Yeni Kişi',
      program_id: 'p1',
      department_id: 'd2',
      role: 'koordinator',
    })
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(req!.headers.get('X-Nizamio-Program')).toBeNull()
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    expect(toasts()).toContain('Kullanıcı oluşturuldu. Geçici parolasını belirleyebilirsiniz.')
  })

  it('422 identity alan hataları forma (e-posta, ad)', async () => {
    server.use(
      http.post(USERS, () =>
        errorEnvelope('identity.input_invalid', 422, [
          { field: 'email', code: 'identity.invalid_email', message: 'x' },
          { field: 'full_name', code: 'identity.invalid_full_name', message: 'x' },
        ]),
      ),
    )
    await openDialog()
    await fill('a@b.co', '?')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect(document.body.textContent).toContain('E-posta adresi geçersiz.'))
    expect(document.body.textContent).toContain('Ad soyad geçersiz.')
    expect($('[name="email"]')?.getAttribute('aria-invalid')).toBe('true')
  })

  it('409 transfer_available → teklif tanınır; aktarım düğmesi devre dışı + BE-107; ikinci istek yok', async () => {
    server.use(
      http.post(USERS, () =>
        errorEnvelope('identity.account_exists', 409, [
          { field: 'email', code: 'organization.transfer_available', message: 'x' },
        ]),
      ),
    )
    const { wrapper } = await openDialog()
    await fill()
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect($('[data-testid="of-transfer"]')).not.toBeNull())
    const action = $('[data-testid="of-transfer-action"]') as HTMLButtonElement
    expect(action.disabled).toBe(true)
    expect(action.closest('[data-design-stub]')?.getAttribute('data-design-stub')).toBe('BE-107')
    action.click()
    await nextTick()
    expect(sent('POST', '/v1/admin/users')).toHaveLength(1)
    expect(wrapper.emitted('created')).toBeUndefined()
    // E-posta değişince teklif kalkar.
    setValue('[name="email"]', 'baska@ornek.test')
    await nextTick()
    expect($('[data-testid="of-transfer"]')).toBeNull()
  })

  it('409 account_exists (aktarımsız) → e-posta alanında; liste yeniden okunur', async () => {
    server.use(http.post(USERS, () => errorEnvelope('identity.account_exists', 409)))
    const { h } = await openDialog()
    const users = h.queryClient.getQueryCache()
    h.queryClient.setQueryData(['users', { search: null, sortOrder: 'asc' }], { pages: [] })
    await fill()
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect($('[name="email"]')?.getAttribute('aria-invalid')).toBe('true'))
    await vi.waitFor(() =>
      expect(users.find({ queryKey: ['users'], exact: false })?.state.isInvalidated).toBe(true),
    )
  })

  it('422 department_not_linked → koordinatörlük alanında', async () => {
    server.use(http.post(USERS, () => errorEnvelope('organization.department_not_linked', 422)))
    await openDialog()
    await fill()
    click('[data-testid="of-submit"]')
    await vi.waitFor(() =>
      expect($('[name="departmentId"]')?.getAttribute('aria-invalid')).toBe('true'),
    )
  })

  it('sonuç bilinmiyor → kör tekrar yok; çift tık tek istek', async () => {
    server.use(http.post(USERS, () => HttpResponse.error()))
    await openDialog()
    await fill()
    click('[data-testid="of-submit"]')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect($('[data-testid="outcome-notice"]')).not.toBeNull())
    expect($('[data-testid="outcome-retry"]')).toBeNull()
    expect(sent('POST', '/v1/admin/users')).toHaveLength(1)
  })

  it('seçili programda birim yoksa uyarı ve gönder kapalı; tek birim kendiliğinden seçilir', async () => {
    await openDialog(null, [])
    expect($('[data-testid="of-no-department"]')).not.toBeNull()
    expect(($('[data-testid="of-submit"]') as HTMLButtonElement).disabled).toBe(true)
    resetForms()

    await openDialog(null, [{ id: 'd5', name: 'Mekanik' }])
    expect(($('[name="departmentId"]') as HTMLSelectElement).value).toBe('d5')
  })
})
