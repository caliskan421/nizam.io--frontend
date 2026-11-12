import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { ScopeSelection } from '@/shared/scope/resolve'

import {
  ADMIN,
  COORD,
  errorEnvelope,
  http,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../../model/__tests__/harness'
import PeriodZipButton from './PeriodZipButton.vue'
import {
  mountZip,
  spySaves,
  standingHandlers,
  TARGET,
  ticketOk,
  unmountAll,
  zipBody,
  type Who,
} from './__tests__/zip-harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

async function mountButton(who: Who, target: typeof TARGET | null, scope: ScopeSelection = ADMIN) {
  server.use(...standingHandlers(who))
  return mountZip(PeriodZipButton, { target }, scope)
}

describe('PeriodZipButton — görünürlük (yalnız ŞY, RECORDS-K24)', () => {
  it('ŞY görür; koordinatör ve üye hesabı göremez (mercek yetki değil)', async () => {
    const admin = await mountButton({ admin: true }, TARGET)
    expect(admin.wrapper.get('button').text()).toBe('Tümünü indir')
    unmountAll()
    const coord = await mountButton({ rows: [['p1', 'd1', 'koordinator']] }, TARGET, COORD)
    expect(coord.wrapper.find('[data-testid="period-zip"]').exists()).toBe(false)
    unmountAll()
    const member = await mountButton({ rows: [['p1', 'd1', 'uye']] }, TARGET, COORD)
    expect(member.wrapper.find('[data-testid="period-zip"]').exists()).toBe(false)
  })
})

describe('PeriodZipButton — hedef yok (BE-120)', () => {
  it('target null: devre dışı + açıklama, ağ isteği yok', async () => {
    const { wrapper } = await mountButton({ admin: true }, null)
    const el = wrapper.get('button')
    expect(el.attributes('disabled')).toBeDefined()
    // Statik öğe BE-120 ile işaretlenir (ortak-kurallar §3); hedef varken işaret yok.
    expect(wrapper.find('[data-design-stub="BE-120"] button').exists()).toBe(true)
    const note = wrapper.get('[data-testid="period-zip-note"]')
    expect(note.text()).toMatch(/henüz indirilemiyor/)
    expect(el.attributes('aria-describedby')).toBe(note.attributes('id'))
    await el.trigger('click')
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(0)
  })
})

describe('PeriodZipButton — hedef var', () => {
  it('BE-120 işareti yok (düğme gerçek eylemdir)', async () => {
    const { wrapper } = await mountButton({ admin: true }, TARGET)
    expect(wrapper.find('[data-design-stub]').exists()).toBe(false)
  })
})

describe('PeriodZipButton — bilet → tüketim', () => {
  it('tıklama: dönem yolu, hedef başlıkları, kayıt; sürerken ikinci bilet yok', async () => {
    const saved = spySaves()
    server.use(ticketOk(), zipBody())
    const { wrapper } = await mountButton({ admin: true }, TARGET)
    const el = wrapper.get('button').element as HTMLButtonElement
    el.focus()
    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(saved).toEqual(['arsiv.zip']))
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(1)
    const [issue] = sent('POST', '/v1/download-tickets')
    expect(issue!.body).toEqual({ method: 'GET', path: '/v1/records/archive/period/download-zip' })
    expect(issue!.headers.get('X-Nizamio-Department')).toBe('d7')
    expect(document.activeElement).toBe(el)
  })

  it('403 records.not_authorized ve 429 records.busy: metin, otomatik tekrar yok', async () => {
    spySaves()
    let redeems = 0
    let busy = false
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () => {
        redeems += 1
        return busy
          ? errorEnvelope('records.busy', 429, { 'Retry-After': '120' })
          : errorEnvelope('records.not_authorized', 403)
      }),
    )
    const { wrapper } = await mountButton({ admin: true }, TARGET)
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(wrapper.get('[role="alert"]').text()).toBe('Bu işlem için yetkiniz yok.')
    busy = true
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() =>
      expect(wrapper.get('[role="alert"]').text()).toBe(
        'Çok fazla istek gönderildi; 2 dakika sonra yeniden deneyin.',
      ),
    )
    expect(redeems).toBe(2)
  })

  it('422 records.too_many_files → dönem arşivi çok büyük', async () => {
    spySaves()
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () => errorEnvelope('records.too_many_files', 422)),
    )
    const { wrapper } = await mountButton({ admin: true }, TARGET)
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(wrapper.get('[role="alert"]').text()).toMatch(/Dönem arşivi tek ZIP için çok büyük/)
  })
})
