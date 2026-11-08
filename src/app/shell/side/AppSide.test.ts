import { flushPromises, mount } from '@vue/test-utils'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, provide, ref } from 'vue'

import { useSessionStore } from '@/shared/session/store'

import AppSide from './AppSide.vue'
import {
  createFakeLifecycle,
  sideContext,
  type FakeScopeState,
  type SideContext,
} from './__tests__/fake-lifecycle'
import { SCOPE_LIFECYCLE_KEY } from './scope-key'

afterEach(() => {
  document.body.innerHTML = ''
})

const MULTI: Partial<FakeScopeState> = {
  programs: [
    { programId: 'p1', name: 'Program Bir', year: 2026 },
    { programId: 'p2', name: 'Program İki', year: null },
  ],
  lenses: [
    { lens: 'admin', departmentCount: 0 },
    { lens: 'coordinator', departmentCount: 2 },
    { lens: 'member', departmentCount: 3 },
  ],
}

function mountSide(
  ctx: SideContext,
  lifecycle: ReturnType<typeof createFakeLifecycle>['lifecycle'],
  collapsed = false,
) {
  const state = ref(collapsed)
  const updates: boolean[] = []
  const Host = defineComponent({
    setup() {
      provide(SCOPE_LIFECYCLE_KEY, lifecycle)
      return () =>
        h(AppSide, {
          collapsed: state.value,
          'onUpdate:collapsed': (value: boolean) => {
            updates.push(value)
            state.value = value
          },
        })
    },
  })
  const wrapper = mount(Host, {
    global: {
      plugins: [ctx.pinia, [VueQueryPlugin, { queryClient: ctx.queryClient }], ctx.router],
    },
    attachTo: document.body,
  })
  return { wrapper, state, updates }
}

async function boot(initial: Partial<FakeScopeState> = {}, collapsed = false) {
  const ctx = await sideContext()
  const fake = createFakeLifecycle(initial)
  fake.store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const mounted = mountSide(ctx, fake.lifecycle, collapsed)
  await flushPromises()
  return { ctx, ...fake, ...mounted }
}

const card = (name: string) => `[aria-label^="${name}:"]`

describe('AppSide — geniş menü', () => {
  it('marka, kapsam kartları, menü ve oturum kartı', async () => {
    const { wrapper } = await boot()
    expect(wrapper.text()).toContain('RoketPortal')
    const program = wrapper.get(card('Program'))
    expect(program.attributes('aria-label')).toBe('Program: Program Bir')
    expect(program.attributes('aria-haspopup')).toBe('menu')
    expect(program.text()).toContain('PB')
    // P11: tek mercek → Rol kartı salt gösterim (menü düğmesi değil).
    expect(wrapper.find(card('Rol')).exists()).toBe(false)
    const role = wrapper.get('.side-card--static')
    expect(role.text()).toContain('Admin')
    expect(role.attributes('aria-haspopup')).toBeUndefined()
    await role.trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    // E-00-06: Admin merceğinde koordinatörlük kartı yok.
    expect(wrapper.find(card('Koordinatörlük')).exists()).toBe(false)
    // Menü: F1 → Ana sayfa ve Görevler canlı (devre dışı öğe yok); Yardım yok.
    const nav = wrapper.get('nav[aria-label="Ana menü"]')
    expect(nav.get('a[href="/"]').text()).toContain('Ana sayfa')
    expect(nav.get('a[href="/gorevler"]').text()).toContain('Görevler')
    expect(nav.find('a[aria-disabled="true"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Yardım')
    expect(wrapper.text()).toContain('Deneme Kişi')
    expect(wrapper.text()).toContain('kisi@example.test')
  })

  it('yükleniyorken kartlar ve oturum kartı yok', async () => {
    const { wrapper } = await boot({ status: 'loading', standing: null })
    expect(wrapper.find('.side-card').exists()).toBe(false)
    expect(wrapper.find('.side-account').exists()).toBe(false)
  })

  it('klavye: kart → menü (menuitemradio) → ok tuşları → seçim → odak karta döner', async () => {
    const { wrapper, lifecycle } = await boot(MULTI)
    const program = wrapper.get(card('Program'))
    await program.trigger('keydown', { key: 'ArrowDown' })
    const menu = wrapper.get('[role="menu"][aria-label="Program seç"]')
    expect(program.attributes('aria-expanded')).toBe('true')
    const items = menu.findAll('[role="menuitemradio"]')
    expect(items.map((i) => i.attributes('aria-checked'))).toEqual(['true', 'false'])
    expect(items[0]!.text()).toContain('2026 sezonu')
    expect(items[1]!.text()).not.toContain('sezonu')
    expect(document.activeElement).toBe(items[0]!.element)
    await menu.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items[1]!.element)
    await items[1]!.trigger('click')
    await flushPromises()
    expect(lifecycle.selectProgram).toHaveBeenCalledWith('p2')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get(card('Program')).element)
  })

  it('Esc ve perde menüyü kapatır, odak karta döner; tek menü açık', async () => {
    const { wrapper } = await boot(MULTI)
    const role = wrapper.get(card('Rol'))
    await role.trigger('click')
    expect(wrapper.findAll('[role="menu"]')).toHaveLength(1)
    await wrapper.get(card('Program')).trigger('click')
    expect(wrapper.get('[role="menu"]').attributes('aria-label')).toBe('Program seç')
    await wrapper.get('[role="menu"]').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get(card('Program')).element)

    await wrapper.get(card('Rol')).trigger('click')
    await wrapper.get('.side-scrim').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get(card('Rol')).element)
  })

  it('rol menüsü: seçili olmayan K/Ü satırında birim sayısı; seçim mercek değiştirir', async () => {
    const { wrapper, lifecycle, store } = await boot({
      ...MULTI,
      departments: [{ departmentId: 'd1', displayName: 'Sistem' }],
    })
    await wrapper.get(card('Rol')).trigger('click')
    const rows = wrapper.get('[aria-label="Rol seç"]').findAll('[role="menuitemradio"]')
    expect(rows.map((r) => r.text())).toEqual(['Admin', 'Koordinatör2', 'Üye3'])
    await rows[1]!.trigger('click')
    await flushPromises()
    expect(lifecycle.selectLens).toHaveBeenCalledWith('coordinator')
    expect(store.lens).toBe('coordinator')
    store.setDepartment('d1')
    await flushPromises()
    expect(wrapper.get(card('Rol')).classes()).toContain('side-card--coordinator')
    const dept = wrapper.get(card('Koordinatörlük'))
    expect(dept.attributes('aria-label')).toBe('Koordinatörlük: Sistem')
    await dept.trigger('click')
    const menu = wrapper.get('[aria-label="Koordinatörlük seç"]')
    expect(menu.text()).toContain('Koordinatör olduğun birimler')
  })

  it('seçim bekleniyor (çok program, hatırlanan yok) → seçici açık, odak çalınmaz', async () => {
    const ctx = await sideContext()
    const fake = createFakeLifecycle({ ...MULTI, status: 'selecting', pending: 'program' })
    const outside = document.createElement('button')
    document.body.append(outside)
    outside.focus()
    const { wrapper } = mountSide(ctx, fake.lifecycle)
    await flushPromises()
    expect(wrapper.get('[role="menu"]').attributes('aria-label')).toBe('Program seç')
    expect(wrapper.get(card('Program')).attributes('aria-label')).toBe('Program: Seçin')
    expect(document.activeElement).toBe(outside)
  })

  it('272 px: metinler kırpılır, kart ızgarası taşmaz (yapı)', async () => {
    const long = 'Çok uzun program adı '.repeat(8).trim()
    const { wrapper } = await boot({ programs: [{ programId: 'p1', name: long, year: 2026 }] })
    const value = wrapper.get(card('Program')).get('.side-card__v .rp-trunc')
    expect(value.text()).toBe(long)
    expect(wrapper.find('.side-pair').exists()).toBe(true)
    expect(wrapper.get('.side-account__name').classes()).toContain('rp-trunc')
    expect(wrapper.get('.side-account__mail').classes()).toContain('rp-trunc')
  })

  it('daralt düğmesi update:collapsed(true) yayar', async () => {
    const { wrapper, updates } = await boot()
    await wrapper.get('[aria-label="Menüyü daralt"]').trigger('click')
    expect(updates).toEqual([true])
    expect(wrapper.get('aside').classes()).toContain('rp-side--rail')
  })

  it('çıkış: session.logout + giriş ekranı', async () => {
    const { wrapper, ctx } = await boot()
    const session = useSessionStore()
    const logout = vi.spyOn(session, 'logout').mockResolvedValue('verified')
    await wrapper.get('[aria-label="Çıkış yap"]').trigger('click')
    await flushPromises()
    expect(logout).toHaveBeenCalledWith(ctx.queryClient)
    expect(ctx.router.currentRoute.value.name).toBe('identity.session')
  })
})

