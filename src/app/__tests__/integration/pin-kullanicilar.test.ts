// WP3 · İş 2 (c): 05 rol sekmeleri program değişiminde (K/Ü `program_id`; Tümü/Admin kapsamsız;
// `role_counts`) ve hesap kapat/aç (BE-012) sonrası liste + sayaç + panel. Üretim router + kabuk +
// durumlu sahte backend (v0.14/0.15 `listUsers`: `total`, `role_counts`, `program_id`, `role`).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  boot,
  click,
  createBackend,
  idle,
  PEOPLE,
  seedWorld,
  switchScope,
  teardown,
  toasts,
  until,
} from './harness'
import { ADMIN_ADMIN } from './timeline-support'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const USERS = '/v1/admin/users'

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedWorld(backend.db)
  await boot({ ...ADMIN_ADMIN, path: '/kullanicilar' })
  await until(() => $('.users-tabs'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const tabButton = (label: string) =>
  $$('.users-tabs .rp-seg button').find((b) => b.textContent?.trim().startsWith(label)) ?? null
const tabCount = (label: string): number | null => {
  const text = tabButton(label)?.querySelector('.rp-count')?.textContent
  return text ? Number(text.replace(/[()]/g, '')) : null
}
const counts = () => ({
  tumu: tabCount('Tümü'),
  admin: tabCount('Admin'),
  koordinator: tabCount('Koordinatör'),
  uye: tabCount('Üye'),
})
const rows = () =>
  $$('[role="row"][data-account]')
    .map((r) => r.dataset.account)
    .sort()
/** Liste okuması (sayaç okumaları `limit=1`). */
const lastList = () =>
  backend
    .sent('GET', USERS)
    .filter((r) => r.query.get('limit') !== '1')
    .at(-1)!

describe('(c) rol sekmeleri program değişiminde', () => {
  it('K/Ü sayaçları programa daralır; Tümü/Admin kapsamsız kalır', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: '/kullanicilar' })
    await until(() => counts().uye !== null && counts().tumu !== null, 'sekme sayaçları')
    await idle(app.queryClient)
    // p1: Yasemin + Kerem koordinatör; Ayşe + Cem üye; 5 hesap, 1 yönetici.
    expect(counts()).toEqual({ tumu: 5, admin: 1, koordinator: 2, uye: 2 })

    await switchScope('Program', 'Teknofest 2027')
    // p2 (yalnız Fuar, Cem üye): K 0, Ü 1; Tümü ve Admin değişmez (şirket çapı).
    await until(() => counts().uye === 1, 'p2 üye sayacı')
    await idle(app.queryClient)
    expect(counts()).toEqual({ tumu: 5, admin: 1, koordinator: 0, uye: 1 })
    // Sayaç isteği K/Ü için program süzgeciyle, Tümü için süzgeçsiz birlikte geldi (role_counts).
    const withProgram = backend.sent('GET', USERS).filter((r) => r.query.get('program_id') === 'p2')
    expect(withProgram.length).toBeGreaterThan(0)
  })

  it('Üye sekmesi: yalnız o programın üyeleri; Tümü’ne dönünce kapsamsız liste', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: '/kullanicilar' })
    await until(() => counts().uye === 2, 'sekme sayaçları')
    await switchScope('Program', 'Teknofest 2027')
    await until(() => counts().uye === 1, 'p2 sayaçları')
    await click(() => tabButton('Üye'))
    await until(() => rows().length === 1, 'üye listesi')
    expect(rows()).toEqual([PEOPLE.second.account_id])
    expect(lastList().query.get('role')).toBe('uye')
    expect(lastList().query.get('program_id')).toBe('p2')

    await click(() => tabButton('Tümü'))
    await until(() => rows().length === 5, 'tümü listesi')
    // Tümü kapsamsız (program anahtarda yok): önbellekteki liste yeniden kullanılır ya da
    // süzgeçsiz istenir; programlı bir Tümü isteği HİÇ gitmez.
    const unscoped = (r: { query: URLSearchParams }) =>
      !r.query.get('role') && r.query.get('limit') !== '1' // sayaç okumaları (limit=1) ayrı
    expect(
      backend
        .sent('GET', USERS)
        .filter(unscoped)
        .every((r) => !r.query.has('program_id')),
    ).toBe(true)

    await click(() => tabButton('Admin'))
    await until(() => rows().length === 1, 'admin listesi')
    expect(rows()).toEqual([PEOPLE.admin.account_id])
    const admin = backend.sent('GET', USERS).filter((r) => r.query.get('role') === 'company_admin')
    expect(admin.length).toBeGreaterThan(0)
    expect(admin.every((r) => !r.query.has('program_id'))).toBe(true)
    await idle(app.queryClient)
  })
})

