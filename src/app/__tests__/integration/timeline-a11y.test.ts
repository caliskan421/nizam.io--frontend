// W97a · oturum-3 (8) ve (9): `treegrid` rolleri, klavye turu, panel/menü/pencere kapanınca odak
// dönüşü (KESİN 27: Esc, ✕, eylem sonrası) ve 03d tek satır alt görev açma → tek istek.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { $, $$, boot, click, createBackend, idle, seedTimeline, teardown, until } from './harness'
import { ADMIN_ADMIN, COORD, ganttReady, panel, rowEl, taskRows, tp } from './timeline-support'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedTimeline(backend.db)
  await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi?secili=w1' })
  await ganttReady()
  await until(() => tp('tp-more'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  backend.reset()
  seedTimeline(backend.db)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const key = (el: Element, k: string, init: KeyboardEventInit = {}) =>
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }),
  )
const rowTabStops = () => $$('.gantt-rows [role="row"][tabindex="0"]')

/** Sekmeyle ulaşılabilen her öğe (yalnız role=row değil): tabindex>=0 ya da doğal odaklanabilir. */
const tabbable = (root: Element) =>
  [...root.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,[tabindex]')].filter(
    (el) => el.tabIndex >= 0 && !el.hasAttribute('disabled'),
  )

describe('(8) treegrid rolleri ve klavye', () => {
  it('CX-F3-Ö-03: Gantt satırlarında TEK sekme durağı (aç/kapa düğmesi dahil sayılır)', async () => {
    await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi' })
    await ganttReady()
    expect(tabbable($('.gantt-rows')!)).toHaveLength(1)
    expect($$('[data-testid="subtask-toggle"]').every((b) => b.tabIndex === -1)).toBe(true)
    // klavye erişimi korunur: görev satırında → alt görevleri açar, ← kapatır
    const row = rowEl('w1')!
    row.focus()
    key(row, 'ArrowRight')
    await until(() => $$('[data-testid="subtask-row"]').length > 0, 'klavyeyle açıldı')
    expect(tabbable($('.gantt-rows')!)).toHaveLength(1)
    key(rowEl('w1')!, 'ArrowLeft')
    await until(() => $$('[data-testid="subtask-row"]').length === 0, 'klavyeyle kapandı')
  })

  it('roller: treegrid, grup seviye 1 + aria-expanded, görev seviye 2, tek sekme durağı', async () => {
    await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi?secili=w3' })
    await ganttReady()
    const grid = $('.gantt-rows')!
    expect(grid.getAttribute('role')).toBe('treegrid')
    expect(grid.getAttribute('aria-label')).toBeTruthy()
    expect(Number(grid.getAttribute('aria-rowcount'))).toBe(6)
    const group = rowEl('g:d1')!
    expect([group.getAttribute('aria-level'), group.getAttribute('aria-expanded')]).toEqual([
      '1',
      'true',
    ])
    expect(rowEl('w1')!.getAttribute('aria-level')).toBe('2')
    expect(rowEl('w3')!.getAttribute('aria-selected')).toBe('true')
    expect(rowEl('w1')!.getAttribute('aria-selected')).toBe('false')
    expect(rowEl('w1')!.getAttribute('aria-label')).toMatch(/Motor testi.*Devam ediyor/)
    expect(rowTabStops().map((r) => r.dataset.rowKey)).toEqual(['w3'])
  })

  it('↓/↑/Home/End odağı gezdirir; ← grubu kapatır; Enter görevi seçer ve paneli açar', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi' })
    await ganttReady()
    rowEl('g:d1')!.focus()
    key(document.activeElement!, 'ArrowDown')
    await until(() => document.activeElement === rowEl('w1'), 'odak w1')
    key(document.activeElement!, 'End')
    await until(() => document.activeElement === rowEl('w4'), 'odak son satır')
    key(document.activeElement!, 'Home')
    await until(() => document.activeElement === rowEl('g:d1'), 'odak ilk satır')
    key(document.activeElement!, 'ArrowLeft') // açık grubu kapatır
    await until(() => rowEl('g:d1')!.getAttribute('aria-expanded') === 'false', 'grup kapandı')
    expect(taskRows()).toEqual(['w3', 'w4'])
    key(document.activeElement!, 'ArrowRight')
    await until(() => taskRows().includes('w1'), 'grup açıldı')
    rowEl('w1')!.focus()
    key(document.activeElement!, 'Enter')
    await until(() => panel(), 'panel')
    expect(app.router.currentRoute.value.query.secili).toBe('w1')
  })
})

