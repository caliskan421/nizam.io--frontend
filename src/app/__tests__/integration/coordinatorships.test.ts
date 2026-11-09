// W82a · senaryo (1) ve (3): 08 ızgarası → 08b → gerçek formlar (MemberAddDialog,
// CoordinatorAssignDialog, DepartmentForm) → sayaçlar, 05 listesi, kenar menüsü kapsamı.
// Üretim kökü + router + kabuk + durumlu sahte backend (harness.ts). Taslak yok.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  boot,
  byText,
  click,
  createBackend,
  fill,
  idle,
  pickPerson,
  PEOPLE,
  seedWorld,
  teardown,
  toasts,
  until,
} from './harness'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const ADMIN = { email: PEOPLE.admin.email, scope: { programId: 'p1', lens: 'admin' as const } }

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedWorld(backend.db)
  await boot({ ...ADMIN, path: '/koordinatorlukler' })
  await until(() => $('[data-department="d1"]'), 'ısınma')
  teardown()
}, 30_000)
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const card = (id: string) => $(`[data-department="${id}"]`)
const cardNumber = (id: string, what: 'members' | 'tasks') =>
  card(id)?.querySelector(`[data-testid="${what}"]`)?.textContent?.trim()

const row = (accountId: string) => $(`[role="row"][data-account="${accountId}"]`)
const coordCell = (accountId: string) =>
  row(accountId)?.querySelector('[data-testid="user-coord"]')?.textContent?.trim()
const nav = (label: string) => click(() => byText('nav a', label))
const tab = (value: string) => $(`[role="tab"][data-value="${value}"]`)

describe('08 → 08b → Üye ekle (senaryo 1)', () => {
  it('Üye ekle (gerçek MemberAddDialog) → Ekip ve Üyeler sayaçları, 05 listesi yenilenir', async () => {
    const app = await boot({ ...ADMIN, path: '/kullanicilar' })
    await until(() => row(PEOPLE.free.account_id), '05 satırı')
    expect(coordCell(PEOPLE.free.account_id)).toBe('Atanmamış')

    await nav('Koordinatörlükler')
    await until(() => cardNumber('d1', 'members') === '3', '08 kart sayısı')
    await click(() => byText('a', 'Mekanik', card('d1')!))
    await until(() => app.router.currentRoute.value.name === 'organization.coordinatorship')
    await until(() => $('[data-testid="cd-team-count"]')?.textContent?.trim() === '3', 'Ekip 3')
    expect(tab('uyeler')?.textContent).toContain('3')

    await click('[data-action="team-add"]')
    await pickPerson(PEOPLE.free.account_id)
    await click('[role="dialog"] [data-testid="of-submit"]')
    await until(() => !$('[role="dialog"]'), 'diyalog kapanır')
    await until(() => $('[data-testid="cd-team-count"]')?.textContent?.trim() === '4', 'Ekip 4')
    expect(tab('uyeler')?.textContent).toContain('4')
    expect(toasts()).toContain('Üye eklendi.')
    const [add] = backend.sent('POST', '/v1/departments/d1/memberships')
    expect(add!.headers.get('X-Nizamio-Program')).toBe('p1')

    await click(() => tab('uyeler'))
    await until(() => $(`[data-member="${PEOPLE.free.account_id}"]`), 'Üyeler sekmesinde yeni kişi')

    await nav('Kullanıcılar')
    await until(() => coordCell(PEOPLE.free.account_id) === 'Mekanik', '05 listesi yenilendi')

    // Açık uç (ortak-kurallar §6): pano yazmayla geçersizlenmez, odakta tazelenir (`staleTime`
    // 60 sn içinde odak da tazelemez). 08b'den yapılan yazma 08 kartını tazelemez — tasarım kararı.
    await nav('Koordinatörlükler')
    await until(() => card('d1'))
    await idle(app.queryClient)
    expect(cardNumber('d1', 'members')).toBe('3')
  })
})

/** `DepartmentForm` oluşturma alanları + gönder. */
async function createDepartment(name: string, code: string): Promise<void> {
  await fill('[role="dialog"] [name="name"]', name)
  await fill('[role="dialog"] [name="code"]', code)
  await click('[role="dialog"] [data-testid="of-submit"]')
}

