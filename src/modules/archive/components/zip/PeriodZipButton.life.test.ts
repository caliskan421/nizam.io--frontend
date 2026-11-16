// CX-F8-E-01: dönem ZIP'i eyleme bağlı iptal yaşamı. Gerçek bileşen + sahte sunucu; bilet ve tüketim
// yanıtı bariyerle tutulur (gerçek süre beklemesi yok). Program/oturum değişimi ve söküm: tüketim
// isteği ya da dosya kaydı yok, bildirim yok (KESİN 26).
import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'

import {
  ADMIN,
  folder,
  folderBody,
  http,
  HttpResponse,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../../model/__tests__/harness'
import PeriodZipButton from './PeriodZipButton.vue'
import { mountZip, spySaves, standingHandlers, unmountAll } from './__tests__/zip-harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

/** Yanıtı `release()` çağrılana kadar tutan kapı; `arrived` istek sunucuya ulaşınca çözülür. */
function barrier() {
  let release!: () => void
  let arrive!: () => void
  const wait = new Promise<void>((resolve) => (release = resolve))
  const arrived = new Promise<void>((resolve) => (arrive = resolve))
  return { release, wait, arrived, arrive }
}

/** Bekleyen ağ/promise işlerinin yerleşmesi (gerçek süre beklemesi yok). */
async function drain(): Promise<void> {
  for (let i = 0; i < 20; i += 1) await flushPromises()
}

function setup(hold: 'ticket' | 'redeem') {
  const gate = barrier()
  server.use(
    ...standingHandlers({ admin: true }),
    http.get(`${ORIGIN}/v1/program/archive/folders`, () =>
      json(folderBody(folder({ folder_id: 'd1', name: 'Zemin', file_count: 1, total_bytes: 8 }))),
    ),
    http.post(`${ORIGIN}/v1/download-tickets`, async () => {
      if (hold === 'ticket') {
        gate.arrive()
        await gate.wait
      }
      return json(
        { ticket: 'tk_1', url: '/v1/downloads/tk_1', expires_at: '2026-11-12T12:01:00Z' },
        201,
      )
    }),
    http.get(`${ORIGIN}/v1/downloads/tk_1`, async () => {
      if (hold === 'redeem') {
        gate.arrive()
        await gate.wait
      }
      return HttpResponse.arrayBuffer(new Uint8Array([80, 75]).buffer, {
        headers: { 'Content-Type': 'application/zip' },
      })
    }),
  )
  return gate
}

async function startZip() {
  const mounted = await mountZip(PeriodZipButton, {}, ADMIN)
  await mounted.wrapper.get('[data-testid="period-zip-button"]').trigger('click')
  await vi.waitFor(() =>
    expect(
      (document.body.querySelector('[data-testid="zip-confirm"]') as HTMLButtonElement).disabled,
    ).toBe(false),
  )
  ;(document.body.querySelector('[data-testid="zip-confirm"]') as HTMLButtonElement).click()
  return mounted
}

type Change = (wrapper: Awaited<ReturnType<typeof startZip>>['wrapper']) => void
const changes: ReadonlyArray<readonly [string, Change]> = [
  ['program değişimi', () => useScopeStore().commit({ ...ADMIN, programId: 'p2' })],
  ['oturum değişimi', () => authSession.clear()],
  ['bileşenin sökülmesi', (wrapper) => wrapper.unmount()],
]

describe('PeriodZipButton — eyleme bağlı iptal yaşamı (CX-F8-E-01)', () => {
  it.each(changes)(
    '(a) bilet yanıtı tutulurken %s: bırakınca tüketim isteği 0, kayıt 0',
    async (_n, change) => {
      const saved = spySaves()
      const gate = setup('ticket')
      const { wrapper } = await startZip()
      await gate.arrived
      change(wrapper)
      gate.release()
      await vi.waitFor(() => expect(sent('POST', '/v1/download-tickets')).toHaveLength(1))
      await drain()
      expect(sent('GET', '/v1/downloads/tk_1')).toHaveLength(0)
      expect(saved).toEqual([])
      expect(document.body.querySelector('[role="alert"]')).toBeNull()
    },
  )

  it.each(changes)(
    '(b) tüketim gövdesi tutulurken %s: bırakınca kayıt 0, not yok',
    async (_n, change) => {
      const saved = spySaves()
      const gate = setup('redeem')
      const { wrapper } = await startZip()
      await gate.arrived
      change(wrapper)
      gate.release()
      await drain()
      expect(saved).toEqual([])
      if (wrapper.exists()) {
        expect(wrapper.find('[data-testid="period-zip-note"]').exists()).toBe(false)
      }
    },
  )

  it('(c) değişiklik yoksa normal yol kaydeder', async () => {
    const saved = spySaves()
    const gate = setup('redeem')
    const { wrapper } = await startZip()
    await gate.arrived
    gate.release()
    await vi.waitFor(() => expect(saved).toEqual(['donem-arsivi.zip']))
    expect(wrapper.get('[data-testid="period-zip-note"]').text()).toMatch(/ZIP indirildi/)
  })
})
