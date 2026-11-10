// WP3 · İş 2 (a): kenar menüsü rozetleri (BE-003, WP2d) ile 03 sayaçları (BE-003, WP2a) AYNI
// yazmadan sonra birlikte yenilenir. Üretim router'ı + kabuk + durumlu sahte backend (v0.15
// `countProgramWorkItems`: liste ile aynı görünürlük/süzgeç); taslak bileşen yok. Dört kişi:
// Admin, Koordinatör, Üye ve yönetici-Koordinatör merceği (yetki mercekten bağımsız, K3).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  boot,
  click,
  createBackend,
  fill,
  idle,
  seedTimeline,
  teardown,
  until,
} from './harness'
import {
  ADMIN_ADMIN,
  ADMIN_COORD,
  COORD,
  MEMBER,
  ganttReady,
  selectRow,
  tp,
} from './timeline-support'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const COUNTS = '/v1/program/work-items/counts'

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedWorld()
  await boot({ ...COORD, path: '/gorevler?gorev=w1' })
  await until(() => $('[data-testid="wf-status-trigger"]'), 'ısınma 03')
  teardown()
  await boot({ ...COORD, path: '/zaman-cizelgesi?secili=w2' })
  await ganttReady(2)
  await until(() => tp('tp-request'), 'ısınma 03c')
  teardown()
}, 60_000)
beforeEach(() => {
  backend.reset()
  seedWorld()
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

/** Tarihli dünya; w1 (Ayşe, Mekanik) bugünden (2026-11-10) önce bitmeli ve açık: geciken. */
function seedWorld(): void {
  seedTimeline(backend.db)
  const w1 = backend.db.items.find((i) => i.work_item_id === 'w1')!
  w1.end_on = '2026-11-05'
}

const overdueBadge = () => $('.side-badge:not(.side-badge--dates)')?.textContent?.trim() ?? null
const datesBadge = () => $('.side-badge--dates')?.textContent?.trim() ?? null
const tabCount = (label: string): number | null => {
  const button = $$('.tasks-tabs .rp-seg button').find((b) => b.textContent?.includes(label))
  const text = button?.querySelector('.rp-count')?.textContent ?? null
  return text === null ? null : Number(text.replace(/[()]/g, ''))
}
const requestCount = () => {
  const button = $$('.rp-seg button').find((b) => b.textContent?.includes('Tarih talebi'))
  const text = button?.querySelector('.rp-count')?.textContent ?? null
  return text === null ? null : Number(text.replace(/[()]/g, ''))
}
const lastCounts = () => backend.sent('GET', COUNTS).at(-1)

/** Kaydı Ayşe'nin w1 görevinde, kullanıcı arayüzünden durum geçişi. */
async function moveStatus(to: string): Promise<void> {
  await click('[data-testid="wf-status-trigger"]')
  await click(`[data-to="${to}"]`)
}

describe('(a) Koordinatör merceği: durum geçişi rozeti ve 03 sayaçlarını birlikte yeniler', () => {
  it('w1 tamamlanır: geciken rozeti düşer; Geciken 1→0, Tamamlanan 0→1, Devam ediyor 2→1', async () => {
    const app = await boot({ ...COORD, path: '/gorevler?gorev=w1' })
    await until(() => overdueBadge() === '1', 'geciken rozeti')
    await until(() => tabCount('Geciken') === 1, '03 geciken sayacı')
    expect(tabCount('Tümü')).toBe(2) // Mekanik: w1 + w2
    expect(datesBadge()).toBeNull()
    // Sayaç uçları Koordinatör merceğinde birim süzgeciyle, atanan süzgeci olmadan.
    expect(lastCounts()!.query.get('department_id')).toBe('d1')
    expect(lastCounts()!.query.getAll('assignee_account_id')).toEqual([])
    const before = backend.sent('GET', COUNTS).length

    await moveStatus('tamamlandi')
    await until(() => overdueBadge() === null, 'rozet düştü')
    await until(() => tabCount('Tamamlanan') === 1, '03 tamamlanan sayacı')
    await idle(app.queryClient)
    expect(tabCount('Geciken')).toBe(0)
    expect(tabCount('Devam ediyor')).toBe(1)
    expect(tabCount('Tümü')).toBe(2)
    expect(backend.sent('GET', COUNTS).length).toBeGreaterThan(before)
    expect(backend.sent('POST', '/v1/work-items/w1/transitions')).toHaveLength(1)
  })

  it('görev oluştur: 03 Tümü ve Başlamadı sayaçları yenilenir; rozet aynı kalır', async () => {
    const app = await boot({ ...COORD, path: '/gorevler?yeni=1' })
    await until(() => $('[role="dialog"] [name="title"]'), 'yeni görev formu')
    await until(() => tabCount('Tümü') === 2, '03 sayaçları')
    await fill('[role="dialog"] [name="title"]', 'Yeni fren testi')
    await fill('[role="dialog"] select[name="departmentId"]', 'd1')
    await fill('[role="dialog"] [name="startOn"]', '2026-11-12')
    await fill('[role="dialog"] [name="endOn"]', '2026-11-30')
    await click('[data-testid="wf-submit"]')
    await until(() => !$('[role="dialog"]'), 'form kapanır')
    await until(() => tabCount('Tümü') === 3, 'Tümü 3')
    await idle(app.queryClient)
    expect(tabCount('Başlamadı')).toBe(1)
    expect(overdueBadge()).toBe('1')
    expect(backend.db.items.filter((i) => i.department_id === 'd1')).toHaveLength(3)
  })

  it('tarih talebi: rozet (tarih) belirir, 03 talep sayacı 1 olur; ikisi aynı sunucu sayısı', async () => {
    const app = await boot({ ...COORD, path: '/zaman-cizelgesi' })
    await ganttReady(2)
    expect(datesBadge()).toBeNull()
    await selectRow('w2')
    await until(() => tp('tp-request'), 'talep düğmesi')
    tp('tp-request')!.click()
    await until(() => $('[role="dialog"] [name="end"]'), 'talep formu')
    await fill('[role="dialog"] [name="end"]', '11.12.2026')
    await click('[data-testid="tp-request-submit"]')
    await until(() => datesBadge() === '1', 'tarih rozeti')
    await app.router.push('/gorevler')
    await until(() => requestCount() === 1, '03 talep sayacı')
    expect(datesBadge()).toBe('1')
    await idle(app.queryClient)
  })
})

describe('(a) Üye merceği: yalnız bana atananlar; tarih rozeti hiç yok', () => {
  it('Ayşe w1’i onaya sunar: sayaçlar yalnız onun görevleriyle, Onay bekleyen 0→1', async () => {
    const app = await boot({ ...MEMBER, path: '/gorevler?gorev=w1' })
    await until(() => overdueBadge() === '1', 'geciken rozeti')
    await until(() => tabCount('Geciken') === 1, '03 geciken')
    expect(tabCount('Tümü')).toBe(1)
    expect(lastCounts()!.query.getAll('assignee_account_id')).toEqual(['acc-member'])
    // Üye yüzünde sunucu talebi doldurmaz; rozet ve sayaç kural gereği yok.
    backend.db.items.find((i) => i.work_item_id === 'w1')!.pending_date_request = {
      request_id: 'dr-x',
      new_start_on: '2026-11-02',
      new_end_on: '2026-12-01',
    }
    await moveStatus('onaya_sunuldu')
    await until(() => tabCount('Onay bekleyen') === 1, '03 onay bekleyen')
    await idle(app.queryClient)
    expect(tabCount('Devam ediyor')).toBe(0)
    expect(overdueBadge()).toBe('1') // onaya sunulan görev tamamlanmış değildir
    expect(datesBadge()).toBeNull()
    expect(backend.sent('POST', '/v1/work-items/w1/transitions')).toHaveLength(1)
  })
})

describe('(a) Admin merceği: rapor panosu rozeti ↔ 03 sunucu sayaçları', () => {
  it('yönetici bekleyen talebi onaylar: tarih rozeti ve 03 talep sayacı birlikte düşer', async () => {
    const w2 = backend.db.items.find((i) => i.work_item_id === 'w2')!
    backend.db.dateRequests.push({
      request_id: 'dr-seed',
      work_item_id: 'w2',
      status: 'pending',
      old_start_on: '2026-11-23',
      old_end_on: '2026-12-04',
      new_start_on: '2026-11-23',
      new_end_on: '2026-12-11',
      requester: 'acc-coord',
    })
    w2.pending_date_request = {
      request_id: 'dr-seed',
      new_start_on: '2026-11-23',
      new_end_on: '2026-12-11',
    }
    const app = await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi?secili=w2' })
    await ganttReady()
    await until(() => datesBadge() === '1', 'tarih rozeti')
    expect(overdueBadge()).toBe('1')
    await until(() => tp('tp-approve'), 'Onayla')
    tp('tp-approve')!.click()
    await until(() => datesBadge() === null, 'tarih rozeti düştü')
    await app.router.push('/gorevler')
    await until(() => requestCount() === 0, '03 talep sayacı 0')
    expect(datesBadge()).toBeNull()
    // Admin merceğinde 03 sayaçları programa özgü (birim süzgeci yok), rozet panodan.
    expect(lastCounts()!.query.get('department_id')).toBeNull()
    expect(backend.sent('GET', '/v1/reports/dashboard').length).toBeGreaterThan(1)
    await idle(app.queryClient)
  })
})

describe('(a) Admin merceği: görev yazması da rapor panosu rozetini yeniler', () => {
  it('yönetici (Mekanik koordinatörü) w1’i tamamlar: Admin rozeti (pano) ve 03 Geciken birlikte düşer', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: '/gorevler?gorev=w1' })
    await until(() => overdueBadge() === '1', 'pano rozeti')
    await until(() => tabCount('Geciken') === 1, '03 geciken')
    expect(tabCount('Tümü')).toBe(4) // Admin: programın bütün görevleri
    const before = backend.sent('GET', '/v1/reports/dashboard').length
    await moveStatus('tamamlandi')
    await until(() => tabCount('Geciken') === 0, '03 geciken 0')
    await until(() => overdueBadge() === null, 'pano rozeti düştü')
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/reports/dashboard').length).toBeGreaterThan(before)
  })
})

describe('(a) Yönetici, Koordinatör merceğinde: yetki mercekten bağımsız', () => {
  it('yönetici (Mekanik koordinatörü) w1’i tamamlar: rozet Koordinatör sayacından, 03 aynı sayıda', async () => {
    const app = await boot({ ...ADMIN_COORD, path: '/gorevler?gorev=w1' })
    await until(() => overdueBadge() === '1', 'geciken rozeti (birim d1)')
    // Mercek içeriği daraltır: Yönetici d1 sayacını görür; Yazılım (d2) görevleri sayıya girmez.
    expect(tabCount('Tümü')).toBe(2)
    expect(lastCounts()!.query.get('department_id')).toBe('d1')
    expect(backend.sent('GET', '/v1/reports/dashboard')).toHaveLength(0) // Admin panosu çağrılmaz
    await moveStatus('tamamlandi')
    await until(() => overdueBadge() === null, 'rozet düştü')
    await until(() => tabCount('Geciken') === 0, '03 geciken 0')
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/reports/dashboard')).toHaveLength(0)
  })
})