const headCreate = () => byText('.coords-page button', 'Yeni koordinatörlük')

describe('yeni koordinatörlük oluştur + bağla (senaryo 3)', () => {
  it('departmansız program: boş durum → oluştur → bağla → ızgara ve kabuk "departman yok" durumu kalkar', async () => {
    backend.db.links = backend.db.links.filter((l) => l.program_id !== 'p1')
    const app = await boot({ ...ADMIN, path: '/' })
    await until(() => $('[data-open-state="state.no-department"]'), 'K7 departman yok')
    await nav('Koordinatörlükler')
    await until(() => $('[data-testid="coords-none"]'), '08 boş durumu')
    await click(() => byText('[data-testid="coords-none"] button', 'Yeni koordinatörlük'))
    await createDepartment('Elektronik', 'elk')
    await until(() => !$('[role="dialog"]'), 'form kapanır')
    const created = backend.db.catalog.find((c) => c.name === 'Elektronik')!
    await until(() => card(created.department_id), 'yeni kart')
    expect(card(created.department_id)?.querySelector('[data-testid="code"]')?.textContent).toBe(
      'ELK',
    )
    const [link] = backend.sent('POST', '/v1/program/departments')
    expect(link!.headers.get('X-Nizamio-Program')).toBe('p1')
    await nav('Ana sayfa')
    await until(() => $('[data-testid="home-page"]'), 'ana sayfa içeriği')
    expect($('[data-open-state]')).toBeNull()
    await idle(app.queryClient)
  })

  it('kısmi başarı: katalog kaydı kaldı, bağ kurulamadı → form ikinci adımı sunar → bağla → kart', async () => {
    backend.db.failNextLink = true
    await boot({ ...ADMIN, path: '/koordinatorlukler' })
    await click(headCreate)
    await createDepartment('Elektronik', 'elk')
    await until(() => $('[data-testid="of-partial"]'), 'kısmi sonuç notu')
    expect(backend.db.catalog.some((c) => c.name === 'Elektronik')).toBe(true)
    expect(backend.db.links.some((l) => l.display_name === 'Elektronik')).toBe(false)
    await click('[data-testid="of-link-submit"]')
    await until(() => !$('[role="dialog"]'), 'form kapanır')
    const created = backend.db.catalog.find((c) => c.name === 'Elektronik')!
    await until(() => card(created.department_id), 'bağlanan kart')
  })

  it('E-08-39: boş durumdan "mevcut departmanı ekle" — department_exists → bağla', async () => {
    backend.db.links = backend.db.links.filter((l) => l.program_id !== 'p1')
    await boot({ ...ADMIN, path: '/koordinatorlukler' })
    await click(() => byText('[data-testid="coords-none"] button', 'Yeni koordinatörlük'))
    await createDepartment('Fuar', 'fux')
    await until(() => $('[data-testid="of-exists"]'), 'mevcut departman notu')
    await until(() => $('[data-testid="of-link"]'), 'bağlama adımı')
    await click('[data-testid="of-link-submit"]')
    await until(() => card('d3'), 'mevcut departman bağlandı')
    expect(backend.sent('POST', '/v1/departments')).toHaveLength(1)
  })

  it('koordinatörsüz kart → "Koordinatör ata" (gerçek CoordinatorAssignDialog) → kart tazelenir', async () => {
    await boot({ ...ADMIN, path: '/koordinatorlukler' })
    await click(() => byText(`[data-department="d2"] button`, 'Koordinatör ata'))
    await pickPerson(PEOPLE.second.account_id)
    await click('[role="dialog"] [data-testid="of-submit"]')
    await until(() => !$('[role="dialog"]'), 'diyalog kapanır')
    await until(
      () => card('d2')?.querySelector('[data-testid="lead-line"]')?.textContent?.includes('Cem'),
      'kart koordinatörü',
    )
    const [assign] = backend.sent('POST', '/v1/departments/d2/coordinator')
    expect(assign!.body).toEqual({ account_id: PEOPLE.second.account_id })
  })
})
