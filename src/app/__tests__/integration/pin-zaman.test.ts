// WP3 · İş 2 (e): zaman çizelgesi (03c) × görev listesi (03) × kenar menüsü, v0.15:
//  - kesilme YALNIZ `X-Result-Truncated: true` başlığıyla (BE-019): tam 200 kalemde uyarı yok;
//  - bekleyen talep uzantısı HER satırda (BE-052) ve 03 talep süzgeci (P20) AYNI görev kümesini
//    söyler; karar sonrası ikisi ve rozet birlikte küçülür;
//  - uzatma yanıtı kaybolunca AYNI anahtarla tek tekrar (BE-056); tekrarın `dates_revision`ı ilk
//    sonucunkidir — sonraki yazma bayat sürümle gitmez (409 edit_conflict yok).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { isValidIdempotencyKey } from '@/shared/http/mutation/idempotency-key'

import { item } from './fake-org'
import { addDays, dropNextResponses } from './fake-org-timeline'
import { $, $$, boot, createBackend, idle, seedTimeline, teardown, until } from './harness'
import { ADMIN_ADMIN, ganttReady, GANTT_ADMIN, REQUESTS, tp } from './timeline-support'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const EXTEND = '/v1/work-items/w1/extend'

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedTimeline(backend.db)
  await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi?secili=w1' })
  await ganttReady()
  await until(() => $('[data-handle="end"]'), 'ısınma 03c')
  teardown()
  await boot({ ...ADMIN_ADMIN, path: '/gorevler' })
  await until(() => $('[data-work-item]'), 'ısınma 03')
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

const filler = (count: number) =>
  Array.from({ length: count }, (_, n) =>
    item(`m${n}`, 'p1', 'd1', null, {
      title: `Kalem ${n}`,
      start_on: '2026-11-03',
      end_on: '2026-11-09',
    }),
  )

describe('(e) kesilme başlığı (BE-019): sezgi değil sunucu bildirimi', () => {
  it('TAM 200 kalem: başlık yok, uyarı yok, sayaç yaklaşık değil', async () => {
    backend.db.items.push(...filler(196)) // 4 + 196 = tam 200
    await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi' })
    await ganttReady()
    await until(() => $('[data-testid="timeline-summary"]'), 'özet')
    const [read] = backend.sent('GET', GANTT_ADMIN)
    expect(read).toBeDefined()
    expect($('[data-testid="timeline-ceiling"]')).toBeNull()
    expect($('[data-testid="timeline-summary"]')!.textContent).not.toMatch(/200\+/)
  })

  it('201 kalem: sunucu başlığı bildirir → uyarı ve “200+”', async () => {
    backend.db.items.push(...filler(197)) // 201
    const app = await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi' })
    await until(() => $('[data-testid="timeline-ceiling"]'), 'tavan uyarısı')
    expect($('[data-testid="timeline-summary"]')!.textContent).toMatch(/200\+/)
    await idle(app.queryClient)
  })
})

