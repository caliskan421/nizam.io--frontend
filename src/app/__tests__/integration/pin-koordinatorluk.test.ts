// WP3 · İş 2 (d): 08 koordinatörlük oluştur — `department_exists` (BE-050, zarftaki mevcut
// departman) ve sonuç bilinmiyorsa AYNI `Idempotency-Key` ile tek tekrar; 05 kullanıcı oluştur
// aktarım teklifi (BE-107, `transfer_available` + `transfer_account_id`). Üretim kök + router +
// kabuk + durumlu sahte backend (v0.15 sözleşmesi: isteğe bağlı anahtar, 200 tekrar, 409 reused).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { isValidIdempotencyKey } from '@/shared/http/mutation/idempotency-key'

import { dropNextCreateResponses } from './fake-org-team'
import {
  $,
  boot,
  byText,
  click,
  createBackend,
  fill,
  idle,
  PEOPLE,
  seedWorld,
  teardown,
  until,
} from './harness'
import { ADMIN_ADMIN } from './timeline-support'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const DEPARTMENTS = '/v1/departments'
const LINKS = '/v1/program/departments'

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedWorld(backend.db)
  await boot({ ...ADMIN_ADMIN, path: '/koordinatorlukler' })
  await until(() => $('[data-department="d1"]'), 'ısınma')
  await click(() => byText('.coords-page button', 'Yeni koordinatörlük'))
  await until(() => $('[role="dialog"] [name="name"]'), 'ısınma formu')
  teardown()
}, 60_000)
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const card = (id: string) => $(`[data-department="${id}"]`)
const headCreate = () => byText('.coords-page button', 'Yeni koordinatörlük')

async function fillDepartment(name: string, code: string): Promise<void> {
  await fill('[role="dialog"] [name="name"]', name)
  await fill('[role="dialog"] [name="code"]', code)
  await click('[role="dialog"] [data-testid="of-submit"]')
}

describe('(d) 08 koordinatörlük oluştur: department_exists (BE-050)', () => {
  it('katalogda var, bu programda yok: zarftaki kimlikle “Bu programa ekle” → d3 bağlanır, ikinci katalog kaydı açılmaz', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: '/koordinatorlukler' })
    await until(() => card('d1'), '08 ızgarası')
    expect(card('d3')).toBeNull() // Fuar yalnız 2027’ye bağlı
    await click(headCreate)
    await fillDepartment('fuar', 'fuz') // ad büyük/küçük harf duyarsız tekil
    await until(() => $('[data-testid="of-exists"]'), 'mevcut departman notu')
    await until(() => $('[data-testid="of-link"]'), '“Bu programa ekle” adımı')
    await click('[data-testid="of-link-submit"]')
    await until(() => card('d3'), 'mevcut departman bağlandı')
    await idle(app.queryClient)
    expect(backend.db.catalog.filter((c) => c.name.toLowerCase() === 'fuar')).toHaveLength(1)
    expect(backend.sent('POST', DEPARTMENTS)).toHaveLength(1)
    const [link] = backend.sent('POST', LINKS)
    expect(link!.body).toMatchObject({ department_id: 'd3' })
    expect(link!.headers.get('X-Nizamio-Program')).toBe('p1')
  })

  it('bu programda zaten bağlı: yalnız bilgi (bağlama adımı yok), yeni istek bağ yazmaz', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: '/koordinatorlukler' })
    await until(() => card('d1'), '08 ızgarası')
    await click(headCreate)
    await fillDepartment('Mekanik', 'mex')
    await until(() => $('[data-testid="of-exists"]'), 'mevcut departman notu')
    expect($('[data-testid="of-link"]')).toBeNull()
    await idle(app.queryClient)
    expect(backend.sent('POST', LINKS)).toHaveLength(0)
    expect(backend.db.catalog.filter((c) => c.name === 'Mekanik')).toHaveLength(1)
  })
})

