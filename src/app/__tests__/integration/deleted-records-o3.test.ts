// W127 · O3 senaryo 6 (12 Silinen kayıtlar, yönetici): dört sekme + statik türler ağ istemez; saklama
// metni (P37) ve "Kalan süre" yokluğu; geri yükle → görev listesi / zaman çizelgesi / menü rozeti
// önce-sonra (KESİN 29); `work.department_unavailable` → Koordinatörlük sekmesi → ardından geri yükleme;
// kalıcı silmede onay ve odak. W128'in deleted-records.test.ts dosyasını tamamlar (aynı uçlar).
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { envelope, item, ORIGIN } from './fake-org'
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

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const ADMIN = { email: PEOPLE.admin.email, scope: { programId: 'p1', lens: 'admin' as const } }

interface Dead {
  tasks: string[]
  departments: string[]
  deptRestored: boolean
}
let dead: Dead = { tasks: [], departments: [], deptRestored: false }

const taskRow = (id: string, department: string) => ({
  work_item_id: id,
  title: id === 'wd' ? 'Silinmiş görev' : 'Silinmiş görev (kapalı birim)',
  department_id: department,
  status: 'devam_ediyor',
  deleted_at: '2026-11-11T10:00:00Z',
  file_count: 0,
})

function install(): void {
  backend.server.use(
    http.get(`${ORIGIN}/v1/admin/deleted/work-items`, () =>
      HttpResponse.json({ items: dead.tasks.map((id) => taskRow(id, id === 'wd' ? 'd1' : 'dd')) }),
    ),
    http.get(`${ORIGIN}/v1/meetings/deleted`, () =>
      HttpResponse.json({ items: [], next_cursor: '' }),
    ),
    http.get(`${ORIGIN}/v1/admin/deleted/departments`, () =>
      HttpResponse.json({
        departments: dead.departments.map((id) => ({
          department_id: id,
          name: 'Kapalı birim',
          kind: 'koordinatorluk',
          code: 'KAP',
          deleted_at: '2026-11-10T09:00:00Z',
        })),
      }),
    ),
    http.get(`${ORIGIN}/v1/admin/deleted/accounts`, () => HttpResponse.json({ accounts: [] })),
    http.patch(`${ORIGIN}/v1/admin/restore/work-items/:id`, ({ params }) => {
      const id = String(params.id)
      if (id === 'wx' && !dead.deptRestored) return envelope('work.department_unavailable', 409)
      dead.tasks = dead.tasks.filter((x) => x !== id)
      const owner = backend.db.accounts.find((a) => a.account_id === PEOPLE.member.account_id)!
      // Geçmiş bitişli, açık görev: geri gelince "geciken" olur (menü rozeti, pano).
      backend.db.items.push(
        item(id, 'p1', id === 'wd' ? 'd1' : 'd2', owner, {
          title: 'Silinmiş görev',
          status: 'devam_ediyor',
          start_on: '2026-10-01',
          end_on: '2026-11-01',
        }),
      )
      return HttpResponse.json({ work_item_id: id, status: 'restored' })
    }),
    http.patch(`${ORIGIN}/v1/admin/restore/departments/:id`, ({ params }) => {
      dead.departments = dead.departments.filter((x) => x !== String(params.id))
      dead.deptRestored = true
      return HttpResponse.json({ department_id: String(params.id), status: 'restored' })
    }),
    http.delete(`${ORIGIN}/v1/admin/permanent/work-items/:id`, ({ params }) => {
      dead.tasks = dead.tasks.filter((x) => x !== String(params.id))
      return HttpResponse.json({
        work_item_id: String(params.id),
        status: 'purged',
        files_deleted: 0,
      })
    }),
  )
}

