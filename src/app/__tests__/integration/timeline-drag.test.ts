// W97a · oturum-3 (5) ve (10): sürükleme → 5 sn gecikme → “İptal et” (istek 0) / süre sonu (tek
// istek) / bekleme sırasında kapsam değişimi, çıkış → başka hesapla giriş, sayfa sökülmesi (istek
// 0, bildirim yok — Ö-07/Ö-08); kardeş sekme çıkışı sırasında geciktirilmiş Gantt GET’i yeni
// oturumun önbelleğine yazılmaz. Gerçek uygulama kökü, sahte saat (`Date`/`setTimeout`).
import { QueryObserver } from '@tanstack/vue-query'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { isValidIdempotencyKey } from '@/shared/http/mutation/idempotency-key'
import {
  $,
  boot,
  byText,
  click,
  createBackend,
  fill,
  idle,
  PEOPLE,
  seedTimeline,
  siblingSays,
  switchScope,
  teardown,
  toasts,
  until,
} from './harness'
import { addDays, dropNextResponses } from './fake-org-timeline'
import {
  ADMIN_ADMIN,
  COORD,
  ganttReady,
  GANTT_ADMIN,
  GANTT_COORD,
  REQUESTS,
  rowEl,
  selectRow,
  tp,
} from './timeline-support'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const EXTEND = '/v1/work-items/w1/extend'
const snack = () => $('[data-testid="date-change-snack"]')

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedTimeline(backend.db)
  await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi?secili=w1' })
  await ganttReady()
  await until(() => $('[data-handle="end"]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  backend.reset()
  seedTimeline(backend.db)
})
afterEach(() => {
  vi.useRealTimers()
  teardown()
})
afterAll(() => backend.server.close())

const elapse = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await vi.advanceTimersByTimeAsync(50)
}

/** Seçili satırın bitiş tutamacını sağa sürükler (pointerdown → move → up). */
function dragEnd(task: string, dx: number): void {
  const hit = $(`[data-work-item="${task}"] [data-handle="end"] .gantt-handle__hit`)!
  const fire = (type: string, clientX: number) =>
    hit.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX, button: 0 }))
  fire('pointerdown', 100)
  fire('pointermove', 100 + dx)
  fire('pointerup', 100 + dx)
}

async function admin(path = '/zaman-cizelgesi?secili=w1') {
  const app = await boot({ ...ADMIN_ADMIN, path })
  await ganttReady()
  await until(() => $('[data-handle="end"]'), 'tutamaç')
  vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'Date'] })
  return app
}