describe('AppSide — dar menü (76 px, E-00-40)', () => {
  it('kapsam simgeleri görünür; tık → genişler ve ilgili seçici açılır', async () => {
    const { wrapper, store, updates, state } = await boot(
      {
        ...MULTI,
        departments: [
          { departmentId: 'd1', displayName: 'Sistem koordinatörlüğü' },
          { departmentId: 'd2', displayName: 'Eğitim' },
        ],
      },
      true,
    )
    store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    await flushPromises()
    expect(wrapper.get('aside').classes()).toContain('rp-side--rail')
    const rail = wrapper.get('[data-testid="rail-scope"]')
    expect(rail.get(card('Program')).text()).toBe('PB')
    expect(rail.get(card('Rol')).find('.side-dot--coordinator').exists()).toBe(true)
    expect(rail.get(card('Koordinatörlük')).text()).toBe('SK')
    // Dar hâlde rozet, yardım, çıkış ve kart metinleri yok; öğelerde aria-label + title.
    expect(wrapper.find('[aria-label="Çıkış yap"]').exists()).toBe(false)
    const home = wrapper.get('nav a[href="/"]')
    expect(home.attributes('aria-label')).toBe('Ana sayfa')
    expect(home.attributes('title')).toBe('Ana sayfa')

    await rail.get(card('Koordinatörlük')).trigger('click')
    await flushPromises()
    expect(updates).toEqual([false])
    expect(state.value).toBe(false)
    const menu = wrapper.get('[role="menu"]')
    expect(menu.attributes('aria-label')).toBe('Koordinatörlük seç')
    expect(document.activeElement?.getAttribute('aria-checked')).toBe('true')
  })

  it('Admin merceğinde birim simgesi yok; logo düğmesi genişletir', async () => {
    const { wrapper, updates } = await boot({}, true)
    const rail = wrapper.get('[data-testid="rail-scope"]')
    expect(rail.find(card('Koordinatörlük')).exists()).toBe(false)
    expect(rail.get('[role="img"]').attributes('aria-label')).toBe('Rol: Admin')
    await wrapper.get('.rp-raillogo').trigger('click')
    expect(updates).toEqual([false])
  })

  it('seçim bekleniyorken dar menü genişletilir', async () => {
    const { updates } = await boot({ ...MULTI, status: 'selecting', pending: 'lens' }, true)
    expect(updates).toEqual([false])
  })
})
