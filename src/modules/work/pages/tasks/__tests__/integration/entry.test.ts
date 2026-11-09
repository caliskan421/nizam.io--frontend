// W48 ek madde 8 — ana sayfa "Yeni görev" hızlı işlemi (`/gorevler?yeni=1`, katalog `yeni: bool`):
// yetkili kullanıcıda form açılır ve parametre `replace` ile düşer (geri/ileri formu yeniden
// açmaz); yetkisizde parametre yok sayılır (capability).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { server, workItem } from '../../../../model/__tests__/harness'
import type { StandingFixture } from '../page-harness'
import { backendHandlers, body, fakeWork, mountApp, settle, unmountApps } from './harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => unmountApps())
afterAll(() => server.close())

const COORD: StandingFixture = {
  companyAdmin: false,
  rows: [{ department_id: 'd1', role: 'koordinator' }],
}
const MEMBER: StandingFixture = {
  companyAdmin: false,
  rows: [{ department_id: 'd1', role: 'uye' }],
}
const ITEMS = () => [workItem({ work_item_id: 'w1', department_id: 'd1' })]

const dialog = () => body().find('[role="dialog"]')

/** Ana sayfadan hızlı işlemle gelinir: geçmiş `/` → `/gorevler?yeni=1`. */
async function fromHome(standing: StandingFixture, lens: 'coordinator' | 'member') {
  server.use(...backendHandlers(standing, fakeWork(ITEMS())))
  const ctx = await mountApp({ programId: 'p1', lens, departmentId: 'd1' }, '/')
  await ctx.router.push('/gorevler?yeni=1')
  await settle(ctx.queryClient)
  return ctx
}

describe('W48 · "Yeni görev" girişi (?yeni=1)', () => {
  it('yetkili: form açılır, yeni URL’den düşer; geri/ileri formu yeniden açmaz', async () => {
    const ctx = await fromHome(COORD, 'coordinator')
    expect(dialog().exists()).toBe(true)
    expect(dialog().text()).toContain('Yeni görev')
    expect(ctx.router.currentRoute.value.fullPath).toBe('/gorevler')

    await dialog().find<HTMLButtonElement>('.t-modal__foot button').trigger('click')
    await settle(ctx.queryClient)
    expect(dialog().exists()).toBe(false)

    ctx.router.back()
    await settle(ctx.queryClient)
    expect(ctx.router.currentRoute.value.name).toBe('home')
    ctx.router.forward()
    await settle(ctx.queryClient)
    expect(ctx.router.currentRoute.value.fullPath).toBe('/gorevler')
    expect(dialog().exists()).toBe(false)
  })

  it('yetkisiz (üye): parametre yok sayılır, form yok; URL temizlenir', async () => {
    const ctx = await fromHome(MEMBER, 'member')
    expect(dialog().exists()).toBe(false)
    expect(ctx.router.currentRoute.value.fullPath).toBe('/gorevler')
    expect(body().find('[data-work-item="w1"]').exists()).toBe(true)
  })
})
