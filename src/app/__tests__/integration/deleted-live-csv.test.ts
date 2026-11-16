// W176 O3 senaryo 4 + 6 (12 Silinen kayıtlar, CSV): `reporting.export_too_large` kartı, 429 bekleme,
// kullanıcı eylemiyle yeni bilet (otomatik tekrar yok), bilet beklerken kapsam değişimi ve ekran
// sökülmesi (KESİN 26): bilet tüketilmez, dosya kaydedilmez, bildirim yok. Mutlu yol W174'ün
// `deleted-records.test.ts` dosyasındadır; burada yalnız hata ve geç sonuç.
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { withDeletedTaskDefaults } from '@/shared/api/__tests__/defaults'

import { envelope, ORIGIN } from './fake-org'
import {
  $,
  boot,
  click,
  createBackend,
  idle,
  PEOPLE,
  seedWorld,
  switchScope,
  teardown,
  toasts,
  until,
} from './harness'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const ADMIN = { email: PEOPLE.admin.email, scope: { programId: 'p1', lens: 'admin' as const } }

type Redeem = 'ok' | 'too-large' | 'cut'
type Issue = 'ok' | 'rate-limited'
const mode: { redeem: Redeem; issue: Issue; seq: number } = { redeem: 'ok', issue: 'ok', seq: 0 }
const saved: string[] = []

/** Bilet üretim isteğini sunucuda bekleten kapı (geç sonuç; gerçek süre yok). `server.use` genel
 * `hold`un önüne geçtiği için kapı bu dosyadaki işleyicidedir (o3 kalıbı). */
let ticketGate: { arrived: () => void; wait: Promise<void> } | null = null
function holdTicket() {
  let release!: () => void
  let arrived!: () => void
  const wait = new Promise<void>((resolve) => (release = resolve))
  const reached = new Promise<void>((resolve) => (arrived = resolve))
  ticketGate = { arrived, wait }
  return { release, arrived: reached }
}

function install(): void {
  backend.server.use(
    http.get(`${ORIGIN}/v1/admin/deleted/work-items`, () =>
      HttpResponse.json({
        items: [
          withDeletedTaskDefaults({
            work_item_id: 'wd',
            title: 'Silinmiş görev',
            department_id: 'd1',
            status: 'devam_ediyor',
            deleted_at: '2026-11-11T10:00:00Z',
            file_count: 0,
          }),
        ],
        total: 1,
      }),
    ),
    http.get(`${ORIGIN}/v1/admin/deleted/summary`, () =>
      HttpResponse.json({ tasks: 1, meetings: 0, departments: 0, accounts: 0, total: 1 }),
    ),
    http.get(`${ORIGIN}/v1/admin/deleted/meetings`, () =>
      HttpResponse.json({ items: [], next_cursor: '', total: 0 }),
    ),
    http.get(`${ORIGIN}/v1/admin/deleted/departments`, () =>
      HttpResponse.json({ departments: [], total: 0 }),
    ),
    http.get(`${ORIGIN}/v1/admin/deleted/accounts`, () =>
      HttpResponse.json({ accounts: [], total: 0 }),
    ),
    http.post(`${ORIGIN}/v1/download-tickets`, async () => {
      if (ticketGate) {
        const gate = ticketGate
        ticketGate = null
        gate.arrived()
        await gate.wait
      }
      if (mode.issue === 'rate-limited') {
        return HttpResponse.json(
          { code: 'platform.rate_limited', message: 'x', request_id: 'r', fields: [] },
          { status: 429, headers: { 'Retry-After': '17' } },
        )
      }
      mode.seq += 1
      return HttpResponse.json(
        {
          ticket: `tk-${mode.seq}`,
          url: `/v1/downloads/tk-${mode.seq}`,
          expires_at: '2026-11-12T10:01:00Z',
        },
        { status: 201 },
      )
    }),
    http.get(`${ORIGIN}/v1/downloads/:ticket`, () => {
      if (mode.redeem === 'too-large') return envelope('reporting.export_too_large', 422)
      if (mode.redeem === 'cut') return HttpResponse.error()
      return new HttpResponse('﻿Tür;Kimlik\r\n', {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="silinen.csv"',
        },
      })
    }),
  )
}

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedWorld(backend.db)
  install()
  await boot({ ...ADMIN, path: '/silinen-kayitlar' })
  await until(() => $('[data-record-key="gorev:wd"]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
  mode.redeem = 'ok'
  mode.issue = 'ok'
  mode.seq = 0
  ticketGate = null
  saved.length = 0
  URL.createObjectURL = vi.fn(() => 'blob:test')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    saved.push(this.download)
  })
  install()
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const card = () => $('[data-testid="dr-export-card"]')
const csv = () => click(() => $('[data-testid="dr-csv"]'))
const open = async () => {
  const app = await boot({ ...ADMIN, path: '/silinen-kayitlar' })
  await until(() => $('[data-record-key="gorev:wd"]'), 'silinen görev')
  return app
}

