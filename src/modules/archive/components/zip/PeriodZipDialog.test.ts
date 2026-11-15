import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  ADMIN,
  folder,
  folderBody,
  http,
  json,
  ORIGIN,
  resetHarness,
  server,
} from '../../model/__tests__/harness'
import PeriodZipDialog from './PeriodZipDialog.vue'
import { mountZip, standingHandlers, unmountAll } from './__tests__/zip-harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

const PROGRAMS = http.get(`${ORIGIN}/v1/programs`, () =>
  json({ programs: [{ program_id: 'p1', name: 'Şanlıurfa Teknofest', year: 2026 }] }),
)
const q = (id: string) => document.body.querySelector<HTMLElement>(`[data-testid="${id}"]`)
/** Satır parçaları (ad, açıklama) boşlukla birleşik: ekranda yan yana ayrı sütunlardır. */
const text = (id: string) =>
  [...(q(id)?.children ?? [])]
    .map((el) => el.textContent?.trim() ?? '')
    .filter((part) => part !== '')
    .join(' ') || q(id)?.textContent?.trim()

async function mountDialog(
  cards: Array<ReturnType<typeof folder>>,
  handler = http.get(`${ORIGIN}/v1/program/archive/folders`, () => json(folderBody(...cards))),
) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-21T09:00:00Z'))
  server.use(PROGRAMS, ...standingHandlers({ admin: true }), handler)
  const mounted = await mountZip(PeriodZipDialog, { open: true }, ADMIN)
  await vi.waitFor(() => expect(q('zip-root')).not.toBeNull())
  return mounted
}

describe('PeriodZipDialog (E-13-10, 01h)', () => {
  it('başlık: program · sezon, "‹N› dosya · ‹boyut› · birkaç dakika sürebilir"; kök ad + ağaç satırları', async () => {
    const cards = [
      folder({ folder_id: 'd2', name: 'Zemin', file_count: 4, total_bytes: 1_048_576 }),
      folder({
        folder_id: 'd1',
        name: 'Altyapı ve tesisat',
        file_count: 12,
        total_bytes: 701_234_567,
      }),
      folder({ folder_id: 'd3', name: 'Çevre', file_count: 0 }),
    ]
    await mountDialog(cards)
    expect(text('zip-kicker')).toBe('Şanlıurfa Teknofest · 2026 sezonu')
    expect(document.body.querySelector('.t-modal__title')?.textContent).toBe('Dönem arşivi (ZIP)')
    expect(document.body.querySelector('.t-modal__desc')?.textContent).toBe(
      '16 dosya · 669,7 MB · birkaç dakika sürebilir',
    )
    expect(text('zip-root')).toBe('Sanliurfa-Teknofest-Donem-Arsivi-2026-10-21/')
    expect(text('zip-general')).toBe('00-Genel/ dönem raporu (PDF)')
    expect(text('zip-unit')).toBe('01-Altyapi-ve-tesisat/ birim raporu · 12 dosya')
    expect(text('zip-missing')).toBe('EKSIK-DOSYALAR.txt yalnız eksik dosya varsa')
    expect(text('zip-more')).toBe('… ve 02–03 arası diğer 2 koordinatörlük klasörü.')
    expect(text('zip-wait')).toContain('sayfayı kapatmayın')
    expect(text('zip-audit')).toBe('Raporlu dönem arşivi indirmesi kayda geçer (denetim).')
  })

  it('tek koordinatörlük: "… ve" satırı yok; dosyasız birimde yalnız "birim raporu"', async () => {
    await mountDialog([folder({ folder_id: 'd1', name: 'Ağ', file_count: 0 })])
    expect(text('zip-unit')).toBe('01-Ag/ birim raporu')
    expect(q('zip-more')).toBeNull()
  })

  it('40 üstü koordinatörlükte birim klasörü satırları yerine NOT.txt (sayı sunucudan)', async () => {
    const many = Array.from({ length: 41 }, (_, i) =>
      folder({ folder_id: `d${i}`, name: `Birim ${String(i).padStart(2, '0')}` }),
    )
    await mountDialog(many)
    expect(text('zip-notice')).toBe(
      'NOT.txt birim raporları ayrı PDF olarak eklenmez (40’ten fazla koordinatörlük)',
    )
    expect(q('zip-unit')).toBeNull()
    expect(text('zip-more')).toContain('41 arası diğer 40 koordinatörlük klasörü')
  })

  it('veri okunana dek "Hazırla ve indir" kapalı, sayı/ad uydurulmaz; okuma hatasında hata metni', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    vi.useFakeTimers({ toFake: ['Date'] })
    server.use(
      PROGRAMS,
      ...standingHandlers({ admin: true }),
      http.get(`${ORIGIN}/v1/program/archive/folders`, async () => {
        await gate
        return json(folderBody(folder({ file_count: 3 })))
      }),
    )
    const { queryClient } = await mountZip(PeriodZipDialog, { open: true }, ADMIN, {
      settle: false,
    })
    await vi.waitFor(() => expect(q('zip-confirm')).not.toBeNull())
    expect((q('zip-confirm') as HTMLButtonElement).disabled).toBe(true)
    expect(document.body.textContent).toContain('Arşiv bilgisi okunuyor…')
    expect(q('zip-root')).toBeNull()
    expect(document.body.querySelector('.t-modal__desc')).toBeNull()
    release()
    await vi.waitFor(() => expect(queryClient.isFetching()).toBe(0))
    await vi.waitFor(() => expect(q('zip-root')).not.toBeNull())
    expect((q('zip-confirm') as HTMLButtonElement).disabled).toBe(false)
  })

  it('okuma başarısız: hata metni, indirme düğmesi kapalı', async () => {
    await mountDialogFailing()
    expect(document.body.textContent).toContain('Arşiv bilgisi okunamadı')
    expect((q('zip-confirm') as HTMLButtonElement).disabled).toBe(true)
  })
})

async function mountDialogFailing() {
  server.use(
    PROGRAMS,
    ...standingHandlers({ admin: true }),
    http.get(`${ORIGIN}/v1/program/archive/folders`, () =>
      json({ code: 'platform.internal' }, 500),
    ),
  )
  const mounted = await mountZip(PeriodZipDialog, { open: true }, ADMIN)
  await vi.waitFor(() => expect(document.body.textContent).toContain('Arşiv bilgisi okunamadı'))
  return mounted
}