describe('odak dönüşü (KESİN 27)', () => {
  it('panel ✕ ile kapanınca odak seçimi açan satıra döner', async () => {
    await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi' })
    await ganttReady()
    rowEl('w1')!.focus()
    await click(() => rowEl('w1'))
    await until(() => panel(), 'panel')
    tp('tp-close')!.click()
    await until(() => !panel(), 'panel kapandı')
    await until(() => document.activeElement !== document.body, 'odak gövdede değil')
    expect(document.activeElement).toBe(rowEl('w1'))
  })

  it('panel Esc ile kapanınca odak gövdeye düşmez', async () => {
    await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi' })
    await ganttReady()
    rowEl('w2')!.focus()
    await click(() => rowEl('w2'))
    await until(() => panel(), 'panel')
    key(panel()!, 'Escape')
    await until(() => !panel(), 'panel kapandı')
    await until(() => document.activeElement !== document.body, 'odak gövdede değil')
    expect(document.activeElement).toBe(rowEl('w2'))
  })

  it('“Diğer işlemler” menüsü Esc ile kapanınca odak tetikleyiciye döner', async () => {
    await boot({ ...COORD, path: '/zaman-cizelgesi?secili=w1' })
    await ganttReady(2)
    await until(() => tp('tp-more'), 'tetikleyici')
    const trigger = tp('tp-more')!
    trigger.click()
    const menu = await until(() => $('[role="menu"]'), 'menü')
    key(menu, 'Escape')
    await until(() => !$('[role="menu"]'), 'menü kapandı')
    expect(document.activeElement).toBe(trigger)
    expect(tp('tp-more')!.hasAttribute('aria-controls')).toBe(false) // liste yokken aria-controls verilmez
  })

  it('tarih talebi formu ✕/Esc ile kapanınca odak “Tarih talebi gönder”e döner; istek gitmez', async () => {
    await boot({ ...COORD, path: '/zaman-cizelgesi?secili=w2' })
    await ganttReady(2)
    await until(() => tp('tp-request'), 'talep düğmesi')
    const trigger = tp('tp-request')!
    trigger.focus()
    trigger.click()
    const dlg = await until(() => $('[role="dialog"]'), 'form')
    key(dlg, 'Escape')
    await until(() => !$('[role="dialog"]'), 'form kapandı')
    expect(document.activeElement).toBe(trigger)
    expect(backend.sent('POST', '/v1/date-change-requests')).toHaveLength(0)
  })

  it('bağımlılık penceresi Esc ile kapanınca odak panelde kalır, gövdeye düşmez', async () => {
    await boot({ ...COORD, path: '/zaman-cizelgesi?secili=w1' })
    await ganttReady(2)
    await until(() => tp('tp-more'), 'tetikleyici')
    tp('tp-more')!.click()
    await click(() => $('[data-action="addDependency"]'))
    const dlg = await until(() => $('[role="dialog"]'), 'bağımlılık penceresi')
    key(dlg, 'Escape')
    await until(() => !$('[role="dialog"]'), 'pencere kapandı')
    await until(() => document.activeElement !== document.body, 'odak gövdede değil')
    expect(panel()!.contains(document.activeElement)).toBe(true)
  })
})

describe('(9) 03d alt görev: tek satır açma → tek istek', () => {
  const SUBS = '/v1/work-items/w1/subtasks'

  it('kapalıyken istek 0; açılışta tek istek; satırlar, çip ve ilerleme; ikinci satır istek açmaz', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi' })
    await ganttReady()
    expect(backend.requests.filter((r) => r.path.endsWith('/subtasks'))).toHaveLength(0)
    expect($('[data-testid="subtask-mode"] [aria-pressed="true"]')?.textContent).toMatch(/Kapalı/)
    const y2 = (k: string) => (rowEl(k) as HTMLElement).style.top
    const before = y2('w2')

    ;(rowEl('w1')!.querySelector('[data-testid="subtask-toggle"]') as HTMLElement).click()
    await until(() => $$('[data-testid="subtask-row"]').length === 3, '3 alt görev satırı')
    await idle(app.queryClient)
    expect(backend.sent('GET', SUBS)).toHaveLength(1)
    expect(backend.requests.filter((r) => r.path.endsWith('/subtasks'))).toHaveLength(1)
    // Aynı düzlem: sonraki satır 3 × alt satır yüksekliği kadar aşağı kaydı; w2 çubuğu/oku aynı kaydı.
    expect(y2('w2')).not.toBe(before)
    expect(parseFloat(y2('w2')) - parseFloat(before)).toBeGreaterThan(0)
    expect($('[data-testid="subtask-chip"]')?.textContent?.trim()).toBe('1/3')
    expect($('[data-testid="subtask-progress"]')).not.toBeNull()
    expect($('[data-testid="subtask-toggle-count"]')?.textContent?.trim()).toBe('1/3')
    expect(
      $$('[data-testid="subtask-rows"] [role="row"]').every(
        (r) => r.getAttribute('aria-level') === '3',
      ),
    ).toBe(true)
    // CX-F3-Ö-03: açık alt görev satırları sayıya girer (satır sayısı + 3; w2 indeksi 3 kayar)
    const rowcount = Number($('.gantt-rows')!.getAttribute('aria-rowcount'))
    expect(rowcount).toBe($$('.gantt-rows > [role="row"]').length + 3)
    expect(Number(rowEl('w2')!.getAttribute('aria-rowindex'))).toBe(
      Number(rowEl('w1')!.getAttribute('aria-rowindex')) + 1 + 3,
    )
    expect($$('[data-testid="subtask-nodate"]')).toHaveLength(3) // tarihsiz → “Tarih yok”, sahte elmas yok

    // Kapat: satırlar kalkar, kayma geri alınır, yeni istek yok.
    ;(rowEl('w1')!.querySelector('[data-testid="subtask-toggle"]') as HTMLElement).click()
    await until(() => $$('[data-testid="subtask-row"]').length === 0, 'satırlar kalktı')
    expect(y2('w2')).toBe(before)
    expect(backend.sent('GET', SUBS)).toHaveLength(1)
  })

  it('alt görevi olmayan satır: tek istek, tek “Alt görev yok” satırı', async () => {
    await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi' })
    await ganttReady()
    ;(rowEl('w3')!.querySelector('[data-testid="subtask-toggle"]') as HTMLElement).click()
    await until(() => $('[data-testid="subtask-empty"]'), 'boş durum')
    expect(backend.sent('GET', '/v1/work-items/w3/subtasks')).toHaveLength(1)
  })
})
