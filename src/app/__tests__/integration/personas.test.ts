// W82a · senaryo (5): dört kişilik yetki — yönetici (Admin merceği), yönetici (Koordinatör
// merceği), koordinatör, üye: menü, rota kapısı, eylem görünürlüğü; "Görev ata" (08 kart, 08b)
// → gerçek TasksPage + NewTaskDialog hedef birim ön dolu (W76 açık ucu, iki yönetici merceği).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  boot,
  byText,
  click,
  createBackend,
  idle,
  PEOPLE,
  seedWorld,
  teardown,
  until,
  type BootOptions,
} from './harness'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })

const ADMIN: Omit<BootOptions, 'path'> = {
  email: PEOPLE.admin.email,
  scope: { programId: 'p1', lens: 'admin' },
}
const ADMIN_AS_COORD: Omit<BootOptions, 'path'> = {
  email: PEOPLE.admin.email,
  scope: { programId: 'p1', lens: 'coordinator', departmentId: 'd1' },
}
const COORD: Omit<BootOptions, 'path'> = {
  email: PEOPLE.coord.email,
  scope: { programId: 'p1', lens: 'coordinator', departmentId: 'd1' },
}
const MEMBER: Omit<BootOptions, 'path'> = {
  email: PEOPLE.member.email,
  scope: { programId: 'p1', lens: 'member', departmentId: 'd1' },
}

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

const ADMIN_ROUTES = [
  '/kullanicilar',
  '/kullanicilar/acc-member',
  '/koordinatorlukler',
  '/koordinatorlukler/d1',
  '/programlar',
]
const managementLinks = () =>
  $$('nav [data-group="yonetim"] a').map((a) => a.textContent?.replace(/\s+/g, ' ').trim())

/** Yeni görev formu açık mı ve hedef birimi. */
async function newTaskTarget(app: Awaited<ReturnType<typeof boot>>) {
  await until(() => app.router.currentRoute.value.name === 'work.tasks', '03 rotası')
  const form = await until(() => $('[role="dialog"] [name="departmentId"]'), 'yeni görev formu')
  await idle(app.queryClient)
  return (form as HTMLSelectElement).value
}

async function cardCreateTask(departmentId: string): Promise<void> {
  await click(() => $(`[data-department="${departmentId}"] .coords-menu__btn`))
  await click(() => byText('[role="menuitem"]', 'Görev ata'))
}

describe('yönetici — Admin merceği', () => {
  it('menü: Yönetim grubu; rotalar açılır; 08 kart "Görev ata" → hedef birim ön dolu', async () => {
    const app = await boot({ ...ADMIN, path: '/koordinatorlukler' })
    await until(() => $('[data-department="d2"]'), '08 ızgarası')
    expect(managementLinks()).toEqual(expect.arrayContaining(['Kullanıcılar', 'Koordinatörlükler']))
    expect(byText('.coords-page button', 'Yeni koordinatörlük')).not.toBeNull()
    await cardCreateTask('d2')
    expect(await newTaskTarget(app)).toBe('d2')
    expect(app.scope.lens).toBe('admin')
  })

  it('08b başlık "Görev ata" → yeni görev formu bu birimle', async () => {
    const app = await boot({ ...ADMIN, path: '/koordinatorlukler/d2' })
    await click('[data-action="assign"]')
    expect(await newTaskTarget(app)).toBe('d2')
  })
})

describe('yönetici — Koordinatör merceği (P1: mercek ≠ yetki)', () => {
  it('Yönetim grubu ve yönetim rotaları kalır; 08 kart "Görev ata" başka birimle, mercek değişmez', async () => {
    const app = await boot({ ...ADMIN_AS_COORD, path: '/koordinatorlukler' })
    await until(() => $('[data-department="d2"]'), '08 ızgarası')
    expect(managementLinks()).toEqual(expect.arrayContaining(['Kullanıcılar']))
    expect(byText('.coords-page button', 'Yeni koordinatörlük')).not.toBeNull()
    await cardCreateTask('d2')
    expect(await newTaskTarget(app)).toBe('d2')
    expect(app.scope.lens).toBe('coordinator')
    expect(app.scope.departmentId).toBe('d1')
  })

  it('05 listesi açılır (listUsers 403 değil)', async () => {
    await boot({ ...ADMIN_AS_COORD, path: '/kullanicilar' })
    await until(() => $('[role="row"][data-account="acc-member"]'), '05 listesi')
    expect(backend.sent('GET', '/v1/admin/users').at(-1)?.account).toBe('acc-admin')
  })
})

describe.each([
  ['koordinatör', COORD],
  ['üye', MEMBER],
])('%s', (_name, persona) => {
  it.each(ADMIN_ROUTES)(
    'yönetim rotası %s → ana sayfa; menüde Yönetim yok; yönetici ucu çağrılmaz',
    async (path) => {
      const app = await boot({ ...persona, path })
      await until(() => app.router.currentRoute.value.name === 'home', 'ana sayfaya dönüş')
      await until(() => $('nav [data-group]'), 'menü')
      expect($('nav [data-group="yonetim"]')).toBeNull()
      await idle(app.queryClient)
      for (const path of ['/v1/admin/users', '/v1/reports/dashboard', '/v1/departments']) {
        expect(backend.sent('GET', path)).toHaveLength(0)
      }
    },
  )
})
