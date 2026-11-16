// W176 O3 senaryo 2/4/6 (05 Kullanıcılar, `exportUsersCsv`; BE-014): gerçek kabuk + durumlu sahte
// sunucu. CSV bileti ekranın süzgeçleriyle bire bir (rol sekmesi, program, sıra); hata kodları
// (`organization.export_too_large` 422, `organization.export_in_progress` 429 + Retry-After,
// `organization.capacity_full` 503) i18n metniyle; otomatik tekrar yok; bilet beklerken program
// değişimi bileti tüketmez, dosya ve bildirim yok.
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { envelope, ORIGIN } from './fake-org'
import {
  $,
  $$,
  boot,
  click,
  createBackend,
  idle,
  seedWorld,
  switchScope,
  teardown,
  toasts,
  until,
} from './harness'
import { ADMIN_ADMIN } from './timeline-support'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })

type Redeem = 'ok' | 'too-large' | 'in-progress' | 'capacity'
const mode: { redeem: Redeem; seq: number } = { redeem: 'ok', seq: 0 }
const saved: string[] = []
let gate: { arrived: () => void; wait: Promise<void> } | null = null
function holdTicket() {
  let release!: () => void
  let arrived!: () => void
  const wait = new Promise<void>((resolve) => (release = resolve))
  const reached = new Promise<void>((resolve) => (arrived = resolve))
  gate = { arrived, wait }
  return { release, arrived: reached }
}

function install(): void {
  backend.server.use(
    http.post(`${ORIGIN}/v1/download-tickets`, async () => {
      if (gate) {
        const held = gate
        gate = null
        held.arrived()
        await held.wait
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
      switch (mode.redeem) {
        case 'too-large':
          return envelope('organization.export_too_large', 422)
        case 'in-progress':
          return HttpResponse.json(
            { code: 'organization.export_in_progress', message: 'x', request_id: 'r', fields: [] },
            { status: 429, headers: { 'Retry-After': '9' } },
          )
        case 'capacity':
          return HttpResponse.json(
            { code: 'organization.capacity_full', message: 'x', request_id: 'r', fields: [] },
            { status: 503, headers: { 'Retry-After': '30' } },
          )
        default:
          return new HttpResponse('﻿Ad;E-posta\r\n', {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename="kullanicilar.csv"',
            },
          })
      }
    }),
  )
}

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedWorld(backend.db)
  install()
  await boot({ ...ADMIN_ADMIN, path: '/kullanicilar' })
  await until(() => $('[data-testid="users-export"]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
  mode.redeem = 'ok'
  mode.seq = 0
  gate = null
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

const exportBtn = () => $('[data-testid="users-export"]')
const tab = (label: string) =>
  $$('.users-tabs .rp-seg button').find((b) => b.textContent?.trim().startsWith(label)) ?? null
const issued = () =>
  backend.sent('POST', '/v1/download-tickets').map((r) => (r.body as { path: string }).path)

describe('bilet hedefi ekran süzgeciyle bire bir', () => {
  it('Tümü: süzgeçsiz hedef (yalnız sıra); Üye sekmesi + program: role ve program_id aynen; X-Nizamio-Department yok', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: '/kullanicilar' })
    await until(() => $$('[role="row"][data-account]').length === 5, 'liste')
    await click(exportBtn)
    await until(() => saved.length === 1, 'kaydedildi')
    expect(issued()[0]).toBe('/v1/admin/users/export?sort_by=name&sort_order=asc')

    await click(() => tab('Üye'))
    await until(() => $$('[role="row"][data-account]').length === 2, 'üye listesi')
    await idle(app.queryClient)
    await click(exportBtn)
    await until(() => saved.length === 2, 'ikinci kayıt')
    const path = issued()[1]!
    const query = new URL(path, 'http://x').searchParams
    expect(query.get('role')).toBe('uye')
    expect(query.get('program_id')).toBe('p1')
    expect(query.get('sort_by')).toBe('name')
    // Liste isteğiyle aynı süzgeç (ekranın yüklenmiş sayfası değil, aynı sorgu).
    const list = backend
      .sent('GET', '/v1/admin/users')
      .filter((r) => r.query.get('limit') !== '1' && r.query.get('role') === 'uye')
      .at(-1)!
    expect(list.query.get('program_id')).toBe(query.get('program_id'))
    // S1 hedefi: kapsam başlığı bilete yazılmaz.
    const ticketRequest = backend.sent('POST', '/v1/download-tickets')[1]!
    expect(ticketRequest.headers.get('X-Nizamio-Department')).toBeNull()
  })
})

describe('hata kodları → i18n (otomatik tekrar yok)', () => {
  it.each([
    ['too-large', /satır|daralt|çok büyük|sınır/i],
    ['in-progress', /^Bekleyin \(9 s\)$/],
    ['capacity', /^Bekleyin \(30 s\)$/],
  ] as const)('%s: satır içi hata metni; dosya yok; ikinci bilet yok', async (kind, text) => {
    const app = await boot({ ...ADMIN_ADMIN, path: '/kullanicilar' })
    await until(() => $$('[role="row"][data-account]').length === 5, 'liste')
    mode.redeem = kind
    await click(exportBtn)
    await until(() => $('[data-testid="users-export-error"]'), 'hata metni')
    expect($('[data-testid="users-export-error"]')!.textContent).toMatch(text)
    // Retry-After taşıyan 429/503: süre dolana kadar düğme kapalı (CX-F8-Ö-01); 422'de açık.
    expect((exportBtn() as HTMLButtonElement).disabled).toBe(kind !== 'too-large')
    await idle(app.queryClient)
    expect(saved).toEqual([])
    expect(backend.sent('POST', '/v1/download-tickets')).toHaveLength(1)
    expect(backend.sent('GET', '/v1/downloads/tk-1')).toHaveLength(1)
    // Sunucu iletisi gösterilmez (KESİN 7).
    expect($('[data-testid="users-export-error"]')!.textContent).not.toBe('x')
  })
})

describe('geç sonuç (KESİN 26)', () => {
  it('bilet beklerken program değişir: bilet tüketilmez, dosya ve bildirim yok; düğme yeniden açılır', async () => {
    const app = await boot({ ...ADMIN_ADMIN, path: '/kullanicilar' })
    await until(() => $$('[role="row"][data-account]').length === 5, 'liste')
    const held = holdTicket()
    await click(exportBtn)
    await held.arrived
    expect((exportBtn() as HTMLButtonElement).disabled).toBe(true)
    await switchScope('Program', 'Teknofest 2027')
    await until(() => app.scope.programId === 'p2', 'kapsam p2')
    held.release()
    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/downloads/tk-1')).toHaveLength(0)
    expect(saved).toEqual([])
    expect(toasts()).not.toContain('indirildi')
    await until(() => !(exportBtn() as HTMLButtonElement).disabled, 'düğme açıldı')
  })
})