describe('hata kartları (otomatik tekrar yok)', () => {
  it('422 reporting.export_too_large: "süzgeci daraltın" kartı; dosya yok; Yeniden dene yeni bilet alır', async () => {
    const app = await open()
    mode.redeem = 'too-large'
    await csv()
    await until(() => card()?.getAttribute('data-state') === 'failed', 'hata kartı')
    expect(card()?.getAttribute('data-code')).toBe('reporting.export_too_large')
    expect(card()?.textContent).toMatch(/daralt/i)
    await idle(app.queryClient)
    expect(saved).toEqual([])
    expect(backend.sent('POST', '/v1/download-tickets')).toHaveLength(1)
    expect(backend.sent('GET', '/v1/downloads/tk-1')).toHaveLength(1)
    expect(toasts()).not.toContain('indirildi')

    // Kullanıcı eylemi: yeni bilet (eskisi yeniden tüketilmez).
    mode.redeem = 'ok'
    await click(() => $('[data-testid="dr-export-retry"]'))
    await until(() => saved.length === 1, 'kaydedildi')
    expect(backend.sent('POST', '/v1/download-tickets')).toHaveLength(2)
    expect(backend.sent('GET', '/v1/downloads/tk-2')).toHaveLength(1)
    expect(backend.sent('GET', '/v1/downloads/tk-1')).toHaveLength(1)
    await until(() => !card(), 'kart kapandı')
  })

  it('akış ortasında kopma: "tamamlanamadı" kartı, dosya kaydedilmez', async () => {
    await open()
    mode.redeem = 'cut'
    await csv()
    await until(() => card()?.getAttribute('data-state') === 'failed', 'hata kartı')
    expect(saved).toEqual([])
  })

  it('429 (bilet üretimi, Retry-After 17): bekleme metni; tüketim ve otomatik tekrar yok', async () => {
    const app = await open()
    mode.issue = 'rate-limited'
    await csv()
    await until(() => card()?.getAttribute('data-state') === 'failed', 'hata kartı')
    expect(card()?.textContent).toContain('17')
    await idle(app.queryClient)
    expect(backend.sent('POST', '/v1/download-tickets')).toHaveLength(1)
    expect(backend.sent('GET', '/v1/downloads/tk-1')).toHaveLength(0)
    expect(saved).toEqual([])
  })
})

describe('geç sonuç (KESİN 26)', () => {
  it('bilet beklerken program değişir: bilet tüketilmez, dosya ve bildirim yok, kart takılı kalmaz', async () => {
    const app = await open()
    const gate = holdTicket()
    await csv()
    await gate.arrived
    await switchScope('Program', 'Teknofest 2027')
    await until(() => app.scope.programId === 'p2', 'kapsam p2')
    gate.release()
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/downloads/tk-1')).toHaveLength(0)
    expect(saved).toEqual([])
    expect(toasts()).not.toContain('indirildi')
    expect(card()).toBeNull()
  })

  it('bilet beklerken ekrandan ayrılma: bilet tüketilmez, dosya ve bildirim yok', async () => {
    const app = await open()
    const gate = holdTicket()
    await csv()
    await gate.arrived
    await app.router.push('/')
    await until(() => !$('[data-testid="dr-csv"]'), 'ekran söküldü')
    gate.release()
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/downloads/tk-1')).toHaveLength(0)
    expect(saved).toEqual([])
    expect(toasts()).not.toContain('indirildi')
  })

  it('"İptal": hazırlanırken iptal bileti tüketmez; kart kapanır', async () => {
    const app = await open()
    const gate = holdTicket()
    await csv()
    await gate.arrived
    await click(() => $('[data-testid="dr-export-cancel"]'))
    gate.release()
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/downloads/tk-1')).toHaveLength(0)
    expect(saved).toEqual([])
    await until(() => !card(), 'kart kapandı')
  })
})
