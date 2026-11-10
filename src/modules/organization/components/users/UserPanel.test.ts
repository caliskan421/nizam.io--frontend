import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import { useToast } from '@/shared/ui'

import {
  confirmationRequired,
  errorEnvelope,
  http,
  json,
  knownUser,
  MEMBERSHIP_CHANGE,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../../__tests__/harness'
import {
  baseHandlers,
  confirmButton,
  mountWith,
  seedUsers,
  settle,
  task,
  unmountAll,
  usersHandler,
} from './__tests__/users-harness'
import UserPanel from './UserPanel.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
  useToast().clear()
})
afterAll(() => server.close())

// W74 bileşeni taslak: yalnız prop sözleşmesi gözlenir (TASLAK — W82 entegrasyon girdisi).
const TemporaryPasswordDialog = defineComponent({
  name: 'TemporaryPasswordDialog',
  props: { open: Boolean, accountId: { type: String, required: true } },
  emits: ['update:open', 'done'],
  setup: (p) => () => h('div', { 'data-password-dialog': p.accountId, 'data-open': p.open }),
})
const STUBS = { TemporaryPasswordDialog }

async function mountPanel(props: Record<string, unknown> = {}) {
  return mountWith(UserPanel, { accountId: 'u1', ...props }, { seed: seedUsers(), stubs: STUBS })
}

const toasts = () => useToast().queue.value.map((t) => t.message)
const MEMBERSHIP = (d: string) => `/v1/departments/${d}/memberships/u1`

