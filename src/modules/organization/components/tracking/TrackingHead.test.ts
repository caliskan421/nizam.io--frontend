import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { resetHarness } from '../../__tests__/harness'
import { mountAt, server, settle, standingHandlers, unmountAll } from './__tests__/tracking-harness'
import TrackingHead from './TrackingHead.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

const MEK = { departmentId: 'd1', name: 'Mekanik', code: 'MEK' }
const IDARI = { departmentId: 'd2', name: 'İdari işler', code: null }

function props(patch: Record<string, unknown> = {}) {
  return {
    accountId: 'u1',
    name: 'Bahar Kılıç',
    resolved: true,
    roles: ['member'],
    units: [MEK],
    ...patch,
  }
}

describe('profil başlığı (E-05-41…47)', () => {
  it('ad, rozet "+n" (Admin yok), birim alt satırı; e-posta yok', async () => {
    server.use(...standingHandlers())
    const { wrapper } = await mountAt(
      TrackingHead,
      props({ roles: ['coordinator', 'member'], units: [IDARI, MEK] }),
    )
    expect(wrapper.find('[data-person-name]').text()).toBe('Bahar Kılıç')
    expect(wrapper.find('[data-avatar]').text()).toBe('BK')
    const badge = wrapper.find('[data-role]')
    expect(badge.text()).toBe('Koordinatör +1')
    expect(badge.attributes('title')).toBe('Üye')
    expect(wrapper.text()).not.toContain('Admin')
    expect(wrapper.find('[data-units]').text()).toBe('İdari işler +1')
  })

  it('birimi yoksa "Atanmamış"; kişi okunamadıysa alt satır yok; ad yüklenirken iskelet', async () => {
    server.use(...standingHandlers())
    const a = await mountAt(TrackingHead, props({ units: [] }))
    expect(a.wrapper.find('[data-units]').text()).toBe('Atanmamış')
    unmountAll()
    const b = await mountAt(TrackingHead, props({ units: null, name: null, resolved: false }))
    expect(b.wrapper.find('[data-units]').exists()).toBe(false)
    expect(b.wrapper.find('[data-name-skeleton]').exists()).toBe(true)
    expect(b.wrapper.find('h1').exists()).toBe(false)
  })

  it('Profili düzenle → 05 yan paneli; Mesaj/Kişisel rapor açıklamalı devre dışı, istek yok', async () => {
    server.use(...standingHandlers())
    const { wrapper, router } = await mountAt(TrackingHead, props())
    expect(wrapper.find('[data-edit-profile]').attributes('href')).toBe('/kullanicilar?secili=u1')
    const message = wrapper.find('[data-phase="message"]')
    expect(message.attributes('aria-disabled')).toBe('true')
    expect(message.attributes('aria-label')).toBe('Mesaj — F7’de açılacak')
    expect(wrapper.find('[data-phase="report"]').attributes('title')).toBe(
      'Kişisel rapor — F6’da açılacak',
    )
    await message.trigger('click')
    await settle()
    expect(router.currentRoute.value.path).toBe('/kullanicilar/u1')
  })
})

describe('Görev ata (E-05-48, P15)', () => {
  it('tek birim: doğrudan yeni görev girişi, hedef birim ön seçili', async () => {
    server.use(...standingHandlers())
    const { wrapper, router } = await mountAt(TrackingHead, props())
    await wrapper.find('[data-assign]').trigger('click')
    await settle()
    expect(router.currentRoute.value.name).toBe('work.tasks')
    expect(router.currentRoute.value.query).toEqual({ yeni: '1', koordinatorluk: 'd1' })
  })

  it('çok birimli kişide seçim zorunlu', async () => {
    server.use(...standingHandlers())
    const { wrapper, router } = await mountAt(TrackingHead, props({ units: [IDARI, MEK] }))
    await wrapper.find('[data-assign]').trigger('click')
    await settle()
    const form = document.querySelector<HTMLFormElement>('[data-assign-form]')!
    expect(form).not.toBeNull()
    form.requestSubmit()
    await settle()
    expect(document.body.textContent).toContain('Koordinatörlük seçin')
    expect(router.currentRoute.value.name).toBe('organization.user')

    const select = form.querySelector('select')!
    expect([...select.options].map((o) => o.value)).toEqual(['', 'd2', 'd1'])
    select.value = 'd2'
    select.dispatchEvent(new Event('change'))
    form.requestSubmit()
    await settle()
    expect(router.currentRoute.value.query).toEqual({ yeni: '1', koordinatorluk: 'd2' })
  })

  it('kapsam değişince açık seçici kapanır', async () => {
    server.use(...standingHandlers())
    const { wrapper, store } = await mountAt(TrackingHead, props({ units: [IDARI, MEK] }))
    await wrapper.find('[data-assign]').trigger('click')
    await settle()
    expect(document.querySelector('[data-assign-form]')).not.toBeNull()
    store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await settle()
    expect(document.querySelector('[data-assign-form]')).toBeNull()
  })

  it('birimsiz ya da okunamayan kişide devre dışı + açıklama', async () => {
    server.use(...standingHandlers())
    const a = await mountAt(TrackingHead, props({ units: [] }))
    const button = a.wrapper.find('[data-assign]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('title')).toBe('Kişinin bu programda koordinatörlüğü yok')
    unmountAll()
    const b = await mountAt(TrackingHead, props({ units: null }))
    expect(b.wrapper.find('[data-assign]').attributes('title')).toBe(
      'Kişinin koordinatörlükleri okunamadı',
    )
  })

  it('salt üyede (görev açma yetkisi yok) gizli; koordinatörde görünür', async () => {
    server.use(...standingHandlers(false, [{ department_id: 'd1', role: 'uye' }]))
    const a = await mountAt(TrackingHead, props())
    expect(a.wrapper.find('[data-assign]').exists()).toBe(false)
    unmountAll()
    resetHarness()
    server.use(...standingHandlers(false, [{ department_id: 'd1', role: 'koordinator' }]))
    const b = await mountAt(TrackingHead, props())
    expect(b.wrapper.find('[data-assign]').exists()).toBe(true)
  })
})
