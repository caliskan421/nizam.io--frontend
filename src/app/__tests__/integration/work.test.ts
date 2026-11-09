// W82a · devralınan borç (10), web-1 Codex Ö-02 kalan: web-1 görev ekranı (`/gorevler`) üretim
// `createAppRouter` + `AppShell` + gerçek oturumla — gerçek 403 / liste dışlama (sunucu
// görünürlüğü), kapsam değişimi, bekleyen onay (`use-confirm`) ve çıkış → başka hesapla giriş.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  boot,
  byText,
  click,
  createBackend,
  fill,
  idle,
  PEOPLE,
  seedWorld,
  switchScope,
  teardown,
  until,
} from './harness'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const ADMIN = { email: PEOPLE.admin.email, scope: { programId: 'p1', lens: 'admin' as const } }
const MEMBER = {
  email: PEOPLE.member.email,
  scope: { programId: 'p1', lens: 'member' as const, departmentId: 'd1' },
}

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedWorld(backend.db)
  await boot({ ...ADMIN, path: '/gorevler?gorev=w1' })
  await until(() => $('[data-testid="work-detail"] [data-testid="wf-delete"]'), 'ısınma')
  teardown()
}, 30_000)
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const rows = () => $$('[data-work-item]').map((el) => el.dataset.workItem)

describe('gerçek 403 ve liste dışlama (sunucu görünürlüğü)', () => {
  it('üye: yalnız kendisine atanan görev listelenir; başkasının görevine derin bağlantı 403', async () => {
    const app = await boot({ ...MEMBER, path: '/gorevler?gorev=w2' })
    await until(() => rows().includes('w1'), 'üye listesi')
    const panel = await until(() => $('[data-testid="work-detail"] [role="alert"]'), 'panel hatası')
    expect(panel.textContent).toContain('Bu görev size atanmamış.')
    expect(rows()).toEqual(['w1'])
    const [detail] = backend.sent('GET', '/v1/work-items/w2')
    expect(detail!.account).toBe(PEOPLE.member.account_id)
    expect($('[data-testid="work-detail"]')?.textContent).not.toContain('Şasi çizimi')
    await idle(app.queryClient)
  })

  it('yönetici aynı bağlantıda görevi açar (aynı sunucu, farklı yetki)', async () => {
    await boot({ ...ADMIN, path: '/gorevler?gorev=w2' })
    await until(() => $('[data-testid="work-detail"]')?.textContent?.includes('Şasi çizimi'))
    expect(rows()).toEqual(expect.arrayContaining(['w1', 'w2', 'w3', 'w4']))
  })
})

describe('kapsam değişimi ve bekleyen onay', () => {
  it('panel açık + silme onayı bekliyor → program değişir: onay vazgeç, DELETE yok, panel ve görev URL’den düşer', async () => {
    const app = await boot({ ...ADMIN, path: '/gorevler?q=a&gorev=w1' })
    await click('[data-testid="work-detail"] [data-testid="wf-delete"]')
    await until(() => $('[data-testid="confirm-dialog"]'), 'silme onayı')
    await switchScope('Program', 'Teknofest 2027')
    await until(() => !$('[data-testid="confirm-dialog"]'), 'onay kendiliğinden kapanır')
    await until(() => !$('[data-testid="work-detail"]'), 'panel kapanır')
    expect(app.router.currentRoute.value.query).toEqual({ q: 'a' })
    await idle(app.queryClient)
    expect(backend.sent('DELETE', '/v1/work-items/w1')).toHaveLength(0)
    expect(backend.db.items.some((i) => i.work_item_id === 'w1')).toBe(true)
  })
})

describe('çıkış → başka hesapla giriş', () => {
  it('bekleyen onay kapanır, önceki hesabın verisi yeni oturumda görünmez', async () => {
    const app = await boot({ ...ADMIN, path: '/gorevler?gorev=w2' })
    await until(() => rows().includes('w2'), 'yönetici listesi')
    await click('[data-testid="work-detail"] [data-testid="wf-delete"]')
    await until(() => $('[data-testid="confirm-dialog"]'), 'silme onayı')

    // Pencere açıkken arka plan tıklanamaz; çıkış betikte DOM `click()` ile (kardeş sekme / oturum
    // sonu eşdeğeri — W62/W64 kalıbı).
    await click('aside button[aria-label="Çıkış yap"]')
    await until(() => $('[data-testid="login-form"]'), 'giriş formu')
    expect($('[data-testid="confirm-dialog"]')).toBeNull()
    expect(app.queryClient.getQueryCache().getAll()).toHaveLength(0)

    await fill('[data-testid="login-form"] [name="email"]', PEOPLE.member.email)
    await fill('[data-testid="login-form"] [name="password"]', 'dogru-parola')
    await click(() => byText('[data-testid="login-form"] button', 'Giriş'))
    await until(() => app.session.accountId === PEOPLE.member.account_id, 'yeni oturum')
    await app.router.push('/gorevler')
    // Hatırlanan kapsam çıkışta silindi; üyenin iki birimi var → sessiz seçim yok (K2), seçici.
    await until(() => $('[data-testid="app-shell"]'), 'kabuk')
    await until(() => $('main')?.textContent?.includes('Kapsam seçin'), 'kapsam seçimi bekleniyor')
    expect(rows()).toEqual([])
    await switchScope('Koordinatörlük', 'Mekanik')
    await until(() => rows().length > 0, 'üye listesi')
    await idle(app.queryClient)
    expect(rows()).not.toContain('w2')
    expect(backend.sent('DELETE', '/v1/work-items/w2')).toHaveLength(0)
    const after = backend.requests.filter((r) => r.path === '/v1/program/work-items').at(-1)
    expect(after!.account).toBe(PEOPLE.member.account_id)
  })
})
