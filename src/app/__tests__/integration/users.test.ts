// W82a · senaryo (2) ve 05 açık uçları: çip kaldır → `confirmation_required` → ortak onay →
// görev listeleri yenilenir (atama devri, W71b); kullanıcı oluştur (gerçek UserCreateDialog +
// TemporaryPasswordDialog) → panel ya da BE-043 bilgi notu; 05b gömülü gerçek UserPanel (sil →
// devir → liste); 05b "Görev ata" → gerçek TasksPage + NewTaskDialog ön dolu.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

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
  toasts,
  until,
} from './harness'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const ADMIN = { email: PEOPLE.admin.email, scope: { programId: 'p1', lens: 'admin' as const } }

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedWorld(backend.db)
  await boot({ ...ADMIN, path: `/kullanicilar/${PEOPLE.member.account_id}` })
  await until(() => $('[data-testid="personal-tracking"]'), 'ısınma')
  teardown()
}, 30_000)
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const task = (id: string) => $(`[data-work-item="${id}"]`)
const assignedTo = (id: string, name: string) => task(id)?.querySelector(`[data-tip="${name}"]`)
const row = (accountId: string) => $(`[role="row"][data-account="${accountId}"]`)
const nav = (label: string) => click(() => byText('nav a', label))
const chip = (department: string) => $(`[data-testid="user-panel"] [data-chip="${department}"]`)

describe('05 çip kaldır → onay → görev listeleri (senaryo 2)', () => {
  it('kabul: atama işlemi yapana devredilir; /gorevler yeniden okunur, 05 satırı güncellenir', async () => {
    const app = await boot({ ...ADMIN, path: '/gorevler' })
    await until(() => assignedTo('w1', PEOPLE.member.full_name), 'görev listesi')
    await nav('Kullanıcılar')
    await click(() => row(PEOPLE.member.account_id))
    await until(() => chip('d1'), 'panel çipi')
    await click(() => chip('d1')!.querySelector<HTMLElement>('[data-testid="chip-remove"]'))
    const dialog = await until(() => $('[data-testid="confirm-dialog"]'), 'etkili işlem onayı')
    expect($('[data-testid="confirm-items"]', dialog)?.textContent).toContain('Motor testi')
    const [first] = backend.sent('DELETE', '/v1/departments/d1/memberships/acc-member')
    expect(first!.query.get('confirm')).toBeNull()
    await click('[data-testid="confirm-accept"]')
    await until(() => !$('[data-testid="confirm-dialog"]'), 'onay kapanır')
    // Ortak etkili işlem sonucu: devir bildirimi (sunucunun `unassigned_tasks` değeri).
    await until(() => toasts().includes('1 görevdeki atama devredildi'), 'devir bildirimi')
    const sent = backend.sent('DELETE', '/v1/departments/d1/memberships/acc-member')
    expect(sent).toHaveLength(2)
    expect(sent[1]!.query.get('confirm')).toBe('true')
    await until(() => !chip('d1'), 'çip kalkar')

    await nav('Görevler')
    await until(() => assignedTo('w1', PEOPLE.admin.full_name), 'devredilen görev listede')
    expect(assignedTo('w1', PEOPLE.member.full_name)).toBeFalsy()
    await idle(app.queryClient)
  })

  it('vazgeç: ikinci istek yok, çip yerinde', async () => {
    await boot({ ...ADMIN, path: `/kullanicilar?secili=${PEOPLE.member.account_id}` })
    await until(() => chip('d1'), 'derin bağlantıyla panel')
    await click(() => chip('d1')!.querySelector<HTMLElement>('[data-testid="chip-remove"]'))
    const dialog = await until(() => $('[data-testid="confirm-dialog"]'), 'onay')
    await click(() => byText('button', 'Vazgeç', dialog))
    await until(() => !$('[data-testid="confirm-dialog"]'), 'onay kapanır')
    expect(backend.sent('DELETE', '/v1/departments/d1/memberships/acc-member')).toHaveLength(1)
    expect(chip('d1')).not.toBeNull()
  })
})