describe('(c) hesap kapat / aç (BE-012)', () => {
  const panel = (id: string) => `[data-testid="user-panel"][data-account="${id}"]`
  const CEM = PEOPLE.second.account_id

  it('kapat: onay → panel “kapalı” ve “Etkinleştir”; liste yeniden okunur; sayaçlar şirket çapında aynı', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: `/kullanicilar?secili=${CEM}` })
    await until(() => $(panel(CEM)), 'panel')
    await until(() => counts().uye === 2, 'sekme sayaçları')
    const listsBefore = backend.sent('GET', USERS).length
    expect($('[data-testid="panel-disabled"]')).toBeNull()

    await click('[data-testid="account-lock"]')
    await click('[data-testid="confirm-accept"]')
    await until(() => $('[data-testid="panel-disabled"]'), 'panel kapalı işareti')
    await until(() => $('[data-testid="account-enable"]'), '“Etkinleştir”')
    await idle(app.queryClient)
    expect(backend.sent('POST', `/v1/admin/accounts/${CEM}/disable`)).toHaveLength(1)
    expect(backend.db.accounts.find((a) => a.account_id === CEM)!.disabled).toBe(true)
    expect(backend.sent('GET', USERS).length).toBeGreaterThan(listsBefore) // liste yenilendi
    // Kapalı hesap listeden düşmez, rol sayaçlarında kalır (hesap silinmedi).
    expect(counts()).toEqual({ tumu: 5, admin: 1, koordinator: 2, uye: 2 })
    expect(rows()).toContain(CEM)
    expect(toasts()).not.toBe('')
  })

  it('aç: panel eski haline döner; ikinci kapatma idempotent değil istek üretmez', async () => {
    backend.db.accounts.find((a) => a.account_id === CEM)!.disabled = true
    const app = await boot({ ...ADMIN_ADMIN, path: `/kullanicilar?secili=${CEM}` })
    await until(() => $('[data-testid="panel-disabled"]'), 'kapalı panel')
    await click('[data-testid="account-enable"]')
    await until(() => !$('[data-testid="panel-disabled"]'), 'kapalı işareti kalktı')
    await until(() => $('[data-testid="account-lock"]'), '“Kilitle”')
    await idle(app.queryClient)
    expect(backend.sent('POST', `/v1/admin/accounts/${CEM}/enable`)).toHaveLength(1)
    expect(backend.db.accounts.find((a) => a.account_id === CEM)!.disabled).toBe(false)
    expect(counts()).toEqual({ tumu: 5, admin: 1, koordinator: 2, uye: 2 })
  })

  it('05b kişisel takipte de durum aynı: kapatma sonrası “Hesap” sekmesi “Etkinleştir” gösterir', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: `/kullanicilar/${CEM}?sekme=hesap` })
    await click('[data-panel="hesap"] [data-testid="account-lock"]')
    await click('[data-testid="confirm-accept"]')
    await until(() => $('[data-panel="hesap"] [data-testid="account-enable"]'), '“Etkinleştir”')
    await app.router.push(`/kullanicilar?secili=${CEM}`)
    await until(() => $('[data-testid="panel-disabled"]'), '05 paneli kapalı')
    await idle(app.queryClient)
  })
})
