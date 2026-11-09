import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { flushPromises } from '@vue/test-utils'

import { http, json, ORIGIN, resetHarness, sent, server } from '../__tests__/harness'
import {
  baseHandlers,
  mountWith,
  settle,
  unmountAll,
  usersHandler,
} from '../components/users/__tests__/users-harness'
import UsersPage from './UsersPage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  vi.useRealTimers()
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

// W74 bileşenleri taslak: yalnız prop/emit sözleşmesi gözlenir (TASLAK — W82 entegrasyon girdisi).
const stub = (
  name: string,
  props: string[],
  render: (
    p: Record<string, unknown>,
    emit: (event: 'created', ...args: unknown[]) => void,
  ) => unknown,
) =>
  defineComponent({
    name,
    props: Object.fromEntries(props.map((key) => [key, { type: null }])),
    emits: ['update:open', 'created', 'done'],
    setup:
      (p, { emit }) =>
      () =>
        render(p, emit),
  })
const UserCreateDialog = stub('UserCreateDialog', ['open', 'departmentId'], (p, emit) =>
  h('button', {
    'data-create-dialog': p.open ? 'open' : 'closed',
    'data-dept': p.departmentId ?? '',
    onClick: () => emit('created', 'u2'),
  }),
)
const TemporaryPasswordDialog = stub('TemporaryPasswordDialog', ['open', 'accountId'], (p) =>
  h('div', { 'data-password-dialog': p.accountId }),
)
const STUBS = { UserCreateDialog, TemporaryPasswordDialog }

function mountPage(path = '/kullanicilar') {
  server.use(...baseHandlers(), usersHandler())
  return mountWith(UsersPage, {}, { path, stubs: STUBS })
}

describe('UsersPage — başlık ve araç çubuğu', () => {
  it('alt başlık yüklenen sayı; Dışa aktar stub (istek yok); Admin sekmesi devre dışı; sayaçlar', async () => {
    const { wrapper } = await mountPage()
    expect(wrapper.get('[data-testid="users-summary"]').text()).toBe(
      '3 kullanıcı · roller ve koordinatörlük atamaları',
    )
    const exportButton = wrapper.get('[data-design-stub="BE-014"] [data-testid="users-export"]')
    expect(exportButton.attributes('disabled')).toBeDefined()
    const before = sent('GET', '/v1/admin/users').length
    await exportButton.trigger('click')
    expect(sent('GET', '/v1/admin/users')).toHaveLength(before)

    const tabs = wrapper.findAll('.rp-seg button')
    expect(tabs.map((t) => t.text().replace(/\s+/g, ' '))).toEqual([
      'Tümü 3',
      'Admin',
      'Koordinatör 1',
      'Üye 2',
    ])
    expect(tabs[1]!.attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-testid="tabs-partial"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="users-search"]').attributes('placeholder')).toBe('Ad…')
  })

  it('rol sekmesi URL `rol`; istek atmaz (istemci süzmesi)', async () => {
    const { wrapper, router } = await mountPage()
    const before = sent('GET', '/v1/admin/users').length
    await wrapper.findAll('.rp-seg button')[2]!.trigger('click')
    await settle()
    expect(router.currentRoute.value.query).toEqual({ rol: 'koordinator' })
    expect(sent('GET', '/v1/admin/users')).toHaveLength(before)
    expect(wrapper.findAll('[data-account]').map((r) => r.attributes('data-account'))).toEqual([
      'u1',
    ])
  })

  it('arama ~300 ms gecikmeli URL `q` → yeni sorgu (imleçsiz, search)', async () => {
    const { wrapper, router } = await mountPage()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await wrapper.get('[data-testid="users-search"]').setValue('ay')
    vi.advanceTimersByTime(299)
    await flushPromises()
    expect(router.currentRoute.value.query.q).toBeUndefined()
    vi.advanceTimersByTime(1)
    vi.useRealTimers()
    await settle()

    expect(router.currentRoute.value.query.q).toBe('ay')
    const last = sent('GET', '/v1/admin/users').at(-1)!
    expect(last.query.get('search')).toBe('ay')
    expect(last.query.get('cursor')).toBeNull()
  })

  it('koordinatörlük süzgeci: URL `koordinatorluk` → tek listMembers isteği', async () => {
    server.use(http.get(`${ORIGIN}/v1/departments/d2/members`, () => json({ members: [] })))
    const { wrapper, router } = await mountPage()
    await wrapper.get('[data-testid="department-filter"]').trigger('click')
    await wrapper.get('[data-department="d2"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.query).toEqual({ koordinatorluk: 'd2' })
    expect(sent('GET', '/v1/departments/d2/members')).toHaveLength(1)
  })
})

describe('UsersPage — yan panel ve yaşam döngüsü', () => {
  it('derin bağlantı: yüklü kişi → panel açık; kapat → `secili` silinir', async () => {
    const { wrapper, router } = await mountPage('/kullanicilar?secili=u2')
    expect(wrapper.get('[data-testid="user-panel"]').attributes('data-account')).toBe('u2')
    expect(wrapper.get('[data-account="u2"][role="row"]').classes()).toContain('rp-sel')

    await wrapper.get('[data-testid="panel-close"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.query.secili).toBeUndefined()
    expect(wrapper.find('[data-testid="user-panel"]').exists()).toBe(false)
  })

  it('derin bağlantı: yüklü sayfada olmayan kişi → panel kapalı + bilgi', async () => {
    const { wrapper } = await mountPage('/kullanicilar?secili=zz')
    expect(wrapper.find('[data-testid="user-panel"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="users-selected-missing"]').exists()).toBe(true)
  })

  it('satır seçimi `secili`yi yazar (push)', async () => {
    const { wrapper, router } = await mountPage()
    await wrapper.get('[data-account="u1"][role="row"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.query).toEqual({ secili: 'u1' })
    expect(wrapper.find('[data-testid="user-panel"]').exists()).toBe(true)
  })

  it('kapsam değişimi: arama ve sekme korunur; koordinatörlük, `secili` ve açık diyalog düşer', async () => {
    server.use(http.get(`${ORIGIN}/v1/departments/d1/members`, () => json({ members: [] })))
    const { wrapper, router, store } = await mountPage(
      '/kullanicilar?rol=uye&q=ay&koordinatorluk=d1&secili=u1',
    )
    await wrapper.get('[data-testid="users-create"]').trigger('click')
    expect(wrapper.get('[data-create-dialog]').attributes('data-create-dialog')).toBe('open')

    store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await settle()
    expect(router.currentRoute.value.query).toEqual({ rol: 'uye', q: 'ay' })
    expect(wrapper.get('[data-create-dialog]').attributes('data-create-dialog')).toBe('closed')
  })

  it('Kullanıcı oluştur: W74 formu birimle açılır; oluşunca kişi seçilir ve geçici parola adımı açılır', async () => {
    server.use(http.get(`${ORIGIN}/v1/departments/d1/members`, () => json({ members: [] })))
    const { wrapper, router } = await mountPage('/kullanicilar?koordinatorluk=d1')
    await wrapper.get('[data-testid="users-create"]').trigger('click')
    const dialog = wrapper.get('[data-create-dialog]')
    expect(dialog.attributes('data-dept')).toBe('d1')

    await dialog.trigger('click')
    await settle()
    expect(router.currentRoute.value.query.secili).toBe('u2')
    expect(wrapper.get('[data-password-dialog]').attributes('data-password-dialog')).toBe('u2')
  })
})