describe('05 kullanıcı oluştur (gerçek UserCreateDialog + TemporaryPasswordDialog)', () => {
  async function create(name: string, email: string) {
    await click(() => byText('.users-page button', 'Kullanıcı oluştur'))
    await fill('[role="dialog"] [name="email"]', email)
    await fill('[role="dialog"] [name="fullName"]', name)
    await fill('[role="dialog"] select[name="departmentId"]', 'd2')
    await click('[role="dialog"] [data-testid="of-submit"]')
  }

  it('yüklü listede: kişi seçilir, panel açılır, geçici parola adımı gönderilir', async () => {
    const app = await boot({ ...ADMIN, path: '/kullanicilar' })
    await until(() => row(PEOPLE.member.account_id), '05 listesi')
    await create('Zeynep Ak', 'zeynep@example.test')
    const created = await until(
      () => backend.db.accounts.find((a) => a.email === 'zeynep@example.test'),
      'hesap',
    )
    await until(() => app.router.currentRoute.value.query.secili === created.account_id)
    await fill('[role="dialog"] [name="password"]', 'Gecici-Parola-1')
    await click('[role="dialog"] [data-testid="of-submit"]')
    await until(() => !$('[role="dialog"]'), 'parola penceresi kapanır')
    expect(backend.sent('PATCH', `/v1/admin/accounts/${created.account_id}`)).toHaveLength(1)
    await until(
      () => $(`[data-testid="user-panel"][data-account="${created.account_id}"]`),
      'panel',
    )
    expect($('[data-testid="users-selected-missing"]')).toBeNull()
    expect(document.body.innerHTML).not.toContain('Gecici-Parola-1')
  })

  it('BE-043: yeni kişi yüklü (süzülmüş) kümede değil → panel açılmaz, bilgi notu görünür', async () => {
    const app = await boot({ ...ADMIN, path: '/kullanicilar?q=Ayşe' })
    await until(() => row(PEOPLE.member.account_id), 'süzülmüş liste')
    await create('Zeynep Ak', 'zeynep@example.test')
    await until(() => app.router.currentRoute.value.query.secili, 'seçili kişi URL’de')
    await click(() => byText('[role="dialog"] button', 'Vazgeç'))
    await until(() => $('[data-testid="users-selected-missing"]'), 'bilgi notu')
    expect($('[data-testid="user-panel"]')).toBeNull()
  })
})

describe('05b gömülü gerçek UserPanel ve "Görev ata"', () => {
  it('Hesap sekmesi → kullanıcıyı sil → atamalar devredilir; 05 listesine dönülür', async () => {
    const app = await boot({ ...ADMIN, path: '/gorevler' })
    await until(() => assignedTo('w4', PEOPLE.second.full_name), 'görev listesi')
    await app.router.push(`/kullanicilar/${PEOPLE.second.account_id}?sekme=hesap`)
    await click('[data-panel="hesap"] [data-testid="account-delete"]')
    await click(() => $('[data-testid="confirm-dialog"] [data-testid="confirm-accept"]'))
    await until(() => app.router.currentRoute.value.name === 'organization.users', '05 listesi')
    await until(
      () => row(PEOPLE.member.account_id) && !row(PEOPLE.second.account_id),
      'liste yenilendi',
    )
    await nav('Görevler')
    await until(() => assignedTo('w4', PEOPLE.admin.full_name), 'devredilen görev')
  })

  it('"Görev ata" → gerçek TasksPage + NewTaskDialog: hedef birim ve atanan ön dolu', async () => {
    const app = await boot({ ...ADMIN, path: `/kullanicilar/${PEOPLE.second.account_id}` })
    await click('[data-assign]:not([disabled])')
    await until(() => app.router.currentRoute.value.name === 'work.tasks', '03 rotası')
    const form = await until(() => $('[role="dialog"]'), 'yeni görev formu')
    await until(
      () =>
        ($('[name="assignee"]', form) as HTMLSelectElement | null)?.value ===
        PEOPLE.second.account_id,
      'atanan ön dolu',
    )
    expect(($('[name="departmentId"]', form) as HTMLSelectElement).value).toBe('d2')
    expect(app.router.currentRoute.value.query.atanan).toBeUndefined()
  })
})

describe('05 panel → "Geçici parola belirle" (gerçek TemporaryPasswordDialog — W75 TASLAK)', () => {
  it('parola gönderilir, pencere kapanır; parola DOM’da ve önbellekte kalmaz', async () => {
    const app = await boot({ ...ADMIN, path: `/kullanicilar?secili=${PEOPLE.second.account_id}` })
    await click('[data-testid="user-panel"] [data-testid="account-password"]')
    await fill('[role="dialog"] [name="password"]', 'Gecici-Parola-2')
    await click('[role="dialog"] [data-testid="of-submit"]')
    await until(() => !$('[role="dialog"]'), 'pencere kapanır')
    const [patch] = backend.sent('PATCH', `/v1/admin/accounts/${PEOPLE.second.account_id}`)
    expect(patch!.body).toEqual({ password: 'Gecici-Parola-2', force_password_change: true })
    await idle(app.queryClient)
    expect(document.body.innerHTML).not.toContain('Gecici-Parola-2')
    const cache = [
      ...app.queryClient
        .getQueryCache()
        .getAll()
        .map((q) => q.state),
      ...app.queryClient
        .getMutationCache()
        .getAll()
        .map((m) => m.state),
    ]
    expect(JSON.stringify(cache)).not.toContain('Gecici-Parola-2')
  })
})
