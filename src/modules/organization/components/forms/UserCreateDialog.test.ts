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

  it('409 transfer_available → teklif (ad + kimlik); "Mevcut hesabı ekle" aynı gövdeyi transfer_account_id ile gönderir (BE-107)', async () => {
    server.use(
      http.post(USERS, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        if (body.transfer_account_id) return json({ account_id: 'acc-old' }, 201)
        return errorEnvelope('identity.account_exists', 409, [
          { field: 'email', code: 'organization.transfer_available', message: 'sabit metin' },
          { field: 'account_id', code: 'organization.transfer_available', message: 'acc-old' },
          {
            field: 'user_full_name',
            code: 'organization.transfer_available',
            message: 'Ayşe Kaya',
          },
        ])
      }),
    )
    const { wrapper } = await openDialog()
    await fill()
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect($('[data-testid="of-transfer"]')).not.toBeNull())
    expect($('[data-testid="of-transfer"]')?.textContent).toContain('Ayşe Kaya')
    expect($('[data-testid="of-transfer"]')?.textContent).not.toContain('sabit metin')
    const action = $('[data-testid="of-transfer-action"]') as HTMLButtonElement
    expect(action.disabled).toBe(false)
    expect(action.closest('[data-design-stub]')).toBeNull()
    action.click()
    await vi.waitFor(() => expect(wrapper.emitted('created')).toEqual([['acc-old']]))
    const posts = sent('POST', '/v1/admin/users')
    expect(posts).toHaveLength(2)
    expect(posts[0]!.body).not.toHaveProperty('transfer_account_id')
    expect(posts[1]!.body).toMatchObject({
      email: (posts[0]!.body as { email: string }).email,
      transfer_account_id: 'acc-old',
    })
  })

  it('409 account_exists, teklif girdisi olmadan (koordinatör / hesap ekipte) → aktarım çizilmez', async () => {
    server.use(http.post(USERS, () => errorEnvelope('identity.account_exists', 409, [])))
    await openDialog()
    await fill()
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect($('[name="email"]')?.getAttribute('aria-invalid')).toBe('true'))
    expect($('[data-testid="of-transfer"]')).toBeNull()
  })

  it('aktarım teklifi e-posta değişince kalkar', async () => {
    server.use(
      http.post(USERS, () =>
        errorEnvelope('identity.account_exists', 409, [
          { field: 'account_id', code: 'organization.transfer_available', message: 'acc-old' },
        ]),
      ),
    )
    await openDialog()
    await fill()
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect($('[data-testid="of-transfer"]')).not.toBeNull())
    setValue('[name="email"]', 'baska@ornek.test')
    await nextTick()
    expect($('[data-testid="of-transfer"]')).toBeNull()
  })

  describe('aktarım teklifi ilk gövde ve bağlama bağlı (CX-P-Ö-02, BE-107)', () => {
    const offerTransfer = () =>
      server.use(
        http.post(USERS, async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>
          if (body.transfer_account_id) return json({ account_id: 'acc-old' }, 201)
          return errorEnvelope('identity.account_exists', 409, [
            { field: 'account_id', code: 'organization.transfer_available', message: 'acc-old' },
          ])
        }),
      )

    async function offered() {
      offerTransfer()
      const opened = await openDialog()
      await fill()
      click('[data-testid="of-submit"]')
      await vi.waitFor(() => expect($('[data-testid="of-transfer"]')).not.toBeNull())
      return opened
    }

    it.each([
      ['ad', '[name="fullName"]', 'Başka Ad'],
      ['departman', '[name="departmentId"]', 'd1'],
      ['rol', '[name="role"]', 'coordinator'],
    ])('%s değişince teklif düşer; ikinci POST yok', async (_label, selector, value) => {
      await offered()
      setValue(selector, value)
      await nextTick()
      expect($('[data-testid="of-transfer"]')).toBeNull()
      expect(sent('POST', '/v1/admin/users')).toHaveLength(1)
    })

    it('kapsam (program) değişince teklif düşer; ikinci POST sıfır', async () => {
      const { h } = await offered()
      h.store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
      await h.flush()
      expect($('[data-testid="of-transfer"]')).toBeNull()
      expect(sent('POST', '/v1/admin/users')).toHaveLength(1)
    })

    it('mercek (departman) değişince teklif düşer; ikinci POST sıfır', async () => {
      const { h } = await offered()
      h.store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
      await h.flush()
      expect($('[data-testid="of-transfer"]')).toBeNull()
      expect(sent('POST', '/v1/admin/users')).toHaveLength(1)
    })

    it('değişmeyen teklif: aktarım ilk gövdeyi aynen taşır', async () => {
      await offered()
      ;($('[data-testid="of-transfer-action"]') as HTMLButtonElement).click()
      await vi.waitFor(() => expect(sent('POST', '/v1/admin/users')).toHaveLength(2))
      const [first, second] = sent('POST', '/v1/admin/users')
      expect(second!.body).toEqual({ ...(first!.body as object), transfer_account_id: 'acc-old' })
    })
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