describe('(d) sonuç bilinmiyor: AYNI anahtarla tek tekrar (BE-050)', () => {
  it('oluşturma yanıtı kayboldu: “Yeniden gönder” aynı Idempotency-Key ile gider, TEK katalog kaydı ve TEK bağ', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: '/koordinatorlukler' })
    await until(() => card('d1'), '08 ızgarası')
    dropNextCreateResponses(backend.db) // istek UYGULANIR, yanıt ağ hatası
    await click(headCreate)
    await fillDepartment('Elektronik', 'elk')
    await until(() => $('[data-testid="outcome-retry"]'), '“Yeniden gönder”')
    // Sunucu oluşturmuştu; istemci henüz bilmiyor.
    expect(backend.db.catalog.filter((c) => c.name === 'Elektronik')).toHaveLength(1)
    await click('[data-testid="outcome-retry"]')
    await until(() => !$('[role="dialog"]'), 'form kapanır')
    const created = backend.db.catalog.find((c) => c.name === 'Elektronik')!
    await until(() => card(created.department_id), 'yeni kart')
    await idle(app.queryClient)

    const sent = backend.sent('POST', DEPARTMENTS)
    expect(sent).toHaveLength(2)
    const keys = sent.map((r) => r.headers.get('Idempotency-Key') ?? '')
    expect(isValidIdempotencyKey(keys[0]!)).toBe(true)
    expect(keys[1]).toBe(keys[0]) // aynı eylem, aynı anahtar
    expect(sent[1]!.body).toEqual(sent[0]!.body)
    expect(backend.db.catalog.filter((c) => c.name === 'Elektronik')).toHaveLength(1)
    expect(backend.db.links.filter((l) => l.department_id === created.department_id)).toHaveLength(
      1,
    )
    const links = backend.sent('POST', LINKS)
    expect(links).toHaveLength(1)
    expect(isValidIdempotencyKey(links[0]!.headers.get('Idempotency-Key') ?? '')).toBe(true)
  })

  it('bağ yanıtı kayboldu: aynı anahtarla tek tekrar, tek bağ', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: '/koordinatorlukler' })
    await until(() => card('d1'), '08 ızgarası')
    await click(headCreate)
    // Oluşturma yanıtı sağlam gelir, ardıl bağ yanıtı düşer: kancayı oluşturma sonrası kurmak için
    // önce departmanı sunucuda hazırlayıp “mevcut departman” yolunu kullanırız.
    await fillDepartment('Fuar', 'fux')
    await until(() => $('[data-testid="of-link"]'), 'bağlama adımı')
    dropNextCreateResponses(backend.db)
    await click('[data-testid="of-link-submit"]')
    await until(() => $('[data-testid="outcome-retry"]'), '“Yeniden gönder”')
    expect(
      backend.db.links.filter((l) => l.program_id === 'p1' && l.department_id === 'd3'),
    ).toHaveLength(1)
    await click('[data-testid="outcome-retry"]')
    await until(() => card('d3'), 'bağlanan kart')
    await idle(app.queryClient)
    const links = backend.sent('POST', LINKS)
    expect(links).toHaveLength(2)
    expect(links[1]!.headers.get('Idempotency-Key')).toBe(links[0]!.headers.get('Idempotency-Key'))
    expect(
      backend.db.links.filter((l) => l.program_id === 'p1' && l.department_id === 'd3'),
    ).toHaveLength(1)
  })
})

describe('(d) 05 kullanıcı oluştur: aktarım teklifi (BE-107)', () => {
  const BORA = PEOPLE.free

  async function create(email: string, department: string): Promise<void> {
    await click(() => byText('.users-page button', 'Kullanıcı oluştur'))
    await fill('[role="dialog"] [name="email"]', email)
    await fill('[role="dialog"] [name="fullName"]', 'Bora Yılmaz')
    await fill('[role="dialog"] select[name="departmentId"]', department)
    await click('[role="dialog"] [data-testid="of-submit"]')
  }

  it('e-posta başka hesaba ait: teklif → onay → AYNI gövde + transfer_account_id; yeni hesap açılmaz', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: '/kullanicilar' })
    await until(() => $(`[role="row"][data-account="${BORA.account_id}"]`), '05 listesi')
    const accounts = backend.db.accounts.length
    await create(BORA.email, 'd2')
    await until(() => $('[data-testid="of-transfer"]'), 'aktarım teklifi')
    expect($('[data-testid="of-transfer"]')!.textContent).toContain(BORA.full_name)
    await click('[data-testid="of-transfer-action"]')
    await until(() => !$('[role="dialog"]') || $('[name="password"]'), 'aktarım sonucu')
    await idle(app.queryClient)
    const posts = backend.sent('POST', '/v1/admin/users')
    expect(posts).toHaveLength(2)
    expect(posts[0]!.body).not.toHaveProperty('transfer_account_id')
    expect(posts[1]!.body).toMatchObject({
      email: BORA.email,
      department_id: 'd2',
      transfer_account_id: BORA.account_id,
    })
    expect(backend.db.accounts).toHaveLength(accounts) // yeni hesap yok
    expect(
      backend.db.memberships.some(
        (m) => m.account_id === BORA.account_id && m.department_id === 'd2',
      ),
    ).toBe(true)
  })

  it('hesap hedef ekipte zaten var: teklif çıkmaz (fields boş), düz “hesap var” hatası', async () => {
    await boot({ ...ADMIN_ADMIN, path: '/kullanicilar' })
    await until(() => $(`[role="row"][data-account="${PEOPLE.member.account_id}"]`), '05 listesi')
    await create(PEOPLE.member.email, 'd2') // Ayşe zaten Yazılım ekibinde
    await until(
      () => $('[role="dialog"] [role="alert"], [role="dialog"] [aria-invalid="true"]'),
      'hata',
    )
    expect($('[data-testid="of-transfer"]')).toBeNull()
    expect(backend.sent('POST', '/v1/admin/users')).toHaveLength(1)
  })
})
