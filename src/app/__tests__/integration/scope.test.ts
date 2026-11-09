// W82a · senaryo (4): kapsam (program) değişimi gerçek kenar menüsü seçicisinden — açık panel,
// diyalog, süzgeç ve sıralama sıfırlanır, arama korunur; 08b birim yeni programda yoksa iletisi;
// sökülmüş bileşenin geç yanıtı yeni yazma/onay/bildirim üretmez (`owner_disposed`, KESİN 20).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  boot,
  byText,
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

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const ADMIN = { email: PEOPLE.admin.email, scope: { programId: 'p1', lens: 'admin' as const } }

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedWorld(backend.db)
  await boot({ ...ADMIN, path: '/kullanicilar' })
  await until(() => $('[role="row"][data-account]'), 'ısınma')
  teardown()
}, 30_000)
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const MEMBER = PEOPLE.member.account_id
const panel = () => $('[data-testid="user-panel"]')

describe('kapsam (program) değişimi', () => {
  it('05: panel ve koordinatörlük süzgeci düşer; arama ve rol sekmesi korunur', async () => {
    const app = await boot({
      ...ADMIN,
      path: `/kullanicilar?q=Ay&rol=uye&koordinatorluk=d1&secili=${MEMBER}`,
    })
    await until(() => panel(), 'derin bağlantıyla panel')
    await switchScope('Program', 'Teknofest 2027')
    await until(() => app.scope.programId === 'p2', 'kapsam p2')
    await until(() => !panel(), 'panel kapanır')
    expect(app.router.currentRoute.value.query).toEqual({ q: 'Ay', rol: 'uye' })
    await idle(app.queryClient)
  })

  it('05: açık "Kullanıcı oluştur" penceresi kapsam değişince kapanır', async () => {
    const app = await boot({ ...ADMIN, path: '/kullanicilar' })
    await click(() => byText('.users-page button', 'Kullanıcı oluştur'))
    await until(() => $('[role="dialog"] [name="email"]'), 'form')
    await switchScope('Program', 'Teknofest 2027')
    await until(() => app.scope.programId === 'p2')
    await until(() => !$('[role="dialog"]'), 'form kapanır')
  })

  it('08: açık form kapanır, sıralama varsayılana döner, arama korunur; ızgara yeni programdan', async () => {
    const app = await boot({ ...ADMIN, path: '/koordinatorlukler?q=Fu&sirala=ad:azalan' })
    await until(() => $('[data-testid="coords-filtered-empty"]'), 'p1’de "Fu" yok')
    await click(() => byText('.coords-page button', 'Yeni koordinatörlük'))
    await until(() => $('[role="dialog"] [name="name"]'), 'form')
    await switchScope('Program', 'Teknofest 2027')
    await until(() => !$('[role="dialog"]'), 'form kapanır')
    await until(() => $('[data-department="d3"]'), 'p2 ızgarası (Fuar)')
    expect(app.router.currentRoute.value.query).toEqual({ q: 'Fu' })
  })

  it('08b: birim yeni programda yoksa "seçili programda bulunamadı"; açık Üye ekle kapanır', async () => {
    const app = await boot({ ...ADMIN, path: '/koordinatorlukler/d1?sekme=uyeler' })
    await click('[data-action="members-add"]')
    await until(() => $('[role="dialog"] [name="person-search"]'), 'Üye ekle')
    await switchScope('Program', 'Teknofest 2027')
    await until(() => $('[data-state="missing"]'), 'birim yok iletisi')
    expect($('[data-state="missing"]')?.textContent).toContain(
      'Bu koordinatörlük seçili programda yok',
    )
    expect($('[role="dialog"]')).toBeNull()
    // Bulunamayan birim için yeni programla ekip isteği yok.
    const members = backend.sent('GET', '/v1/departments/d1/members')
    expect(members.every((r) => r.headers.get('X-Nizamio-Program') === 'p1')).toBe(true)
    await idle(app.queryClient)
  })

  it('sökülmüş panel: geç 409 onay açmaz, ikinci istek ve bildirim yok (owner_disposed)', async () => {
    const app = await boot({ ...ADMIN, path: `/kullanicilar?secili=${MEMBER}` })
    const chip = await until(() => $('[data-testid="user-panel"] [data-chip="d1"]'), 'çip')
    const late = backend.hold('DELETE', `/v1/departments/d1/memberships/${MEMBER}`)
    chip.querySelector<HTMLElement>('[data-testid="chip-remove"]')!.click()
    await late.arrived
    await switchScope('Program', 'Teknofest 2027')
    await until(() => !panel(), 'panel söküldü')
    late.release()
    await idle(app.queryClient)
    expect($('[data-testid="confirm-dialog"]')).toBeNull()
    expect(backend.sent('DELETE', `/v1/departments/d1/memberships/${MEMBER}`)).toHaveLength(1)
    expect(toasts()).toBe('')
    expect(backend.db.memberships.some((m) => m.account_id === MEMBER)).toBe(true)
  })
})
