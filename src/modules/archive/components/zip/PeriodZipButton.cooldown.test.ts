// CX-F8-Ö-01: dönem ZIP'i tüketim hatasında `Retry-After` → "Bekleyin (N s)" sayacı. Gerçek bileşen +
// sahte sunucu; sayaç sahte saatle (yalnız setInterval) ilerletilir. Otomatik tekrar YOK: süre
// bitince düğme açılır, ikinci bilet yalnız kullanıcının yeni eylemiyle alınır.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  errorEnvelope,
  folder,
  folderBody,
  http,
  json,
  ORIGIN,
  resetHarness,
  ADMIN,
  sent,
  server,
} from '../../model/__tests__/harness'
import PeriodZipButton from './PeriodZipButton.vue'
import { mountZip, spySaves, standingHandlers, ticketOk, unmountAll } from './__tests__/zip-harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] }))
afterEach(() => {
  vi.useRealTimers()
  unmountAll()
  resetHarness()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

const FAILURES: ReadonlyArray<readonly [string, number, string | null, RegExp | string]> = [
  ['reporting.export_in_progress', 429, '12', 'Bekleyin (12 s)'],
  ['reporting.capacity_full', 503, '5', 'Bekleyin (5 s)'],
  ['platform.rate_limited', 429, '90', 'Bekleyin (90 s)'],
]

async function startOnce(code: string, status: number, retryAfter: string | null) {
  const saved = spySaves()
  server.use(
    ...standingHandlers({ admin: true }),
    http.get(`${ORIGIN}/v1/program/archive/folders`, () =>
      json(folderBody(folder({ folder_id: 'd1', name: 'Zemin', file_count: 1, total_bytes: 8 }))),
    ),
    ticketOk(),
    http.get(`${ORIGIN}/v1/downloads/tk_1`, () =>
      errorEnvelope(code, status, retryAfter === null ? {} : { 'Retry-After': retryAfter }),
    ),
  )
  const { wrapper } = await mountZip(PeriodZipButton, {}, ADMIN)
  const button = () => wrapper.get('[data-testid="period-zip-button"]')
  await button().trigger('click')
  await vi.waitFor(() =>
    expect(
      (document.body.querySelector('[data-testid="zip-confirm"]') as HTMLButtonElement).disabled,
    ).toBe(false),
  )
  ;(document.body.querySelector('[data-testid="zip-confirm"]') as HTMLButtonElement).click()
  await vi.waitFor(() =>
    expect(wrapper.find('[data-testid="period-zip-note"]').exists()).toBe(true),
  )
  return { wrapper, button, saved }
}

describe('PeriodZipButton — Retry-After sayacı (CX-F8-Ö-01)', () => {
  it.each(FAILURES)(
    '%s %i Retry-After %s: süre görünür, dosya yok, ikinci bilet yok, düğme süre bitince açılır',
    async (code, status, retryAfter, text) => {
      const { wrapper, button, saved } = await startOnce(code, status, retryAfter)
      const note = () => wrapper.find('[data-testid="period-zip-note"]')
      expect(note().text()).toBe(text)
      expect(button().attributes('aria-disabled')).toBe('true')
      expect(saved).toEqual([])
      // Süre dolmadan tıklama pencereyi açmaz; otomatik tekrar yok.
      await button().trigger('click')
      expect(document.body.querySelector('[data-testid="period-zip-dialog"]')).toBeNull()
      vi.advanceTimersByTime(2000)
      await vi.waitFor(() => expect(note().text()).toBe(`Bekleyin (${Number(retryAfter) - 2} s)`))
      expect(sent('POST', '/v1/download-tickets')).toHaveLength(1)
      vi.advanceTimersByTime((Number(retryAfter) - 2) * 1000)
      await vi.waitFor(() => expect(note().exists()).toBe(false))
      expect(button().attributes('aria-disabled')).toBeUndefined()
      expect(sent('POST', '/v1/download-tickets')).toHaveLength(1)
      expect(sent('GET', '/v1/downloads/tk_1')).toHaveLength(1)
    },
  )

  it('Retry-After başlığı yok: sayaç yok, süresiz ortak metin; düğme açık', async () => {
    const { wrapper, button } = await startOnce('reporting.capacity_full', 503, null)
    expect(wrapper.get('[data-testid="period-zip-note"]').text()).toBe(
      'Rapor kapasitesi dolu; biraz sonra yeniden deneyin.',
    )
    expect(button().attributes('aria-disabled')).toBeUndefined()
  })
})