const fresh = (): Dead => ({ tasks: ['wd', 'wx'], departments: ['dd'], deptRestored: false })
const reset = () => {
  backend.reset()
  seedTimeline(backend.db)
  dead = fresh()
  install()
}

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  reset()
  await boot({ ...ADMIN, path: '/silinen-kayitlar' })
  await until(() => $('[data-record-key]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(reset)
afterEach(() => teardown())
afterAll(() => backend.server.close())

const keys = () => $$('[data-record-key]').map((e) => e.dataset.recordKey)
const ganttReads = () =>
  backend.requests.filter((r) => r.method === 'GET' && r.path.startsWith('/v1/work-items/gantt'))
    .length
const overdueBadge = () => $('.side-badge:not(.side-badge--dates)')?.textContent?.trim() ?? null

async function accept(): Promise<void> {
  await click(() => $('[data-testid="confirm-accept"]'))
  await until(() => !$('[data-testid="confirm-dialog"]'), 'onay kapandı')
}
async function userClick(selector: string): Promise<void> {
  const el = await until(() => $(selector), selector)
  el.focus()
  await click(() => el)
}

describe('sekmeler ve statik öğeler', () => {
  it('dört canlı tür seçilebilir; statik türler/CSV/çöp boşalt devre dışı ve ağ isteği atmaz; saklama metni; "Kalan süre" yok', async () => {
    const app = await boot({ ...ADMIN, path: '/silinen-kayitlar' })
    await until(() => $('[data-record-key="gorev:wd"]'), 'görevler')
    const live = $$('[data-testid="dr-kinds"] [data-kind]:not([disabled])').map(
      (b) => b.dataset.kind,
    )
    expect(live).toEqual(
      expect.arrayContaining(['gorev', 'toplanti', 'koordinatorluk', 'kullanici']),
    )
    for (const kind of ['altgorev', 'dosya', 'notgundem']) {
      expect($(`[data-testid="dr-kinds"] [data-kind="${kind}"]`)!.hasAttribute('disabled')).toBe(
        true,
      )
    }
    expect($('[data-testid="dr-retention"]')!.textContent).toContain(
      'bir yönetici kalıcı olarak silene kadar saklanır',
    )
    expect(document.body.textContent).not.toMatch(/Kalan süre|Yakında kalıcı silinecek/)
    await idle(app.queryClient)
    const before = backend.requests.length
    for (const id of ['dr-csv', 'dr-empty-trash']) {
      const el = $(`[data-testid="${id}"]`)
      el?.click()
      el?.querySelector('button')?.click()
    }
    for (const kind of ['altgorev', 'dosya', 'notgundem']) {
      $(`[data-testid="dr-kinds"] [data-kind="${kind}"]`)!.click()
    }
    await idle(app.queryClient)
    expect(backend.requests.length).toBe(before)
    for (const kind of ['toplanti', 'koordinatorluk', 'kullanici', 'gorev']) {
      await click(() => $(`[data-testid="dr-kinds"] [data-kind="${kind}"]`))
      await until(
        () => $(`[data-testid="dr-kinds"] [data-kind="${kind}"][aria-pressed="true"]`),
        kind,
      )
    }
  })
})

describe('geri yükle → türevler önce/sonra (KESİN 29)', () => {
  it('görev listesi, zaman çizelgesi ve menü rozeti geri yüklenen geciken görevi yansıtır', async () => {
    const app = await boot({ ...ADMIN, path: '/gorevler' })
    await until(() => $('[data-work-item="w1"]'), 'görev listesi')
    await idle(app.queryClient)
    const badgeBefore = overdueBadge()
    expect($('[data-work-item="wd"]')).toBeNull()
    await app.router.push('/zaman-cizelgesi')
    await idle(app.queryClient)
    const gantt = ganttReads()

    await app.router.push('/silinen-kayitlar')
    await until(() => $('[data-record-key="gorev:wd"]'), 'silinen görev')
    await click(() => $('[data-record-key="gorev:wd"] [data-action="restore"]'))
    await accept()
    await idle(app.queryClient)
    await until(() => !$('[data-record-key="gorev:wd"]'), 'satır düştü')

    await until(() => overdueBadge() !== badgeBefore, 'menü rozeti değişti')
    expect(Number(overdueBadge() ?? 0)).toBe(Number(badgeBefore ?? 0) + 1)
    await app.router.push('/gorevler')
    await until(() => $('[data-work-item="wd"]'), 'geri gelen görev listede')
    await app.router.push('/zaman-cizelgesi')
    await idle(app.queryClient)
    expect(ganttReads()).toBeGreaterThan(gantt)
  })
})

describe('work.department_unavailable', () => {
  it('bildirim → Koordinatörlük sekmesi → birim geri yüklenir → görev geri yüklenir', async () => {
    const app = await boot({ ...ADMIN, path: '/silinen-kayitlar' })
    await until(() => $('[data-record-key="gorev:wx"]'), 'kapalı birim görevi')
    await click(() => $('[data-record-key="gorev:wx"] [data-action="restore"]'))
    await accept()
    await until(() => $('[data-testid="dr-notice"]'), 'satır içi bildirim')
    expect(keys()).toContain('gorev:wx')
    await click(() => $('[data-testid="dr-open-departments"]'))
    await until(() => $('[data-record-key="koordinatorluk:dd"]'), 'birim satırı')
    expect(app.router.currentRoute.value.query.tur).toBe('koordinatorluk')
    await click(() => $('[data-record-key="koordinatorluk:dd"] [data-action="restore"]'))
    await accept()
    await until(() => !$('[data-record-key="koordinatorluk:dd"]'), 'birim geri yüklendi')
    await click(() => $('[data-testid="dr-kinds"] [data-kind="gorev"]'))
    await until(() => $('[data-record-key="gorev:wx"]'), 'görev tekrar')
    await click(() => $('[data-record-key="gorev:wx"] [data-action="restore"]'))
    await accept()
    await until(() => !$('[data-record-key="gorev:wx"]'), 'görev geri yüklendi')
  })
})

describe('kalıcı silme: onay ve odak (KESİN 27)', () => {
  it('vazgeç: istek yok, odak eylem düğmesine döner; onay: satır düşer, odak gövdeye düşmez', async () => {
    const app = await boot({ ...ADMIN, path: '/silinen-kayitlar' })
    await until(() => $('[data-record-key="gorev:wd"]'), 'satır')
    const trigger = '[data-record-key="gorev:wd"] [data-action="purge"]'
    await userClick(trigger)
    await until(() => $('[data-testid="confirm-dialog"]'), 'onay')
    expect($('[data-testid="confirm-dialog"]')!.textContent).toMatch(/geri alınamaz/i)
    $('[data-testid="confirm-dialog"]')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await until(() => !$('[data-testid="confirm-dialog"]'), 'onay kapandı')
    await until(() => document.activeElement === $(trigger), 'odak tetikleyicide')
    await idle(app.queryClient)
    expect(backend.sent('DELETE', '/v1/admin/permanent/work-items/wd')).toHaveLength(0)

    await userClick(trigger)
    await accept()
    await until(() => !$('[data-record-key="gorev:wd"]'), 'satır düştü')
    await idle(app.queryClient)
    expect(document.activeElement).not.toBe(document.body)
    expect(backend.sent('DELETE', '/v1/admin/permanent/work-items/wd')).toHaveLength(1)
  })
})
