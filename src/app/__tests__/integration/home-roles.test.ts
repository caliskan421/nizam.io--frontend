// W142 · O3 senaryo 5 (b): koordinatör hesabı → K1, üye hesabı → Ü1 (gerçek HomePage seçicisi;
// W137 TASLAK `RoleHomeDraft` → W140 K1/Ü1 gövdeleri). Tek yüklem: sayaç / kuyruk / liste AYNI
// kümeden; görev yazması sonrası türevler (özet hücreleri, kenar menüsü rozetleri) ÖNCE/SONRA
// (KESİN 29). Sunucu yetkili görünürlükle SÜZMEDEN değil, sözleşme gibi davranır.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  boot,
  byText,
  click,
  COORD,
  idle,
  MEMBER,
  PEOPLE,
  resetReports,
  switchScope,
  teardown,
  toasts,
  until,
  useReportsBackend,
} from './reports-support'

const backend = useReportsBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetReports()
  seedHome()
  await boot({ ...COORD, path: '/' })
  await until(() => $('[data-home="k1"] [data-cell="pending"]'), 'ısınma K1')
  teardown()
  await boot({ ...MEMBER, path: '/' })
  await until(() => $('[data-home="u1"] [data-cell="pending"]'), 'ısınma Ü1')
  teardown()
}, 60_000)
beforeEach(() => {
  resetReports()
  seedHome()
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

/** d1: w1 Ayşe onayda + gecikmiş, w2 Kerem devam, w5 atanmamış, w6 Ayşe iade; d2: w3/w4 (Ayşe/Cem). */
function seedHome(): void {
  const items = backend.db.items
  const w1 = items.find((i) => i.work_item_id === 'w1')!
  Object.assign(w1, { status: 'onaya_sunuldu', end_on: '2026-11-05' })
  Object.assign(
    items.find((i) => i.work_item_id === 'w2')!,
    { status: 'devam_ediyor' },
  )
  const base = { program_id: 'p1', department_id: 'd1', description: '' }
  items.push(
    {
      ...w1,
      ...base,
      work_item_id: 'w5',
      title: 'Atanmamış iş',
      status: 'baslanmadi',
      end_on: '2026-12-20',
      assignees: [],
      assignee_account_ids: [],
    },
    {
      ...w1,
      ...base,
      work_item_id: 'w6',
      title: 'İade edilen iş',
      status: 'iade_edildi',
      end_on: '2026-12-22',
    },
  )
}

const cell = (key: string) => $(`[data-cell="${key}"] [data-value]`)?.textContent?.trim() ?? null
const rows = (region: string) => $$(`[data-region="${region}"] [data-row]`)
const badge = (kind: string) => $(`.side-badge[data-badge="${kind}"]`)?.textContent?.trim() ?? null

describe('K1 (koordinatör hesabı)', () => {
  it('sayfa seçici K1 açar; özet hücreleri, kuyruklar ve listeler AYNI kümeden', async () => {
    const app = await boot({ ...COORD, path: '/' })
    await until(() => $('[data-home="k1"] [data-cell="pending"]'), 'özet')
    await idle(app.queryClient)
    expect($('[data-home="admin"]')).toBeNull()
    expect($('[data-quick="report"]')).toBeNull()
    expect(cell('pending')).toBe('1')
    expect(rows('approvals')).toHaveLength(1)
    expect(cell('unassigned')).toBe('1')
    expect(rows('unassigned')).toHaveLength(1)
    expect(cell('overdue')).toBe('1')
    expect(rows('attention')).toHaveLength(1)
    expect(cell('returned')).toBe('1')
    // Sayaç + liste tek yüklem: aynı süzgeçle sayaç ve liste, birim başına ikinci yükleme yok.
    expect(
      backend
        .sent('GET', '/v1/program/work-items/counts')
        .every((r) => r.query.get('department_id') === 'd1'),
    ).toBe(true)
    expect(
      backend
        .sent('GET', '/v1/program/work-items')
        .every((r) => r.query.get('department_id') === 'd1'),
    ).toBe(true)
  })

  it('"Onayla": özet, kuyruk VE kenar menüsü rozetleri önce/sonra (onay + geciken düşer)', async () => {
    const app = await boot({ ...COORD, path: '/' })
    await until(() => badge('approval') === '1' && badge('overdue') === '1', 'rozetler önce')
    await until(() => cell('pending') === '1', 'özet önce')
    await click('[data-region="approvals"] [data-action="approve"]')
    await until(() => toasts().includes('onay'), 'bildirim').catch(() => undefined)
    await until(() => cell('pending') === '0', 'özet sonra')
    await until(() => badge('approval') === null, 'onay rozeti sonra')
    await until(() => badge('overdue') === null, 'geciken rozeti sonra')
    expect(rows('approvals')).toHaveLength(0)
    expect(cell('overdue')).toBe('0')
    expect(rows('attention')).toHaveLength(0)
    const [sent] = backend.sent('POST', '/v1/work-items/w1/transitions')
    expect(sent!.body).toMatchObject({ to: 'tamamlandi' })
    await idle(app.queryClient)
  })

  it('"İade et": onay rozeti düşer, iade hücresi 1→2, geciken kalır', async () => {
    const app = await boot({ ...COORD, path: '/' })
    await until(() => badge('approval') === '1' && cell('returned') === '1', 'önce')
    await click('[data-region="approvals"] [data-action="return"]')
    await until(() => cell('returned') === '2', 'iade 2')
    await until(() => badge('approval') === null, 'onay rozeti düştü')
    expect(badge('overdue')).toBe('1')
    expect(cell('pending')).toBe('0')
    await idle(app.queryClient)
  })

  it('"Üstlen": atanmamış kuyruğu ve hücre düşer, ekip yükü artar; yazma tek istek', async () => {
    const app = await boot({ ...COORD, path: '/' })
    await until(() => cell('unassigned') === '1', 'önce')
    await click('[data-region="unassigned"] [data-action="claim"]')
    await until(() => cell('unassigned') === '0', 'sonra')
    expect(rows('unassigned')).toHaveLength(0)
    expect(backend.sent('POST', '/v1/work-items/w5/assignments')).toHaveLength(1)
    await idle(app.queryClient)
  })

  it('mercek d1 → başka birim: gövde yeniden kurulur, sayaçlar o birimin kümesinden', async () => {
    backend.db.memberships.push({
      program_id: 'p1',
      department_id: 'd2',
      account_id: PEOPLE.coord.account_id,
      team: 'coordinator',
      membership_id: 'm-kerem-d2c',
    })
    const app = await boot({ ...COORD, path: '/' })
    await until(() => cell('pending') === '1', 'd1')
    await switchScope('Koordinatörlük', 'Yazılım')
    await until(() => cell('pending') === '0' && cell('unassigned') === '0', 'd2 sayaçları')
    expect(app.scope.departmentId).toBe('d2')
    expect(
      backend
        .sent('GET', '/v1/program/work-items/counts')
        .some((r) => r.query.get('department_id') === 'd2'),
    ).toBe(true)
  })
})

describe('Ü1 (üye hesabı)', () => {
  it('sayfa seçici Ü1 açar; kuyruk ve hücreler "atanan = ben" kümesinden (tek yüklem)', async () => {
    const app = await boot({ ...MEMBER, path: '/' })
    await until(() => $('[data-home="u1"] [data-cell="pending"]'), 'özet')
    await idle(app.queryClient)
    expect($('[data-quick="report"]')).toBeNull()
    expect(cell('pending')).toBe('1')
    expect(cell('returned')).toBe('1')
    expect(cell('overdue')).toBe('1')
    // Ayşe: w1 (onayda), w3 (d2), w6 (iade) → 3 açık görev; kuyruk aynı kümeden.
    expect(rows('queue')).toHaveLength(3)
    expect(
      backend
        .sent('GET', '/v1/program/work-items')
        .every((r) => r.query.get('assignee_account_id') === PEOPLE.member.account_id),
    ).toBe(true)
  })

  it('"Tekrar başla" (own-status): iade hücresi 1→0, kuyruk aynı kümede kalır; başka kişinin görevine dokunulmaz', async () => {
    const app = await boot({ ...MEMBER, path: '/' })
    await until(
      () => cell('returned') === '1' && $('[data-region="queue"] [data-action="restart"]'),
      'önce',
    )
    await click('[data-region="queue"] [data-action="restart"]')
    await until(() => cell('returned') === '0', 'iade hücresi sonra')
    await idle(app.queryClient)
    expect(backend.sent('PATCH', '/v1/work-items/w6/own-status')).toHaveLength(1)
    expect(rows('queue')).toHaveLength(3)
    expect($('[data-region="queue"] [data-action="restart"]')).toBeNull()
    expect(cell('pending')).toBe('1')
    expect(backend.db.items.find((i) => i.work_item_id === 'w4')!.status).toBe('baslanmadi')
  })

  it('başka birimdeki görevin bağlantısı 03 paneli açar (Ü1 program geneli kuyruktan; W140 kusur adayı a)', async () => {
    const app = await boot({ ...MEMBER, path: '/' })
    await until(() => rows('queue').length === 3, 'kuyruk')
    const other = byText('[data-region="queue"] a.rh-title', 'Yazılım planı')!
    other.click()
    await until(() => app.router.currentRoute.value.query.gorev === 'w3', 'gezinti')
    await until(() => $('.wd-actions'), 'görev paneli')
    await idle(app.queryClient)
    // Görevin KENDİ birimiyle (d2) okunur; seçili birimle (d1) 404 alıp paneli sessizce kapatmaz.
    const reads = backend.sent('GET', '/v1/work-items/w3')
    expect(reads.length).toBeGreaterThan(0)
    expect(reads.every((r) => r.headers.get('X-Nizamio-Department') === 'd2')).toBe(true)
    expect(app.router.currentRoute.value.query.gorev).toBe('w3')
  })
})
