// W97a · oturum-3 (2) ve (3): Koordinatör "Tarih talebi gönder" → Gantt + görev + talep yenilenir,
// 03 talep bandı güncellenir; Admin bekleyen talebi onaylar/reddeder → aynı yenilemeler, 03 bandı
// ve kenar menüsü rozeti güncellenir. P20: 03 bandında "Talepleri incele" talep süzgecini açar.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { isValidIdempotencyKey } from '@/shared/http/mutation/idempotency-key'
import {
  $,
  $$,
  boot,
  byText,
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
  COORD,
  dialog,
  ganttReady,
  GANTT_ADMIN,
  GANTT_COORD,
  MEMBER,
  panel,
  REQUESTS,
  selectRow,
  tp,
} from './timeline-support'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedTimeline(backend.db)
  await boot({ ...COORD, path: '/zaman-cizelgesi?secili=w2' })
  await ganttReady()
  await until(() => tp('tp-request'), 'ısınma')
  teardown()
  await boot({ ...ADMIN_ADMIN, path: '/gorevler' })
  await until(() => $('[data-work-item]'), 'ısınma liste')
  teardown()
}, 60_000)
beforeEach(() => {
  backend.reset()
  seedTimeline(backend.db)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const band = () => $('.rp-reqbar')
const badge = () => $('.side-badge--dates')

/** Sunucuda w2 için Kerem’in açtığı bekleyen talep (Admin senaryoları için). */
function seedPending(): void {
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
  const w2 = backend.db.items.find((i) => i.work_item_id === 'w2')!
  w2.pending_date_request = {
    request_id: 'dr-seed',
    new_start_on: '2026-11-23',
    new_end_on: '2026-12-11',
  }
}

describe('(2) Koordinatör: Tarih talebi gönder', () => {
  it('talep açılır; Gantt + görev + talep yenilenir; panel “bekliyor”, 03 bandı sayar', async () => {
    const app = await boot({ ...COORD, path: '/zaman-cizelgesi' })
    await ganttReady(2)
    await selectRow('w2')
    await until(() => tp('tp-request'), '“Tarih talebi gönder” düğmesi')
    expect(tp('tp-save')).toBeNull()
    const ganttBefore = backend.sent('GET', GANTT_COORD).length
    const itemBefore = backend.sent('GET', '/v1/work-items/w2').length

    tp('tp-request')!.click()
    await until(() => $('[role="dialog"] [name="end"]'), 'talep formu')
    await fill('[role="dialog"] [name="end"]', '11.12.2026')
    await fill('[role="dialog"] [name="reason"]', 'Tedarik gecikti')
    await click('[data-testid="tp-request-submit"]')
    await until(() => !dialog(), 'form kapanır')
    await idle(app.queryClient)

    const [post] = backend.sent('POST', REQUESTS)
    expect(backend.sent('POST', REQUESTS)).toHaveLength(1)
    expect(post!.body).toEqual({
      work_item_id: 'w2',
      new_start_on: '2026-11-23',
      new_end_on: '2026-12-11',
      reason: 'Tedarik gecikti',
      expected_dates_revision: expect.any(Number),
    })
    expect(isValidIdempotencyKey(post!.headers.get('Idempotency-Key') ?? '')).toBe(true)
    expect(post!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(backend.sent('GET', GANTT_COORD).length).toBeGreaterThan(ganttBefore)
    expect(backend.sent('GET', '/v1/work-items/w2').length).toBeGreaterThan(itemBefore)
    // Taze görev: bekleyen talep var → talep düğmesi gizli, “bekliyor” bilgisi görünür.
    await until(() => tp('tp-pending'), 'bekleyen talep bilgisi')
    expect(tp('tp-request')).toBeNull()
    expect(tp('tp-pending')!.textContent).toContain('11')

    await app.router.push('/gorevler')
    await until(() => band(), '03 talep bandı')
    expect(band()!.textContent).toContain('1')
    expect($('[data-testid="request-review"]')).toBeNull() // inceleme yalnız yönetici
  })

  it('bekleyen talep varken 409: görev yeniden okunur, talep düğmesi gizlenir, ikinci kayıt yok', async () => {
    const app = await boot({ ...COORD, path: '/zaman-cizelgesi?secili=w2' })
    await ganttReady(2)
    await until(() => tp('tp-request'), 'talep düğmesi (talep yok)')
    seedPending() // başka sekmeden açıldı; panel henüz bilmiyor
    tp('tp-request')!.click()
    await until(() => $('[role="dialog"] [name="end"]'), 'form')
    await fill('[role="dialog"] [name="end"]', '15.12.2026')
    await click('[data-testid="tp-request-submit"]')
    // 409 sonrası görev yeniden okunur: bekleyen talep görünür, talep düğmesi/form kalkar.
    await until(() => tp('tp-pending'), 'yeniden okunan bekleyen talep')
    await until(() => !tp('tp-request'), 'talep düğmesi gizlenir')
    await idle(app.queryClient)
    expect(backend.sent('POST', REQUESTS)).toHaveLength(1)
    expect(backend.db.dateRequests).toHaveLength(1)
  })
})

describe('(3) Admin: bekleyen talebi onayla / reddet', () => {
  it('onay: tarih değişir, Gantt + görev + talepler yenilenir; band ve rozet güncellenir', async () => {
    seedPending()
    const app = await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi?secili=w2' })
    await ganttReady()
    await until(() => badge(), 'kenar menüsü rozeti (1 bekleyen talep)')
    expect(badge()!.textContent?.trim()).toBe('1')
    await until(() => tp('tp-approve'), 'Onayla')
    expect(tp('tp-request')).toBeNull() // yönetici talep açamaz; koordinatör olgusu yok bu birimde? (d1 koordinatörü)
    const ganttBefore = backend.sent('GET', GANTT_ADMIN).length

    tp('tp-approve')!.click()
    await until(() => !tp('tp-approve'), 'bekleyen talep düştü')
    await idle(app.queryClient)
    const [review] = backend.sent('POST', `${REQUESTS}/dr-seed/review`)
    expect(review!.body).toEqual({ decision: 'approved' })
    expect(review!.headers.get('X-Nizamio-Program')).toBeNull() // S1: başlıksız
    expect(backend.sent('GET', GANTT_ADMIN).length).toBeGreaterThan(ganttBefore)
    expect(backend.db.items.find((i) => i.work_item_id === 'w2')!.end_on).toBe('2026-12-11')
    expect((tp('tp-end') as HTMLInputElement).value).toBe('11.12.2026')
    await until(() => !badge(), 'rozet düştü')

    await app.router.push('/gorevler')
    await until(() => $('[data-work-item]'), 'liste')
    expect(band()).toBeNull()
  })

  it('red: tarih değişmez; bekleyen talep, band ve rozet düşer', async () => {
    seedPending()
    const app = await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi?secili=w2' })
    await ganttReady()
    await until(() => tp('tp-reject'), 'Reddet')
    tp('tp-reject')!.click()
    await until(() => !tp('tp-reject'), 'bekleyen talep düştü')
    await idle(app.queryClient)
    expect(backend.sent('POST', `${REQUESTS}/dr-seed/review`)[0]!.body).toEqual({
      decision: 'rejected',
    })
    expect(backend.db.items.find((i) => i.work_item_id === 'w2')!.end_on).toBe('2026-12-04')
    await until(() => !badge(), 'rozet düştü')
  })

  it('başka yönetici sekmesi önce karara bağladı: 409 → yeniden okunur, ikinci karar yok', async () => {
    seedPending()
    const app = await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi?secili=w2' })
    await ganttReady()
    await until(() => tp('tp-approve'), 'Onayla')
    // Sunucuda talep başka yerden reddedildi; panel hâlâ bekliyor sanıyor.
    backend.db.dateRequests[0]!.status = 'rejected'
    tp('tp-approve')!.click()
    await until(() => tp('tp-error') ?? !tp('tp-approve'), 'sonuç')
    await idle(app.queryClient)
    expect(backend.sent('POST', `${REQUESTS}/dr-seed/review`)).toHaveLength(1)
  })
})

const extension = () => $$('[data-request]').map((e) => e.dataset.request)

describe('E-03C-42 (K-2): bekleyen talep çubukta kesik uzantı', () => {
  it('Admin: bekleyen talepli HER satırda (seçim gerekmez) uzantı; ek görev okuması yok (BE-052)', async () => {
    seedPending()
    const app = await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi' })
    await ganttReady(2)
    await until(() => extension().length > 0, 'uzantı')
    expect(extension()).toEqual(['end'])
    expect(document.querySelectorAll('[data-work-item="w2"] [data-request]')).toHaveLength(1)
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/work-items/w2')).toHaveLength(0)
    // Başka satırı seçmek uzantıyı kaldırmaz: uzantı satırın alanındandır.
    await selectRow('w1')
    await idle(app.queryClient)
    expect(extension()).toEqual(['end'])
  })

  it('Koordinatör kendi biriminde görür; Üye hiç görmez', async () => {
    seedPending()
    await boot({ ...COORD, path: '/zaman-cizelgesi?secili=w2' })
    await ganttReady(2)
    await until(() => extension().length > 0, 'koordinatör uzantısı')
    expect(extension()).toEqual(['end'])
    teardown()
    // Üye yüzünde sunucu `pending_date_request`'i yalnız yönetici/koordinatöre doldurur (null):
    // uzantı çizilmez.
    const w1 = backend.db.items.find((i) => i.work_item_id === 'w1')!
    w1.pending_date_request = {
      request_id: 'dr-w1',
      new_start_on: w1.start_on,
      new_end_on: '2027-01-15',
    }
    await boot({ ...MEMBER, path: '/zaman-cizelgesi?secili=w1' })
    await ganttReady(1)
    await until(() => panel(), 'panel')
    await until(() => tp('tp-status'), 'taze görev')
    expect(extension()).toEqual([])
  })
})

describe('P20: 03 bandı “Talepleri incele”', () => {
  it('yönetici: talep süzgeci açılır, yalnız bekleyen talepli görev listelenir', async () => {
    seedPending()
    const app = await boot({ ...ADMIN_ADMIN, path: '/gorevler' })
    await until(() => band(), 'talep bandı')
    expect($$('[data-work-item]').length).toBeGreaterThan(1)
    await click('[data-testid="request-review"]')
    await until(() => app.router.currentRoute.value.query.talep === '1', 'talep=1')
    await until(() => $$('[data-work-item]').length === 1, 'tek görev')
    expect($$('[data-work-item]').map((r) => r.dataset.workItem)).toEqual(['w2'])
    void byText
  })
})
