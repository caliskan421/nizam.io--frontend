import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { flushPromises } from '@vue/test-utils'

import {
  errorEnvelope,
  http,
  json,
  knownUser,
  ORIGIN,
  resetHarness,
  sent,
  server,
  userListHandler,
} from '../__tests__/harness'
import {
  baseHandlers,
  mountWith,
  settle,
  unmountAll,
  USERS,
  usersHandler,
} from '../components/users/__tests__/users-harness'
import UserPanel from '../components/users/UserPanel.vue'
import UsersPage from './UsersPage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
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

/** Liste istekleri (sayaç okumaları `limit=1`). */
const lists = () => sent('GET', '/v1/admin/users').filter((r) => r.query.get('limit') !== '1')

function mountPage(path = '/kullanicilar') {
  server.use(...baseHandlers(), usersHandler())
  return mountWith(UsersPage, {}, { path, stubs: STUBS })
}

describe('UsersPage — başlık ve araç çubuğu', () => {
  it('alt başlık sunucu toplamı; Dışa aktar stub (istek yok); Admin sekmesi canlı; sunucu sayaçları', async () => {
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
      'Admin 0',
      'Koordinatör 2',
      'Üye 3',
    ])
    expect(tabs[1]!.attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[data-testid="tabs-partial"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="users-search"]').attributes('placeholder')).toBe(
      'Ad, e-posta…',
    )
  })

  it('rol sekmesi URL `rol`; yeni sorgu role=koordinatör (sunucu süzmesi)', async () => {
    const { wrapper, router } = await mountPage()
    server.use(userListHandler(USERS))
    await wrapper.findAll('.rp-seg button')[2]!.trigger('click')
    await settle()
    expect(router.currentRoute.value.query).toEqual({ rol: 'koordinator' })
    expect(lists().at(-1)!.query.get('role')).toBe('koordinator')
    // K/Ü sekmesi seçili programla daralır (program_id → rol süzgeci o programın rolleri; G16):
    // u2 başka programda koordinatör olduğundan listelenmez.
    expect(lists().at(-1)!.query.get('program_id')).toBe('p1')
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
    const last = lists().at(-1)!
    expect(last.query.get('search')).toBe('ay')
    expect(last.query.get('cursor')).toBeNull()
  })

  it('koordinatörlük süzgeci: URL `koordinatorluk` → listUsers department_id (listMembers yok)', async () => {
    const { wrapper, router } = await mountPage()
    server.use(userListHandler(USERS))
    await wrapper.get('[data-testid="department-filter"]').trigger('click')
    await wrapper.get('[data-department="d2"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.query).toEqual({ koordinatorluk: 'd2' })
    const last = lists().at(-1)!
    expect(last.query.get('department_id')).toBe('d2')
    expect(last.query.get('program_id')).toBe('p1')
    expect(sent('GET', '/v1/departments/d2/members')).toHaveLength(0)
  })
})

/** jsdom'da yerleşim yok: panel (aside) listenin altında (`true`) ya da yanında (`false`). */
function stackedLayout(stacked: boolean): void {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const top = this.tagName === 'ASIDE' && stacked ? 900 : 0
    return {
      top,
      bottom: top + 10,
      left: 0,
      right: 0,
      width: 0,
      height: 10,
      x: 0,
      y: top,
    } as DOMRect
  })
}

