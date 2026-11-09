// W76 · E-05-48 "Görev ata" girişi: `/gorevler?yeni=1&koordinatorluk=<birim>&atanan=<hesap>`.
// Hedef birim formun hedefi olur yalnız çağıranın o birimde görev açma yetkisi varsa (form
// seçenekleri `canManageWorkItem`; mercek ≠ yetki, P1) — liste süzgeci/mercek değişmez. Atanan
// formun birimindeki ekipteyse ön dolar, değilse sessizce düşer. `yeni` ve `atanan` URL'den düşer.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { server, workItem } from '../../../../model/__tests__/harness'
import type { StandingFixture } from '../page-harness'
import { backendHandlers, body, fakeWork, mountApp, unmountApps } from './harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => unmountApps())
afterAll(() => server.close())

const ADMIN: StandingFixture = { companyAdmin: true, rows: [] }
const ADMIN_COORD: StandingFixture = {
  companyAdmin: true,
  rows: [{ department_id: 'd1', role: 'koordinator' }],
}
const COORD: StandingFixture = {
  companyAdmin: false,
  rows: [{ department_id: 'd1', role: 'koordinator' }],
}
const MEMBER: StandingFixture = {
  companyAdmin: false,
  rows: [{ department_id: 'd1', role: 'uye' }],
}

const MEMBERS = [
  { account_id: 'acc-7', full_name: 'Bahar', membership_id: 'm7', role: 'uye', status: 'active' },
  { account_id: 'acc-8', full_name: 'Cem', membership_id: 'm8', role: 'uye', status: 'active' },
]
const ITEMS = () => [
  workItem({ work_item_id: 'w1', department_id: 'd1' }),
  workItem({ work_item_id: 'w2', department_id: 'd2' }),
]

const dialog = () => body().find('[role="dialog"]')
const field = (name: string) =>
  (document.querySelector(`[role="dialog"] [name="${name}"]`) as HTMLSelectElement).value

async function open(
  standing: StandingFixture,
  lens: 'admin' | 'coordinator' | 'member',
  query: string,
) {
  server.use(...backendHandlers(standing, fakeWork(ITEMS(), MEMBERS)))
  const selection =
    lens === 'admin'
      ? { programId: 'p1', lens, departmentId: null }
      : { programId: 'p1', lens, departmentId: 'd1' }
  return mountApp(selection, `/gorevler?${query}`)
}

describe('W76 · yeni görev girişi: hedef birim + ön atanan', () => {
  it('Admin merceği: hedef birim ve atanan ön dolu; yeni/atanan URL’den düşer', async () => {
    const ctx = await open(ADMIN, 'admin', 'yeni=1&koordinatorluk=d2&atanan=acc-7')
    expect(dialog().exists()).toBe(true)
    expect(field('departmentId')).toBe('d2')
    expect(field('assignee')).toBe('acc-7')
    const query = ctx.router.currentRoute.value.query
    expect(query.yeni).toBeUndefined()
    expect(query.atanan).toBeUndefined()
  })

  it('Koordinatör merceğindeki yönetici: yetkili birim formun hedefi; liste/mercek değişmez', async () => {
    const ctx = await open(ADMIN_COORD, 'coordinator', 'yeni=1&koordinatorluk=d2&atanan=acc-8')
    expect(field('departmentId')).toBe('d2')
    expect(field('assignee')).toBe('acc-8')
    expect(ctx.store.lens).toBe('coordinator')
    expect(ctx.store.departmentId).toBe('d1')
    expect(ctx.router.currentRoute.value.query.atanan).toBeUndefined()
  })

  it('ekipte olmayan atanan sessizce yok sayılır', async () => {
    await open(ADMIN, 'admin', 'yeni=1&koordinatorluk=d2&atanan=acc-x')
    expect(field('departmentId')).toBe('d2')
    expect(field('assignee')).toBe('')
  })

  it('yetkisiz birim yok sayılır: koordinatörün kendi önseçimi kalır', async () => {
    await open(COORD, 'coordinator', 'yeni=1&koordinatorluk=d2&atanan=acc-7')
    expect(dialog().exists()).toBe(true)
    expect(field('departmentId')).toBe('d1')
    // Atanan formun birimindeki (d1) ekipte: ön dolar.
    expect(field('assignee')).toBe('acc-7')
  })

  it('görev açma yetkisi olmayan kullanıcıda parametreler yok sayılır, URL temizlenir', async () => {
    const ctx = await open(MEMBER, 'member', 'yeni=1&koordinatorluk=d1&atanan=acc-7')
    expect(dialog().exists()).toBe(false)
    const query = ctx.router.currentRoute.value.query
    expect(query.yeni).toBeUndefined()
    expect(query.atanan).toBeUndefined()
  })

  it('form kapanınca ön değer düşer: sonraki açılış normaldir', async () => {
    const ctx = await open(ADMIN, 'admin', 'yeni=1&koordinatorluk=d2&atanan=acc-7')
    await dialog().find<HTMLButtonElement>('.t-modal__foot button').trigger('click')
    await ctx.router.push('/gorevler?yeni=1')
    const { settle } = await import('./harness')
    await settle(ctx.queryClient)
    expect(dialog().exists()).toBe(true)
    expect(field('assignee')).toBe('')
  })
})