describe('(5) sürükleme → 5 sn gecikme', () => {
  it('süre sonunda TEK extend isteği; Gantt yenilenir, bildirim kalkar; geri alma isteği yok', async () => {
    const app = await admin()
    const before = backend.db.items.find((i) => i.work_item_id === 'w1')!.end_on as string
    dragEnd('w1', 200)
    await elapse(10)
    expect(snack()!.textContent).toContain('uzatıldı')
    await elapse(4000)
    expect(backend.sent('POST', EXTEND)).toHaveLength(0)
    await elapse(1100)
    await idle(app.queryClient)
    const [post] = backend.sent('POST', EXTEND)
    expect(backend.sent('POST', EXTEND)).toHaveLength(1)
    const days = (post!.body as { days: number }).days
    expect(days).toBeGreaterThan(0)
    expect(isValidIdempotencyKey(post!.headers.get('Idempotency-Key') ?? '')).toBe(true)
    expect((post!.body as { expected_dates_revision: number }).expected_dates_revision).toBe(1)
    expect(backend.db.items.find((i) => i.work_item_id === 'w1')!.end_on).toBe(
      addDays(before, days),
    )
    expect(backend.sent('GET', GANTT_ADMIN).length).toBeGreaterThan(1) // yeniden okundu
    await elapse(10_000)
    expect(backend.sent('POST', EXTEND)).toHaveLength(1)
  })

  it('sonuç bilinmiyor (yanıt kayıp, istek uygulandı): AYNI anahtarla tek tekrar, sunucuda TEK uzatma (BE-056)', async () => {
    const app = await admin()
    const before = backend.db.items.find((i) => i.work_item_id === 'w1')!.end_on as string
    dropNextResponses(backend.db)
    dragEnd('w1', 200)
    await elapse(10)
    await elapse(5100)
    await idle(app.queryClient)
    const posts = backend.sent('POST', EXTEND)
    expect(posts).toHaveLength(2)
    expect(posts[1]!.headers.get('Idempotency-Key')).toBe(posts[0]!.headers.get('Idempotency-Key'))
    const days = (posts[0]!.body as { days: number }).days
    expect(backend.db.items.find((i) => i.work_item_id === 'w1')!.end_on).toBe(
      addDays(before, days),
    )
    await elapse(10_000)
    expect(backend.sent('POST', EXTEND)).toHaveLength(2)
  })

  it('“İptal et”: istek hiç gönderilmez, bildirim kalkar', async () => {
    await admin()
    dragEnd('w1', 200)
    await elapse(10)
    ;($('.rp-snack__undo') as HTMLElement).click()
    await elapse(10_000)
    expect(snack()).toBeNull()
    expect(backend.sent('POST', EXTEND)).toHaveLength(0)
    expect(backend.sent('PATCH', '/v1/work-items/w1')).toHaveLength(0)
  })

  it('✕ yalnız bildirimi kapatır; gönderim sürer', async () => {
    await admin()
    dragEnd('w1', 200)
    await elapse(10)
    const close = $('[data-testid="date-change-snack"] button[aria-label="Kapat"]')
    expect(close).not.toBeNull()
    close!.click()
    await elapse(10)
    expect(snack()).toBeNull()
    expect(backend.sent('POST', EXTEND)).toHaveLength(0)
    await elapse(5200)
    expect(backend.sent('POST', EXTEND)).toHaveLength(1)
  })

  it('Koordinatör, klavye (Shift+→): aynı yoldan talep gönderir; Admin yolu (extend/PATCH) yok', async () => {
    const app = await boot({ ...COORD, path: '/zaman-cizelgesi?secili=w2' })
    await ganttReady(2)
    await until(() => tp('tp-request'), 'panel')
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'Date'] })
    rowEl('w2')!.focus()
    rowEl('w2')!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    )
    await elapse(10)
    expect(snack()!.textContent).toMatch(/onaya gider/i)
    await elapse(5200)
    await idle(app.queryClient)
    const [post] = backend.sent('POST', REQUESTS)
    expect(backend.sent('POST', REQUESTS)).toHaveLength(1)
    expect(post!.body).toMatchObject({
      work_item_id: 'w2',
      new_start_on: '2026-11-23',
      new_end_on: '2026-12-05',
    })
    expect(backend.sent('POST', '/v1/work-items/w2/extend')).toHaveLength(0)
    expect(backend.sent('PATCH', '/v1/work-items/w2')).toHaveLength(0)
  })

  it('bekleme sırasında KAPSAM değişimi: istek 0, bildirim kalkar', async () => {
    const app = await admin()
    dragEnd('w1', 200)
    await elapse(10)
    expect(snack()).not.toBeNull()
    vi.useRealTimers()
    await switchScope('Program', 'Teknofest 2027')
    await until(() => app.scope.programId === 'p2', 'kapsam p2')
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'Date'] })
    await elapse(6000)
    expect(backend.sent('POST', EXTEND)).toHaveLength(0)
    expect(snack()).toBeNull()
  })

  it('bekleme sırasında SAYFA sökülmesi: istek 0, bildirim yok', async () => {
    const app = await admin()
    dragEnd('w1', 200)
    await elapse(10)
    await app.router.push('/gorevler')
    await elapse(6000)
    await idle(app.queryClient)
    expect(backend.sent('POST', EXTEND)).toHaveLength(0)
    expect(toasts()).not.toMatch(/uzat/i)
    expect(snack()).toBeNull()
  })

  it('bekleme sırasında ÇIKIŞ → başka hesapla giriş: önceki hesabın bekleyeni gitmez', async () => {
    const app = await admin()
    dragEnd('w1', 200)
    await elapse(10)
    vi.useRealTimers()
    await click('aside button[aria-label="Çıkış yap"]')
    await until(() => $('[data-testid="login-form"]'), 'giriş formu')
    await fill('[data-testid="login-form"] [name="email"]', PEOPLE.member.email)
    await fill('[data-testid="login-form"] [name="password"]', 'dogru-parola')
    await click(() => byText('[data-testid="login-form"] button', 'Giriş'))
    await until(() => app.session.accountId === PEOPLE.member.account_id, 'yeni oturum')
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'Date'] })
    await elapse(6000)
    expect(backend.sent('POST', EXTEND)).toHaveLength(0)
    expect(toasts()).not.toMatch(/uzat/i)
    void selectRow
    void GANTT_COORD
  })
})

