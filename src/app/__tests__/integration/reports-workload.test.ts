// W142 · O3 senaryo 4: 05 Kullanıcılar iş yükü raporu (çoklu seçim, `member_ids` gövdeli POST bileti)
// ve 05b kişisel rapor (`[accountId]`); seçilemeyen satır, 422 → seçim temizlenir, program değişince
// seçim temizlenir; yetkisizlerde kutu/düğme çizilmez.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  ADMIN,
  boot,
  byText,
  captureSaves,
  click,
  COORD,
  hold,
  idle,
  issued,
  PEOPLE,
  resetReports,
  switchScope,
  teardown,
  toasts,
  until,
  useReportsBackend,
  userClick,
} from './reports-support'

const backend = useReportsBackend({ coordinator: 'koordinator', member: 'uye' })
const saved: string[] = []
const WORKLOAD = () => $('[data-testid="users-workload"] button')
const PICK = (id: string) =>
  $(`[role="row"][data-account="${id}"] input[data-testid="user-pick"]`) as HTMLInputElement | null
const COUNT = () => $('[data-testid="users-selcount"]')?.textContent ?? ''

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetReports()
  await boot({ ...ADMIN, path: '/kullanicilar' })
  await until(WORKLOAD, 'ısınma')
  teardown()
  await boot({ ...ADMIN, path: `/kullanicilar/${PEOPLE.member.account_id}` })
  await until(() => $('[data-personal-report]'), 'ısınma 05b')
  teardown()
}, 60_000)
beforeEach(() => {
  resetReports()
  saved.length = 0
  captureSaves(saved)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

describe('05 iş yükü raporu', () => {
  it('seçim yokken açık boş dizi: POST bileti {method:POST, path:/v1/reports/workload, body:{member_ids:[]}}', async () => {
    const app = await boot({ ...ADMIN, path: '/kullanicilar' })
    expect(WORKLOAD() ?? (await until(WORKLOAD, 'düğme'))).not.toBeNull()
    expect(WORKLOAD()!.textContent).toContain('İş yükü raporu (PDF)')
    await userClick(WORKLOAD)
    await until(() => saved.length === 1, 'kaydedildi')
    await idle(app.queryClient)
    expect(issued()[0]!.body).toEqual({
      method: 'POST',
      path: '/v1/reports/workload',
      body: { member_ids: [] },
    })
    expect(issued()[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(issued()[0]!.headers.get('X-Requested-With')).toBeTruthy()
  })

  it('çoklu seçim: etiket "Seçilenlerin iş yükü (PDF) · N", çubuk, gövde member_ids; "Seçimi temizle" odak', async () => {
    await boot({ ...ADMIN, path: '/kullanicilar' })
    await until(() => PICK(PEOPLE.member.account_id), 'satır kutusu')
    await click(() => PICK(PEOPLE.member.account_id))
    await click(() => PICK(PEOPLE.second.account_id))
    await until(() => COUNT().includes('2 üye seçili'), 'çubuk')
    expect(WORKLOAD()!.textContent).toContain('Seçilenlerin iş yükü (PDF) · 2')
    await userClick(WORKLOAD)
    await until(() => saved.length === 1, 'kaydedildi')
    expect((issued()[0]!.body as { body: unknown }).body).toEqual({
      member_ids: [PEOPLE.member.account_id, PEOPLE.second.account_id],
    })
    await userClick('[data-testid="users-selclear"]')
    await until(() => !$('[data-testid="users-selbar"]'), 'çubuk kalktı')
    expect(WORKLOAD()!.textContent).toContain('İş yükü raporu (PDF)')
    expect(document.activeElement).not.toBe(document.body)
  })

  it('seçim arama/sıralama değişince korunur; "Tümünü seç" görünen sayfayı işaretler, ikinci basış kaldırır', async () => {
    const app = await boot({ ...ADMIN, path: '/kullanicilar' })
    await until(() => PICK(PEOPLE.member.account_id), 'satır kutusu')
    await click(() => PICK(PEOPLE.member.account_id))
    await click('[data-testid="users-sort"]')
    await idle(app.queryClient)
    await until(() => COUNT().includes('1 üye seçili'), 'seçim korundu')
    await click('[data-testid="users-pick-all"] input, input[data-testid="users-pick-all"]')
    await until(
      () =>
        $$('input[data-testid="user-pick"]').every(
          (c) => (c as HTMLInputElement).checked || (c as HTMLInputElement).disabled,
        ),
      'hepsi seçili',
    )
    await click('[data-testid="users-pick-all"] input, input[data-testid="users-pick-all"]')
    await until(() => !$('[data-testid="users-selbar"]'), 'hepsi kalktı')
  })

  it('seçilemeyen satır: programın iş yükünde olmayan hesap devre dışı kutu + ipucu', async () => {
    backend.db.accounts.push({
      account_id: 'acc-zed',
      full_name: 'Zeynep Dış',
      email: 'zed@example.test',
      admin: false,
    })
    await boot({ ...ADMIN, path: '/kullanicilar' })
    await until(() => PICK('acc-zed'), 'satır')
    expect(PICK('acc-zed')!.disabled).toBe(true)
    expect(PICK(PEOPLE.member.account_id)!.disabled).toBe(false)
  })

  it('422 reporting.input_invalid: seçim temizlenir + "Seçim güncellendi" bildirimi; ikinci bilet yok', async () => {
    const app = await boot({ ...ADMIN, path: '/kullanicilar' })
    await until(() => PICK(PEOPLE.second.account_id), 'satır')
    await click(() => PICK(PEOPLE.second.account_id))
    await until(() => COUNT().includes('1 üye seçili'), 'seçim')
    // Hesap sunucuda silindi (liste önbelleği bayat): sunucu 422 döner.
    backend.db.accounts = backend.db.accounts.filter(
      (a) => a.account_id !== PEOPLE.second.account_id,
    )
    await userClick(WORKLOAD)
    await until(() => toasts().includes('Seçim güncellendi, yeniden deneyin.'), 'bildirim')
    await idle(app.queryClient)
    expect($('[data-testid="users-selbar"]')).toBeNull()
    expect(issued()).toHaveLength(1)
    expect(saved).toHaveLength(0)
  })

  it('program değişince seçim temizlenir (başka programın iş yükü)', async () => {
    await boot({ ...ADMIN, path: '/kullanicilar' })
    await until(() => PICK(PEOPLE.member.account_id), 'satır')
    await click(() => PICK(PEOPLE.member.account_id))
    await until(() => COUNT().includes('1 üye seçili'), 'seçim')
    await switchScope('Program', 'Teknofest 2027')
    await until(() => !$('[data-testid="users-selbar"]'), 'seçim temizlendi')
  })

  it('hazırlanırken başka rapor düğmesi kilitli: ikinci bilet üretilmez', async () => {
    const gate = hold('GET', '/v1/downloads/rt-1')
    const app = await boot({ ...ADMIN, path: '/kullanicilar' })
    await userClick(WORKLOAD)
    await gate.arrived
    await until(() => byText('button', 'Hazırlanıyor'), 'hazırlanıyor')
    ;(byText('button', 'Hazırlanıyor') as HTMLElement).click()
    await idle(app.queryClient).catch(() => undefined)
    expect(issued()).toHaveLength(1)
    gate.release()
    await until(() => saved.length === 1, 'kaydedildi')
  })

  it("koordinatör 05'e giremez; kutu ve düğme hiçbir yetkisizde çizilmez", async () => {
    const app = await boot({ ...COORD, path: '/kullanicilar' })
    await idle(app.queryClient)
    expect($('[data-testid="users-workload"]')).toBeNull()
    expect($('input[data-testid="user-pick"]')).toBeNull()
  })
})

describe('05b kişisel rapor', () => {
  it('"Kişisel rapor" member_ids: [hesap]; etiket kilitliyken de korunur', async () => {
    const app = await boot({ ...ADMIN, path: `/kullanicilar/${PEOPLE.member.account_id}` })
    const button = () => $('[data-personal-report] button') as HTMLButtonElement | null
    await until(button, 'düğme')
    expect(button()!.textContent).toContain('Kişisel rapor')
    await userClick(button)
    await until(() => saved.length === 1, 'kaydedildi')
    await idle(app.queryClient)
    expect(issued()[0]!.body).toEqual({
      method: 'POST',
      path: '/v1/reports/workload',
      body: { member_ids: [PEOPLE.member.account_id] },
    })
  })
})