describe('UserPanel — başlık, özet, roller', () => {
  it('ad, alt satır (ilk birim +n · rol), kapat; görev özeti tek uçtan kişiye süzülür', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/program/work-items`, () =>
        json({
          items: [
            task('w1', 'u1', 'devam_ediyor', true),
            task('w2', 'u1', 'iade_edildi'),
            task('w3', 'u1', 'onaya_sunuldu'),
            task('w4', 'u1', 'tamamlandi', true),
            task('w5', 'u2', 'baslanmadi', true),
          ],
        }),
      ),
      ...baseHandlers(),
    )
    const { wrapper } = await mountPanel()
    const panel = wrapper.findComponent(UserPanel)

    expect(wrapper.get('h2').text()).toBe('Ayşe Demir')
    expect(wrapper.get('[data-testid="panel-subline"]').text()).toBe('Mekanik +1 · Koordinatör')
    expect(wrapper.get('[data-testid="strip-open"]').text()).toBe('3')
    expect(wrapper.get('[data-testid="strip-overdue"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="strip-approval"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="user-strip"]').attributes('href')).toBe(
      '/kullanicilar/u1?kart=acik',
    )
    expect(sent('GET', '/v1/program/work-items')[0]!.query.get('department_id')).toBeNull()
    expect(wrapper.get('[data-testid="panel-profile"]').attributes('href')).toBe('/kullanicilar/u1')
    expect(wrapper.text()).not.toContain('Kaydet')
    expect(wrapper.text()).not.toContain('Vazgeç')

    await wrapper.get('[data-testid="panel-close"]').trigger('click')
    expect(panel.emitted('close')).toHaveLength(1)
  })

  it('Admin kartı canlı (BE-042, company_admin satırdan); e-posta ve hesap durumu (BE-041/044); K/Ü kartları çiplerle tutarlı', async () => {
    server.use(...baseHandlers())
    const { wrapper } = await mountWith(
      UserPanel,
      { accountId: 'u2' },
      {
        stubs: STUBS,
        seed: seedUsers([
          knownUser('u2', 'Berk Kaya', ['p1:d2:uye'], {
            company_admin: true,
            account_status: 'disabled',
            login_locked: true,
          }),
        ]),
      },
    )
    expect(wrapper.find('[data-design-stub="BE-042"]').exists()).toBe(false)
    const card = (r: string) =>
      wrapper.get(`[data-role-card="${r}"] input`).element as HTMLInputElement
    expect(card('admin').checked).toBe(true)
    expect(card('admin').disabled).toBe(false)
    expect(card('coordinator').checked).toBe(false)
    expect(card('member').checked).toBe(true)
    expect(card('member').disabled).toBe(true)
    expect(wrapper.get('[data-testid="panel-email"]').text()).toBe('u2@ornek.test')
    expect(wrapper.find('[data-testid="panel-disabled"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="panel-locked"]').exists()).toBe(true)
  })

  it('gömülü (05b): kapat yok; önbellekte yoksa readUser (tek istek, listUsers yok), 404 → bilgi (BE-043)', async () => {
    server.use(
      ...baseHandlers(),
      http.get(`${ORIGIN}/v1/admin/users/u2`, () =>
        json(knownUser('u2', 'Berk Kaya', ['p1:d2:uye'])),
      ),
      http.get(`${ORIGIN}/v1/admin/users/zz`, () =>
        errorEnvelope('organization.account_not_found', 404),
      ),
    )
    const found = await mountWith(UserPanel, { accountId: 'u2', embedded: true }, { stubs: STUBS })
    expect(found.wrapper.find('[data-testid="panel-close"]').exists()).toBe(false)
    expect(found.wrapper.get('h2').text()).toBe('Berk Kaya')
    expect(sent('GET', '/v1/admin/users/u2')).toHaveLength(1)
    expect(sent('GET', '/v1/admin/users')).toHaveLength(0)
    unmountAll()

    const missing = await mountWith(
      UserPanel,
      { accountId: 'zz', embedded: true },
      { stubs: STUBS },
    )
    expect(missing.wrapper.find('[data-testid="panel-missing"]').exists()).toBe(true)
  })
})

describe('UserPanel — çipler (anında, kendi onay/sonucuyla)', () => {
  it('rol değişimi: confirmation_required → onay → aynı istek GÖVDEDE confirm:true', async () => {
    let calls = 0
    server.use(
      ...baseHandlers(),
      usersHandler(),
      http.patch(`${ORIGIN}${MEMBERSHIP('d2')}`, () =>
        ++calls === 1 ? confirmationRequired(['Rapor']) : json(MEMBERSHIP_CHANGE),
      ),
    )
    const { wrapper } = await mountPanel()

    await wrapper.get('[data-chip="d2"] [data-testid="chip-role"]').trigger('click')
    await wrapper.get('[data-chip-role="coordinator"]').trigger('click')
    await settle()
    expect(document.body.textContent).toContain('Rapor')
    confirmButton('Rolü değiştir')!.click()
    await settle()

    const reqs = sent('PATCH', MEMBERSHIP('d2'))
    expect(reqs.map((r) => r.body)).toEqual([
      { role: 'koordinator' },
      { role: 'koordinator', confirm: true },
    ])
    expect(reqs[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(toasts()).toContain('Rol güncellendi.')
  })

  it('çıkar: onay SORGUDA (?confirm=true); vazgeçte ikinci istek yok', async () => {
    server.use(
      ...baseHandlers(),
      usersHandler(),
      http.delete(`${ORIGIN}${MEMBERSHIP('d1')}`, ({ request }) =>
        new URL(request.url).searchParams.get('confirm') === 'true'
          ? json(MEMBERSHIP_CHANGE)
          : confirmationRequired(['Rapor']),
      ),
    )
    const { wrapper } = await mountPanel()
    const remove = () =>
      wrapper.get('[data-chip="d1"] [data-testid="chip-remove"]').trigger('click')

    await remove()
    await settle()
    confirmButton('Vazgeç')!.click()
    await settle()
    expect(sent('DELETE', MEMBERSHIP('d1'))).toHaveLength(1)

    await remove()
    await settle()
    confirmButton('Çıkar')!.click()
    await settle()
    const reqs = sent('DELETE', MEMBERSHIP('d1'))
    expect(reqs).toHaveLength(3)
    expect(reqs[2]!.query.get('confirm')).toBe('true')
    expect(toasts()).toContain('Koordinatörlükten çıkarıldı.')
  })

  it('"+ Ekle": seçili programın kalan birimleri + rol → assignMembership; zaten ekipte → ileti + yeniden okuma', async () => {
    server.use(
      ...baseHandlers(),
      usersHandler(),
      http.post(`${ORIGIN}/v1/departments/d3/memberships`, () =>
        errorEnvelope('organization.membership_exists', 409),
      ),
    )
    const { wrapper, queryClient } = await mountPanel()
    await wrapper.get('[data-testid="chip-add"]').trigger('click')
    const options = wrapper.findAll('select[data-testid="chip-add-department"] option')
    expect(options.map((o) => o.attributes('value')).filter(Boolean)).toEqual(['d3'])

    await wrapper.get('select[data-testid="chip-add-department"]').setValue('d3')
    await wrapper.get('select[data-testid="chip-add-role"]').setValue('member')
    await wrapper.get('[data-testid="chip-add-submit"]').trigger('click')
    await settle()

    const [req] = sent('POST', '/v1/departments/d3/memberships')
    expect(req!.body).toEqual({ account_id: 'u1', role: 'uye' })
    expect(toasts()).toContain('Kullanıcı bu departmanda zaten üye.')
    // Anahtarsız uç: "zaten uygulanmış olabilir" → kullanıcı listesi yeniden okunur (geçersiz).
    const key = queryKeys.users.list({ search: null, sortOrder: 'asc' })
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
  })

  it('kendi hesabında yıkıcı eylem yok: çıkar, rol değiştir ve sil gizli', async () => {
    server.use(...baseHandlers({ accountId: 'u1', companyAdmin: true, rows: [] }))
    const { wrapper } = await mountPanel()
    expect(wrapper.find('[data-testid="chip-remove"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="chip-role"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="chip-role-static"]')).toHaveLength(2)
    expect(wrapper.find('[data-testid="account-delete"]').exists()).toBe(false)
  })
})

describe('UserPanel — hesap eylemleri', () => {
  it('şifre sıfırlama (BE-013) devre dışı stub; kilitle (BE-012) canlı; tık istek atmaz', async () => {
    server.use(...baseHandlers())
    const { wrapper } = await mountPanel()
    const stub = wrapper.get('[data-design-stub="BE-013"]')
    const reset = stub.get('[data-testid="account-reset"]')
    expect(reset.attributes('disabled')).toBeDefined()
    await reset.trigger('click')
    expect(wrapper.find('[data-design-stub="BE-012"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="account-lock"]').attributes('disabled')).toBeUndefined()
    expect(sent('PATCH', '/v1/admin/users/u1')).toHaveLength(0)
  })

  it('geçici parola: W74 diyaloğu bu hesapla açılır', async () => {
    server.use(...baseHandlers())
    const { wrapper } = await mountPanel()
    expect(wrapper.find('[data-password-dialog]').exists()).toBe(false)
    await wrapper.get('[data-testid="account-password"]').trigger('click')
    const dialog = wrapper.get('[data-password-dialog]')
    expect(dialog.attributes('data-password-dialog')).toBe('u1')
    expect(dialog.attributes('data-open')).toBe('true')
  })

  it('giriş kilidini kaldır (yalnız login_locked iken): 409 account_not_locked → "Hesap kilitli değil." bilgisi', async () => {
    server.use(
      ...baseHandlers(),
      http.post(`${ORIGIN}/v1/admin/accounts/u1/unlock`, () =>
        errorEnvelope('identity.account_not_locked', 409),
      ),
    )
    const { wrapper } = await mountWith(
      UserPanel,
      { accountId: 'u1' },
      {
        seed: seedUsers([
          knownUser('u1', 'Ayşe Demir', ['p1:d1:koordinator'], { login_locked: true }),
        ]),
        stubs: STUBS,
      },
    )
    await wrapper.get('[data-testid="account-unlock"]').trigger('click')
    await settle()
    expect(sent('POST', '/v1/admin/accounts/u1/unlock')).toHaveLength(1)
    expect(useToast().queue.value.at(-1)).toMatchObject({
      message: 'Hesap kilitli değil.',
      tone: 'neutral',
    })
  })

  it('sil: istemci onayı; vazgeç → istek yok; kabul → DELETE + deleted; son yönetici iletisi', async () => {
    let status = 409
    server.use(
      ...baseHandlers(),
      usersHandler(),
      http.delete(`${ORIGIN}/v1/admin/users/u1`, () =>
        status === 409
          ? errorEnvelope('organization.last_admin', 409)
          : json({ account_id: 'u1', changed_fields: [], revoked_sessions: 0 }),
      ),
    )
    const { wrapper } = await mountPanel()
    const panel = wrapper.findComponent(UserPanel)
    const remove = async (label: string) => {
      await wrapper.get('[data-testid="account-delete"]').trigger('click')
      await settle()
      expect(document.body.textContent).toContain('Açık görevleri size devredilir')
      confirmButton(label)!.click()
      await settle()
    }

    await remove('Vazgeç')
    expect(sent('DELETE', '/v1/admin/users/u1')).toHaveLength(0)

    await remove('Sil')
    expect(sent('DELETE', '/v1/admin/users/u1')).toHaveLength(1)
    expect(toasts()).toContain('Son yönetici kaldırılamaz.')
    expect(panel.emitted('deleted')).toBeUndefined()

    status = 200
    await remove('Sil')
    expect(panel.emitted('deleted')).toEqual([['u1']])
  })
})