describe('UsersPage — yan panel ve yaşam döngüsü', () => {
  it.each(['close', 'escape'])(
    'panel %s ile kapanınca odağı satır düğmesine döndürür',
    async (method) => {
      stackedLayout(true)
      const { wrapper } = await mountPage()
      const trigger = wrapper.get('[data-account="u1"][role="row"] [data-testid="user-open"]')
      ;(trigger.element as HTMLElement).focus()
      await trigger.trigger('click')
      await settle()
      const aside = wrapper.get('aside')
      if (method === 'close') await wrapper.get('[data-testid="panel-close"]').trigger('click')
      else await aside.trigger('keydown', { key: 'Escape' })
      await settle()
      expect(document.activeElement).toBe(trigger.element)
    },
  )

  it('kapanış beklerken başka satır seçilirse eski kapanış odağı çalmaz', async () => {
    const { wrapper } = await mountPage()
    await wrapper.get('[data-account="u1"][role="row"] [data-testid="user-open"]').trigger('click')
    await settle()
    const close = wrapper.get('[data-testid="panel-close"]')
    const next = wrapper.get('[data-account="u2"][role="row"] [data-testid="user-open"]')
    const closing = close.trigger('click')
    ;(next.element as HTMLElement).focus()
    const selecting = next.trigger('click')
    await Promise.all([closing, selecting])
    await settle()
    expect(wrapper.get('[data-testid="user-panel"]').attributes('data-account')).toBe('u2')
    expect(document.activeElement).toBe(next.element)
  })

  it('seçilen satır yoksa kapatınca aramaya odaklanır', async () => {
    const { wrapper } = await mountPage()
    await wrapper.get('[data-account="u1"][role="row"] [data-testid="user-open"]').trigger('click')
    await settle()
    wrapper.get('[data-account="u1"][role="row"]').element.remove()
    wrapper.getComponent(UserPanel).vm.$emit('deleted')
    await settle()
    expect(document.activeElement).toBe(wrapper.get('[data-testid="users-search"]').element)
  })

  it('derin bağlantı: yüklü kişi → panel açık; kapat → `secili` silinir', async () => {
    const { wrapper, router } = await mountPage('/kullanicilar?secili=u2')
    expect(wrapper.get('[data-testid="user-panel"]').attributes('data-account')).toBe('u2')
    expect(wrapper.get('[data-account="u2"][role="row"]').classes()).toContain('rp-sel')

    await wrapper.get('[data-testid="panel-close"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.query.secili).toBeUndefined()
    expect(wrapper.find('[data-testid="user-panel"]').exists()).toBe(false)
  })

  it('derin bağlantı: listede olmayan kişi → readUser ile panel açılır (BE-043)', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/admin/users/zz`, () =>
        json(knownUser('zz', 'Zeki Öz', ['p1:d3:uye'], { email: 'zeki@ornek.test' })),
      ),
    )
    const { wrapper } = await mountPage('/kullanicilar?secili=zz')
    await settle()
    expect(sent('GET', '/v1/admin/users/zz')).toHaveLength(1)
    expect(wrapper.get('[data-testid="user-panel"]').attributes('data-account')).toBe('zz')
    expect(wrapper.find('[data-testid="users-selected-missing"]').exists()).toBe(false)
  })

  it('derin bağlantı: readUser 404 → panel kapalı + bilgi', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/admin/users/zz`, () =>
        errorEnvelope('organization.account_not_found', 404),
      ),
    )
    const { wrapper } = await mountPage('/kullanicilar?secili=zz')
    await settle()
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

  it('panel listenin altına sardığında (K-8): satır seçimi panele kaydırır ve odağı taşır; derin bağlantıda odak çalınmaz', async () => {
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    stackedLayout(true)
    const { wrapper } = await mountPage('/kullanicilar?secili=u2')
    await settle()
    expect(scroll).not.toHaveBeenCalled()
    await wrapper.get('[data-account="u1"][role="row"]').trigger('click')
    await settle()
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(scroll.mock.contexts[0]).toBe(wrapper.get('aside.rp-aside').element)
    expect(document.activeElement).toBe(wrapper.get('aside.rp-aside').element)
    expect(wrapper.get('aside.rp-aside').attributes('tabindex')).toBe('-1')
  })

  it('panel yan sütunda:  kaydırma ve odak taşıma yok', async () => {
    const scroll = vi.fn()
    Element.prototype.scrollIntoView = scroll
    stackedLayout(false)
    const { wrapper } = await mountPage()
    await wrapper.get('[data-account="u1"][role="row"]').trigger('click')
    await settle()
    expect(scroll).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(wrapper.get('aside.rp-aside').element)
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
