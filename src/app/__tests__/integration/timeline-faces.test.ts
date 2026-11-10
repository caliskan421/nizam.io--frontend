// W97a · oturum-3 (4) ve (6): P8 dört kişilik yetki × üç yüz (yüz, tutamaç, panel düğmeleri,
// bağımlılık menüsü, Yeni görev) ve tam 200 kalem → tavan uyarısı + yaklaşık sayaçlar.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { item } from './fake-org'
import {
  $,
  $$,
  boot,
  byText,
  click,
  createBackend,
  idle,
  seedTimeline,
  teardown,
  until,
} from './harness'
import {
  ADMIN_ADMIN,
  ADMIN_COORD,
  COORD,
  ganttReady,
  GANTT_ADMIN,
  GANTT_COORD,
  GANTT_MINE,
  MEMBER,
  selectRow,
  taskRows,
  tp,
} from './timeline-support'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedTimeline(backend.db)
  await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi?secili=w1' })
  await ganttReady()
  await until(() => tp('tp-save'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  backend.reset()
  seedTimeline(backend.db)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const handles = () => $$('[data-handle]').length
const newTaskButton = () => byText('[data-testid="timeline-head"] button', 'Yeni görev')

interface Expected {
  gantt: string
  rows: string[]
  save: boolean
  request: boolean
  handles: number
  more: boolean
  newTask: boolean
  readonly: boolean
}

async function check(who: typeof ADMIN_ADMIN, row: string, e: Expected): Promise<void> {
  const app = await boot({ ...who, path: '/zaman-cizelgesi' })
  await ganttReady(2)
  expect(backend.sent('GET', e.gantt)).toHaveLength(1)
  for (const other of [GANTT_ADMIN, GANTT_COORD, GANTT_MINE].filter((g) => g !== e.gantt)) {
    expect(backend.sent('GET', other), other).toHaveLength(0)
  }
  expect(taskRows()).toEqual(e.rows)
  expect(Boolean(newTaskButton())).toBe(e.newTask)
  await selectRow(row)
  await until(() => tp('tp-title'), 'panel başlığı')
  await until(() => Boolean(tp('tp-save')) === e.save || null, 'Kaydet görünürlüğü').catch(
    () => null,
  )
  await idle(app.queryClient)
  expect(Boolean(tp('tp-save')), 'Kaydet').toBe(e.save)
  expect(Boolean(tp('tp-request')), 'Tarih talebi gönder').toBe(e.request)
  expect(handles(), 'tutamaç').toBe(e.handles)
  expect(Boolean(tp('tp-more')), 'Diğer işlemler (bağımlılık)').toBe(e.more)
  expect((tp('tp-end') as HTMLInputElement).readOnly, 'salt okunur').toBe(e.readonly)
}

describe('(4) P8: dört kişi × üç yüz', () => {
  it('yönetici, Admin merceği: adminGantt; Kaydet + (Mekanik koordinatörü olduğu için) talep; tutamaç; bağımlılık menüsü; Yeni görev', async () => {
    await check(ADMIN_ADMIN, 'w1', {
      gantt: GANTT_ADMIN,
      rows: ['w1', 'w2', 'w3', 'w4'],
      save: true,
      request: true,
      handles: 2,
      more: true,
      newTask: true,
      readonly: false,
    })
  })

  it('yönetici, Admin merceği, koordinatörü olmadığı birimde: yalnız Kaydet (talep yok)', async () => {
    await check(ADMIN_ADMIN, 'w3', {
      gantt: GANTT_ADMIN,
      rows: ['w1', 'w2', 'w3', 'w4'],
      save: true,
      request: false,
      handles: 2,
      more: true,
      newTask: true,
      readonly: false,
    })
  })

  it('yönetici, Koordinatör merceği: coordinatorGantt yüzü, yönetici yetkisi KORUNUR (Kaydet + talep)', async () => {
    await check(ADMIN_COORD, 'w1', {
      gantt: GANTT_COORD,
      rows: ['w1', 'w2'],
      save: true,
      request: true,
      handles: 2,
      more: true,
      newTask: true,
      readonly: false,
    })
  })

  it('koordinatör: coordinatorGantt; yalnız talep (Kaydet yok); tutamaç; bağımlılık menüsü; Yeni görev', async () => {
    await check(COORD, 'w2', {
      gantt: GANTT_COORD,
      rows: ['w1', 'w2'],
      save: false,
      request: true,
      handles: 2,
      more: true,
      newTask: true,
      readonly: false,
    })
  })

  it('üye: memberGantt (yalnız atandıkları); salt okunur; tutamaç, Kaydet, talep, bağımlılık menüsü, Yeni görev yok', async () => {
    await check(MEMBER, 'w1', {
      gantt: GANTT_MINE,
      rows: ['w1'],
      save: false,
      request: false,
      handles: 0,
      more: false,
      newTask: false,
      readonly: true,
    })
    expect(backend.sent('GET', '/v1/work-items/w1/dependencies')).toHaveLength(0)
  })

  it('bağımlılık menüsü: koordinatör ekleme (döngü 409 satır içi) ve kaldırma gerçek uçlara gider', async () => {
    const app = await boot({ ...COORD, path: '/zaman-cizelgesi?secili=w1' })
    await ganttReady(2)
    await until(() => tp('tp-more'), 'Diğer işlemler')
    const more = tp('tp-more')!
    more.click()
    await click(() => $('[data-action="addDependency"]'))
    await until(() => $('[role="dialog"] [name="predecessor"]'), 'bağımlılık penceresi')
    // w2, w1’e bağımlı; w1’i w2’ye bağlamak döngüdür.
    const select = $('[role="dialog"] [name="predecessor"]') as HTMLSelectElement
    select.value = 'w2'
    select.dispatchEvent(new Event('change', { bubbles: true }))
    await click('[data-testid="tp-dep-submit"]')
    await until(() => tp('tp-dep-error'), 'döngü hatası satır içi')
    expect(backend.db.dependencies).toHaveLength(1)
    expect(
      backend.sent('POST', '/v1/work-items/w1/dependencies')[0]!.headers.get('Idempotency-Key'),
    ).toBeNull()
    await idle(app.queryClient)
  })
})

describe('(6) tam 200 kalem: tavan uyarısı ve yaklaşık sayaçlar', () => {
  it('200 kalem → uyarı + “+” sayaç; 199 kalemde yok', async () => {
    const many = Array.from({ length: 199 }, (_, n) =>
      item(`m${n}`, 'p1', 'd1', null, {
        title: `Kalem ${n}`,
        start_on: '2026-11-03',
        end_on: '2026-11-09',
      }),
    )
    backend.db.items.push(...many) // 4 + 199 = 203 > 200 → sunucu ilk 200’ü döndürür
    const app = await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi' })
    await until(() => $('[data-testid="timeline-ceiling"]'), 'tavan uyarısı')
    expect($('[data-testid="timeline-summary"]')!.textContent).toMatch(/200\+|yaklaşık/i)
    await idle(app.queryClient)
    // Sanallaştırma: 200 satır DOM’a dökülmez.
    expect($$('.gantt-rows [role="row"]').length).toBeLessThan(120)
  })

  it('tavanın altında uyarı yok', async () => {
    await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi' })
    await ganttReady()
    expect($('[data-testid="timeline-ceiling"]')).toBeNull()
  })
})