describe('(10) kardeş sekme çıkışı sırasında geciktirilmiş Gantt GET’i', () => {
  it('eski oturumun yanıtı yeni oturumun önbelleğine yazılmaz', async () => {
    const held = backend.hold('GET', GANTT_ADMIN)
    const app = await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi' })
    await held.arrived
    // Kardeş sekme çıkışı eşdeğeri: oturum bu sekmede kapanır; yanıt hâlâ yolda.
    await click('aside button[aria-label="Çıkış yap"]')
    await until(() => $('[data-testid="login-form"]'), 'giriş formu')
    held.release()
    await idle(app.queryClient)
    expect(
      app.queryClient
        .getQueryCache()
        .getAll()
        .filter((q) => String(q.queryKey).includes('gantt') && q.state.data !== undefined),
    ).toHaveLength(0)
    expect($('[data-testid="timeline-page"]')).toBeNull()
  })
})

describe('(10b) GERÇEK kardeş ileti kanalı: çıkış → başka hesapla giriş TAMAMLANIR → geç Gantt yanıtı', () => {
  it('kardeş sekme çıkışı + yeni hesapla tamamlanmış giriş sonrası gelen eski yanıt yeni önbelleğe yazılmaz', async () => {
    const held = backend.hold('GET', GANTT_ADMIN)
    const app = await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi', siblingChannel: true })
    await held.arrived
    // Sayfa söküldüğünde TanStack, tek gözlemcisi giden sorgunun isteğini zaten iptal eder; bu,
    // oturum korumasını ÖRTER. Başka bir gözlemci istek uçuştayken sorguyu canlı tutar: yanıtın
    // yazılmaması yalnız oturum korumasına (iptal + boşaltma, `sessionBound`) bağlıdır.
    const stale = app.queryClient
      .getQueryCache()
      .getAll()
      .find((q) => String(q.queryKey).includes('gantt'))!
    const keeper = new QueryObserver(app.queryClient, {
      queryKey: stale.queryKey,
      queryFn: stale.options.queryFn,
      retry: false,
    })
    const unsubscribe = keeper.subscribe(() => undefined)
    const { SESSION_MESSAGE_VERSION } = await import('@/shared/session/messages')
    // Kardeş sekme çıkışı: bu sekmede oturum KENDİLİĞİNDEN kapanır (yerel çıkış düğmesi yok).
    siblingSays({ v: SESSION_MESSAGE_VERSION, type: 'logout', accountId: PEOPLE.admin.account_id })
    await until(() => $('[data-testid="login-form"]'), 'giriş formu')
    expect(app.session.accountId).toBeNull()
    // Başka hesapla giriş TAMAMLANIR.
    await fill('[data-testid="login-form"] [name="email"]', PEOPLE.member.email)
    await fill('[data-testid="login-form"] [name="password"]', 'dogru-parola')
    await click(() => byText('[data-testid="login-form"] button', 'Giriş'))
    await until(() => app.session.accountId === PEOPLE.member.account_id, 'yeni oturum')
    // Eski oturumun yanıtı ancak şimdi gelir.
    held.release()
    await idle(app.queryClient)
    unsubscribe()
    const withData = app.queryClient
      .getQueryCache()
      .getAll()
      .filter((q) => String(q.queryKey).includes('gantt') && q.state.data !== undefined)
    expect(withData.map((q) => JSON.stringify(q.state.data)).join('')).not.toContain('Motor testi')
    expect(withData.filter((q) => JSON.stringify(q.queryKey).includes('admin'))).toHaveLength(0)
  })
})