describe('(e) BE-052 çubuk uzantısı ↔ 03 talep süzgeci (P20) ↔ rozet', () => {
  function seedPending(id: string, request: string): void {
    const found = backend.db.items.find((i) => i.work_item_id === id)!
    backend.db.dateRequests.push({
      request_id: request,
      work_item_id: id,
      status: 'pending',
      old_start_on: found.start_on as string,
      old_end_on: found.end_on as string,
      new_start_on: found.start_on as string,
      new_end_on: addDays(found.end_on as string, 7),
      requester: 'acc-coord',
    })
    found.pending_date_request = {
      request_id: request,
      new_start_on: found.start_on as string,
      new_end_on: addDays(found.end_on as string, 7),
    }
  }
  const extended = () =>
    $$('[data-work-item] [data-request]')
      .map((e) => e.closest<HTMLElement>('[data-work-item]')!.dataset.workItem)
      .sort()
  const listed = () =>
    $$('[data-work-item]')
      .map((r) => r.dataset.workItem)
      .sort()
  const datesBadge = () => $('.side-badge--dates')?.textContent?.trim() ?? null

  it('iki bekleyen talep: Gantt’ta iki uzantı = 03 talep süzgecinde iki görev = rozet 2; biri reddedilince hepsi 1', async () => {
    seedPending('w2', 'dr-a')
    seedPending('w3', 'dr-b')
    const app = await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi' })
    await ganttReady(3)
    await until(() => extended().length === 2, 'uzantılar')
    const onGantt = extended()
    expect(onGantt).toEqual(['w2', 'w3'])
    await until(() => datesBadge() === '2', 'rozet 2')
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/work-items/w2')).toHaveLength(0) // ek görev okuması yok

    await app.router.push('/gorevler?talep=1')
    await until(() => listed().length === 2, '03 talep süzgeci')
    expect(listed()).toEqual(onGantt) // Gantt uzantı kümesiyle birebir aynı
    // Süzgeç: yalnız talepli görevler; Gantt’taki uzantı kümesiyle birebir aynı.

    await app.router.push('/zaman-cizelgesi?secili=w2')
    await ganttReady(3)
    await until(() => tp('tp-reject'), 'Reddet')
    tp('tp-reject')!.click()
    await until(() => extended().length === 1, 'tek uzantı')
    await until(() => datesBadge() === '1', 'rozet 1')
    expect(extended()).toEqual(['w3'])
    await app.router.push('/gorevler?talep=1')
    await until(() => listed().length === 1, '03 talep süzgeci 1')
    expect(listed()).toEqual(['w3'])
    await idle(app.queryClient)
    expect(backend.sent('POST', `${REQUESTS}/dr-a/review`)).toHaveLength(1)
  })
})

describe('(e) uzatma yanıt kaybı: aynı anahtarla tek tekrar, sonraki yazma bayat sürümle gitmez (BE-056)', () => {
  const dragEnd = (task: string, dx: number): void => {
    const hit = $(`[data-work-item="${task}"] [data-handle="end"] .gantt-handle__hit`)!
    const fire = (type: string, clientX: number) =>
      hit.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX, button: 0 }))
    fire('pointerdown', 100)
    fire('pointermove', 100 + dx)
    fire('pointerup', 100 + dx)
  }
  const elapse = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms)
    await vi.advanceTimersByTimeAsync(50)
  }

  it('yanıt kayıp → tek tekrar (aynı anahtar, tek uzatma); ikinci sürükleme güncel dates_revision ile gider', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi?secili=w1' })
    await ganttReady()
    await until(() => $('[data-handle="end"]'), 'tutamaç')
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'Date'] })
    const w1 = backend.db.items.find((i) => i.work_item_id === 'w1')!
    const original = w1.end_on as string
    dropNextResponses(backend.db)
    dragEnd('w1', 200)
    await elapse(10)
    await elapse(5100)
    await idle(app.queryClient)
    const posts = backend.sent('POST', EXTEND)
    expect(posts).toHaveLength(2)
    expect(posts[1]!.headers.get('Idempotency-Key')).toBe(posts[0]!.headers.get('Idempotency-Key'))
    expect(isValidIdempotencyKey(posts[0]!.headers.get('Idempotency-Key') ?? '')).toBe(true)
    const days = (posts[0]!.body as { days: number }).days
    expect(w1.end_on).toBe(addDays(original, days)) // TEK uzatma
    expect(w1.dates_revision).toBe(2)

    // Sonraki bağımsız sürükleme: yeni anahtar, GÜNCEL sürüm (2) — ilk sonucun/önbelleğin değil.
    await until(() => $('[data-handle="end"]'), 'tutamaç yeniden')
    dragEnd('w1', 200)
    await elapse(10)
    await elapse(5100)
    await idle(app.queryClient)
    const all = backend.sent('POST', EXTEND)
    expect(all).toHaveLength(3)
    expect((all[2]!.body as { expected_dates_revision: number }).expected_dates_revision).toBe(2)
    expect(all[2]!.headers.get('Idempotency-Key')).not.toBe(all[0]!.headers.get('Idempotency-Key'))
    expect(w1.dates_revision).toBe(3)
  })
})
