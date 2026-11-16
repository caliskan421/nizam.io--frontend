// W171 · F8 canlıya alma (BE-124): raporlu dönem ZIP'i (`include_reports=true`). Onay penceresindeki
// "kayda geçer" notu, ZIP yanıtının `X-Result-Truncated: true` başlığı (gömülü rapor kesildi) ve
// rapor üretim kotası hataları (`reporting.export_in_progress` 429 + Retry-After). Durumlu sahte arşiv
// sunucusu (W127 `archive-fake`); gerçek backend'de başlığın bilet tüketiminde iletilip iletilmediği
// e2e'de doğrulanır (sözleşme tüketimde yalnız gövde/Content-Type/Content-Disposition'ı güvence eder).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  ADMIN,
  archive,
  boot,
  COORD,
  idle,
  resetArchive,
  teardown,
  until,
  useArchiveBackend,
  userClick,
} from './archive-support'

const backend = useArchiveBackend({ coordinator: 'koordinator', member: 'uye' })
const saved: string[] = []

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetArchive()
  await boot({ ...ADMIN, path: '/arsiv' })
  await until(() => $('[data-testid="period-zip-button"]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  resetArchive()
  saved.length = 0
  URL.createObjectURL = vi.fn(() => 'blob:test')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    saved.push(this.download)
  })
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const DIALOG = '[data-testid="period-zip-dialog"]'
const note = () => $('[data-testid="period-zip-note"]')?.textContent ?? ''
const openDialog = async () => {
  await userClick(() => $('[data-testid="period-zip-button"]'))
  await until(() => $(DIALOG), 'onay penceresi')
  await until(() => !($('[data-testid="zip-confirm"]') as HTMLButtonElement).disabled, 'veri')
}

describe('raporlu dönem ZIP (BE-124)', () => {
  it('onay penceresi raporlu düzeni ve denetim notunu söyler; istek include_reports=true taşır', async () => {
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await until(() => $('[data-testid="period-zip-button"]'), 'düğme')
    await openDialog()
    expect($('[data-testid="zip-general"]')?.textContent).toContain('00-Genel/')
    expect($('[data-testid="zip-missing"]')?.textContent).toContain('EKSIK-DOSYALAR.txt')
    expect($('[data-testid="zip-audit"]')?.textContent).toContain('kayda geçer (denetim)')
    await userClick(() => $('[data-testid="zip-confirm"]'))
    await until(() => saved.length === 1, 'kaydedildi')
    await idle(app.queryClient)
    expect(archive.state.redeemed[0]!.path).toBe(
      '/v1/program/archive/download-zip?include_reports=true',
    )
  })

  it('raporlu ZIP kesme başlığı (X-Result-Truncated) → kullanıcıya "kesildi" notu', async () => {
    archive.state.redeem = 'truncated'
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await until(() => $('[data-testid="period-zip-button"]'), 'düğme')
    await openDialog()
    await userClick(() => $('[data-testid="zip-confirm"]'))
    await until(() => saved.length === 1, 'kaydedildi')
    await idle(app.queryClient)
    expect(note()).toMatch(/kesildi/)
  })

  it('429 reporting.export_in_progress (+Retry-After): sınıflı metin, otomatik tekrar yok', async () => {
    archive.state.redeem = 'export-busy'
    const app = await boot({ ...ADMIN, path: '/arsiv' })
    await until(() => $('[data-testid="period-zip-button"]'), 'düğme')
    await openDialog()
    await userClick(() => $('[data-testid="zip-confirm"]'))
    await until(() => note().includes('Bekleyin (12 s)'), 'rapor üretimi sürüyor')
    await idle(app.queryClient)
    expect(backend.sent('POST', '/v1/download-tickets')).toHaveLength(1)
    expect(saved).toHaveLength(0)
  })

  it('koordinatör raporlu ZIP isteğini hiç başlatamaz (düğme yok)', async () => {
    await boot({ ...COORD, path: '/arsiv/d1' })
    await until(() => $('[data-testid="archive-folder-page"]'), 'sayfa')
    expect($('[data-testid="period-zip-button"]')).toBeNull()
    expect(archive.state.redeemed).toHaveLength(0)
  })
})
