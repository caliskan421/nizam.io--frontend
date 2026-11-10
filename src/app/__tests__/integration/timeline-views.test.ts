// W97a · oturum-3 (1) ve (7): 03 liste ↔ zaman çizelgesi segment geçişi (kapsam korunur, süzgeç
// taşınmaz) ve derin bağlantılar (`secili`, `durum`, `olcek`, `departman`; 08 E-08-86; 03 E-03-54).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  boot,
  click,
  createBackend,
  idle,
  PEOPLE,
  seedTimeline,
  teardown,
  until,
} from './harness'
import {
  ADMIN_ADMIN,
  COORD,
  ganttReady,
  taskRows,
  GANTT_ADMIN,
  GANTT_COORD,
  panel,
  tp,
} from './timeline-support'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedTimeline(backend.db)
  await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi?secili=w1' })
  await ganttReady()
  teardown()
  await boot({ ...ADMIN_ADMIN, path: '/gorevler?q=a' })
  await until(() => $('[data-work-item]'), 'ısınma liste')
  teardown()
}, 60_000)
beforeEach(() => {
  backend.reset()
  seedTimeline(backend.db)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const query = (app: Awaited<ReturnType<typeof boot>>) => app.router.currentRoute.value.query

describe('(1) 03 liste ↔ zaman çizelgesi', () => {
  it('segment: kapsam korunur, 03 süzgeçleri taşınmaz; geri dönüşte de', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: '/gorevler?q=motor&durum=devam' })
    await until(() => $('[data-work-item]'), 'liste')
    await click('[data-testid="tasks-view-timeline"]')
    await ganttReady()
    expect(app.router.currentRoute.value.path).toBe('/zaman-cizelgesi')
    expect(query(app)).toEqual({})
    expect(app.scope.programId).toBe('p1')
    expect(app.scope.lens).toBe('admin')
    // Kapsam aynı: yönetici yüzü, program başlığıyla tek Gantt isteği.
    const [gantt] = backend.sent('GET', GANTT_ADMIN)
    expect(gantt!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(backend.sent('GET', GANTT_ADMIN)).toHaveLength(1)
    // Zaman çizelgesi süzgeci kendi parametreleriyle; "Liste" onları taşımaz.
    await app.router.push('/zaman-cizelgesi?durum=acik&olcek=ay')
    await until(() => query(app).olcek === 'ay', 'olcek')
    await click(() => $$('[role="group"][aria-label="Görünüm"] button')[0] ?? null)
    await until(() => $('[data-work-item]'), 'liste geri')
    expect(app.router.currentRoute.value.path).toBe('/gorevler')
    expect(query(app)).toEqual({})
    expect(app.scope.programId).toBe('p1')
    await idle(app.queryClient)
  })

  it('Koordinatör merceğinde yüz kapsamdan: coordinatorGantt, birim başlığı d1', async () => {
    const app = await boot({ ...COORD, path: '/gorevler' })
    await until(() => $('[data-work-item]'), 'liste')
    await click('[data-testid="tasks-view-timeline"]')
    await ganttReady(2)
    const [gantt] = backend.sent('GET', GANTT_COORD)
    expect(gantt!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(backend.sent('GET', GANTT_ADMIN)).toHaveLength(0)
    expect(taskRows()).toEqual(['w1', 'w2'])
    expect(app.scope.departmentId).toBe('d1')
  })
})

describe('(7) derin bağlantılar', () => {
  it('secili + durum + olcek + departman: panel açık, süzgeç ve ölçek uygulanır', async () => {
    const app = await boot({
      ...ADMIN_ADMIN,
      path: '/zaman-cizelgesi?secili=w3&durum=acik&olcek=gun&departman=d2',
    })
    await ganttReady(2)
    await until(() => panel(), 'panel')
    expect(taskRows()).toEqual(['w3', 'w4'])
    expect($('.gantt')?.getAttribute('data-scale')).toBe('gun')
    expect(tp('tp-title')?.textContent).toContain('Yazılım planı')
    expect(query(app)).toMatchObject({ secili: 'w3', durum: 'acik', olcek: 'gun', departman: 'd2' })
    // Süzgeç dışında kalan seçim URL'den düşer (panel kapanır).
    await app.router.push('/zaman-cizelgesi?secili=w1&departman=d2')
    await until(() => !panel() && query(app).secili === undefined, 'seçim URL’den düşer')
  })

  it('08 E-08-86 "Zaman çizelgesinde gör": departman süzgeci Gantt’ta uygulanır', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: '/koordinatorlukler' })
    await until(() => $('[data-testid="coordinatorships-page"]') ?? $('main'), 'sayfa')
    await app.router.push({ path: '/zaman-cizelgesi', query: { departman: 'd2' } })
    await ganttReady(2)
    expect(taskRows()).toEqual(['w3', 'w4'])
    expect(backend.sent('GET', GANTT_ADMIN)).toHaveLength(1)
  })

  it('03 E-03-54: görev panelinden "Tarih değişikliği iste" gerçek formu açar', async () => {
    await boot({ ...COORD, path: '/gorevler?gorev=w1' })
    const btn = await until(
      () => $('[data-testid="work-detail"] [data-action="date-request"]'),
      '03 panel düğmesi',
    )
    btn.click()
    await until(() => $('[role="dialog"] [name="end"]'), 'tarih talebi formu')
    expect(($('[role="dialog"] [name="end"]') as HTMLInputElement).value).toBe('20.11.2026')
  })
})
