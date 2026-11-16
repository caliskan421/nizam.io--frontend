import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { ScopeSelection } from '@/shared/scope/resolve'

import {
  ADMIN,
  COORD,
  errorEnvelope,
  folder,
  folderBody,
  http,
  json,
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

const PROGRAM_FOLDERS = http.get(`${ORIGIN}/v1/program/archive/folders`, () =>
  json(
    folderBody(
      folder({ folder_id: 'd1', name: 'Altyapı ve tesisat', file_count: 12, total_bytes: 2048 }),
      folder({ folder_id: 'd2', name: 'Zemin', file_count: 4, total_bytes: 1024 }),
    ),
  ),
)

async function mountButton(who: Who, scope: ScopeSelection = ADMIN) {
  server.use(...standingHandlers(who), PROGRAM_FOLDERS)
  return mountZip(PeriodZipButton, {}, scope)
}
const body = () => document.body
const q = (id: string) => body().querySelector<HTMLElement>(`[data-testid="${id}"]`)
async function openDialog(wrapper: Awaited<ReturnType<typeof mountButton>>['wrapper']) {
  await wrapper.get('[data-testid="period-zip-button"]').trigger('click')
  await vi.waitFor(() => expect(q('period-zip-dialog')).not.toBeNull())
  await vi.waitFor(() => expect((q('zip-confirm') as HTMLButtonElement).disabled).toBe(false))
}

describe('PeriodZipButton — görünürlük (yalnız ŞY, RECORDS-K24)', () => {
  it('ŞY görür; koordinatör ve üye hesabı göremez (mercek yetki değil)', async () => {
    const admin = await mountButton({ admin: true })
    expect(admin.wrapper.get('button').text()).toBe('Dönem arşivi (ZIP)')
    // Departman seçimi gerekmez: düğme devre dışı değil, BE-120 stub çerçevesi yok.
    expect(admin.wrapper.get('button').attributes('disabled')).toBeUndefined()
    expect(admin.wrapper.find('[data-design-stub]').exists()).toBe(false)
    unmountAll()
    const coord = await mountButton({ rows: [['p1', 'd1', 'koordinator']] }, COORD)
    expect(coord.wrapper.find('[data-testid="period-zip"]').exists()).toBe(false)
    unmountAll()
    const member = await mountButton({ rows: [['p1', 'd1', 'uye']] }, COORD)
    expect(member.wrapper.find('[data-testid="period-zip"]').exists()).toBe(false)
  })
})

describe('PeriodZipButton — onay penceresi → bilet → tüketim (S2, BE-120/BE-124)', () => {
  it('tıklama yalnız pencereyi açar (istek yok); onay: raporlu S2 hedefi, yalnız program başlığı, kayıt', async () => {
    const saved = spySaves()
    server.use(ticketOk(), zipBody({ 'Content-Disposition': 'attachment; filename="donem.zip"' }))
    const { wrapper } = await mountButton({ admin: true })
    await openDialog(wrapper)
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(0)
    ;(q('zip-confirm') as HTMLButtonElement).click()
    await vi.waitFor(() => expect(saved).toEqual(['donem.zip']))
    const [issue] = sent('POST', '/v1/download-tickets')
    expect(issue!.body).toEqual({
      method: 'GET',
      path: '/v1/program/archive/download-zip?include_reports=true',
    })
    expect(issue!.headers.get('X-Nizamio-Program')).toBe('p1')
    // Bilet program başlığıyla alınır: departman başlığı bilet kapsamını bozardı (RECORDS-K39).
    expect(issue!.headers.get('X-Nizamio-Department')).toBeNull()
    expect(q('period-zip-dialog')).toBeNull()
    expect(wrapper.get('[data-testid="period-zip-note"]').text()).toMatch(/ZIP indirildi/)
    // Eski yol yok: archiveFullZip (S3) hedefi hiç istenmedi.
    expect(JSON.stringify(sent('POST', '/v1/download-tickets').map((r) => r.body))).not.toContain(
      '/v1/records/archive/period',
    )
  })

  it('Vazgeç: istek yok, pencere kapanır', async () => {
    server.use(ticketOk(), zipBody())
    const { wrapper } = await mountButton({ admin: true })
    await openDialog(wrapper)
    ;(q('zip-cancel') as HTMLButtonElement).click()
    await vi.waitFor(() => expect(q('period-zip-dialog')).toBeNull())
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(0)
  })

  it('sürerken ikinci bilet yok', async () => {
    const saved = spySaves()
    server.use(ticketOk(), zipBody())
    const { wrapper } = await mountButton({ admin: true })
    await openDialog(wrapper)
    ;(q('zip-confirm') as HTMLButtonElement).click()
    await wrapper.get('[data-testid="period-zip-button"]').trigger('click')
    await vi.waitFor(() => expect(saved).toHaveLength(1))
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(1)
  })

  it('X-Result-Truncated: true → "kesildi" notu (BE-124); başlık yoksa normal başarı metni', async () => {
    spySaves()
    server.use(ticketOk(), zipBody({ 'X-Result-Truncated': 'true' }))
    const first = await mountButton({ admin: true })
    await openDialog(first.wrapper)
    ;(q('zip-confirm') as HTMLButtonElement).click()
    await vi.waitFor(() =>
      expect(first.wrapper.get('[data-testid="period-zip-note"]').text()).toMatch(/kesildi/),
    )
  })

  it('403 records.not_authorized ve 422 records.too_many_files (kota): metin', async () => {
    spySaves()
    let code: [string, number] = ['records.not_authorized', 403]
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () => errorEnvelope(code[0], code[1])),
    )
    const { wrapper } = await mountButton({ admin: true })
    await openDialog(wrapper)
    ;(q('zip-confirm') as HTMLButtonElement).click()
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(wrapper.get('[role="alert"]').text()).toBe('Bu işlem için yetkiniz yok.')
    code = ['records.too_many_files', 422]
    await openDialog(wrapper)
    ;(q('zip-confirm') as HTMLButtonElement).click()
    await vi.waitFor(() =>
      expect(wrapper.get('[role="alert"]').text()).toMatch(/Dönem arşivi tek ZIP için çok büyük/),
    )
  })
})
