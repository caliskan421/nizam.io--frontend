// BE-116 · CSV indir: bilet hedefi (ekran süzgeçleri + yalnız etkin tür, kapsam program), akış
// (Content-Length yok), 422/429/503 iletileri ve akış ortasında kesilme (dosya kaydedilmez).
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/shared/ui'

import {
  file,
  meeting,
  mountPage,
  record,
  subtask,
  resetAll,
  sent,
  server,
  serverDefaults,
  settle,
  task,
  world,
  type Mounted,
} from './harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

const saved = { created: [] as Blob[], clicked: [] as string[] }
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-12T12:00:00Z') })
  server.use(...serverDefaults())
  world.dictionary = [{ department_id: 'd1', display_name: 'Mekanik' }]
  saved.created.length = 0
  saved.clicked.length = 0
  Object.assign(URL, {
    createObjectURL: (blob: Blob) => {
      saved.created.push(blob)
      return `blob:${saved.created.length}`
    },
    revokeObjectURL: () => undefined,
  })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    saved.clicked.push(this.download)
  })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  useToast().clear()
  resetAll()
})
afterAll(() => server.close())

const toasts = () => useToast().queue.value.map((t) => t.message)
const csv = (page: Mounted) => page.wrapper.get('[data-testid="dr-csv"]')
const card = (page: Mounted) => page.wrapper.find('[data-testid="dr-export-card"]')
const ticket = () => [...world.download.tickets.values()][0]!

async function download(page: Mounted) {
  await csv(page).trigger('click')
  await settle()
  await vi.waitFor(() => expect(page.wrapper.find('[data-state="running"]').exists()).toBe(false))
}

describe('CSV indir (E-12-05)', () => {
  it('bilet: S2 başlıklı hedef, yalnız etkin tür, kapsam program; gövde akışla kaydedilir, ad Content-Disposition’dan', async () => {
    world.tasks = [[task('w1')]]
    const page = await mountPage()
    await download(page)
    expect(ticket().path).toBe('/v1/admin/deleted/export?kinds=tasks&scope=program')
    expect(ticket().program).toBe('p1')
    expect(saved.clicked).toEqual(['silinen-kayitlar-2026-11-12.csv'])
    // UTF-8 BOM ile başlar (Excel; sözleşme) ve akış sonuna dek okunmuştur.
    const bytes = new Uint8Array(await saved.created[0]!.arrayBuffer())
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    expect(new TextDecoder().decode(bytes)).toContain('Saha;Mekanik')
    expect(toasts()).toEqual(['silinen-kayitlar-2026-11-12.csv indirildi.'])
    expect(card(page).exists()).toBe(false)
    // Bilet isteği anahtarsız ve CSRF'li; indirme isteği S0 (başlıksız).
    const [issue] = sent('/v1/download-tickets', 'POST')
    expect(issue!.headers.get('Idempotency-Key')).toBeNull()
    expect(issue!.headers.get('X-Requested-With')).toBeTruthy()
  })

  it('ekran süzgeçleri aynen gider (arama, koordinatörlük, silen, aralık); sıra gitmez; tür toplantı', async () => {
    world.meetings = [[meeting('m1', { title: 'Fuar yürüyüşü' })]]
    const page = await mountPage({
      path: '/silinen-kayitlar?tur=toplanti&q=fuar&koordinatorluk=d1&silen=acc-7&aralik=bugun',
    })
    await page.wrapper.get('[data-sort="name"]').trigger('click')
    await settle()
    await download(page)
    // 12 Kasım 2026 15:00 Istanbul: "Bugün" = 11 Kasım 21:00Z (gün başı kurulum saat diliminde).
    expect(ticket().path).toBe(
      '/v1/admin/deleted/export?kinds=meetings&scope=program&q=fuar&deleted_from=2026-11-11T21%3A00%3A00Z&deleted_by=acc-7&department_id=d1',
    )
    expect(ticket().path).not.toContain('sort')
  })

  it('tür değişince hedef etkin türü taşır (dört tür dört hedef)', async () => {
    world.tasks = [[task('w1')]]
    const page = await mountPage()
    for (const [kind, kinds] of [
      ['kullanici', 'accounts'],
      ['koordinatorluk', 'departments'],
    ] as const) {
      await page.wrapper.get(`[data-kind="${kind}"]`).trigger('click')
      await settle()
      world.download.tickets.clear()
      await download(page)
      expect(ticket().path).toBe(`/v1/admin/deleted/export?kinds=${kinds}&scope=program`)
    }
  })

  it('422 export_too_large: "süzgeci daraltın" iletisi; dosya kaydedilmez; yeniden dene', async () => {
    world.download.redeem = 'too-large'
    world.tasks = [[task('w1')]]
    const page = await mountPage()
    await download(page)
    expect(card(page).attributes('data-code')).toBe('reporting.export_too_large')
    expect(card(page).text()).toContain('Süzgeci daraltıp yeniden deneyin')
    expect(card(page).attributes('role')).toBe('alert')
    expect(saved.clicked).toEqual([])
    world.download.redeem = 'ok'
    await page.wrapper.get('[data-testid="dr-export-retry"]').trigger('click')
    await settle()
    await vi.waitFor(() => expect(saved.clicked).toHaveLength(1))
    expect(card(page).exists()).toBe(false)
  })

  it('429 export_in_progress ve 503 capacity_full: sınıflandırılmış ileti, otomatik tekrar yok', async () => {
    world.tasks = [[task('w1')]]
    const page = await mountPage()
    world.download.redeem = 'in-progress'
    await download(page)
    expect(card(page).attributes('data-code')).toBe('reporting.export_in_progress')
    expect(card(page).text()).toContain('1 sn sonra yeniden deneyebilirsiniz')
    world.download.redeem = 'capacity-full'
    await page.wrapper.get('[data-testid="dr-export-retry"]').trigger('click')
    await vi.waitFor(() =>
      expect(card(page).attributes('data-code')).toBe('reporting.capacity_full'),
    )
    expect(card(page).text()).not.toContain('sn sonra')
    expect(saved.clicked).toEqual([])
    expect(sent('/v1/download-tickets', 'POST')).toHaveLength(2)
  })

  it('bilet üretimi 429/422: kart; akış ortasında kesilme: eksik dosya KAYDEDİLMEZ, "tamamlanamadı"', async () => {
    world.tasks = [[task('w1')]]
    const page = await mountPage()
    world.download.ticket = 'rate-limited'
    await download(page)
    expect(card(page).exists()).toBe(true)
    expect(saved.clicked).toEqual([])
    world.download.ticket = 'ok'
    world.download.redeem = 'truncated'
    await page.wrapper.get('[data-testid="dr-export-retry"]').trigger('click')
    await vi.waitFor(() => expect(card(page).attributes('data-code')).toBeDefined())
    await settle()
    expect(card(page).text()).toContain('CSV tamamlanamadı ve kaydedilmedi')
    expect(saved.created).toHaveLength(0)
    expect(saved.clicked).toEqual([])
    expect(toasts()).toEqual([])
    await page.wrapper.get('[data-testid="dr-export-dismiss"]').trigger('click')
    expect(card(page).exists()).toBe(false)
  })

  it('tek uçuş: indirme sürerken ikinci tık ikinci bilet üretmez; İptal biletsiz/kayıtsız bırakır', async () => {
    world.tasks = [[task('w1')]]
    const page = await mountPage()
    let release!: () => void
    server.use(
      ...[
        (await import('msw')).http.post('http://localhost/v1/download-tickets', async () => {
          await new Promise<void>((resolve) => (release = resolve))
          return (await import('msw')).HttpResponse.json(
            { ticket: 'tk-9', url: '/v1/downloads/tk-9', expires_at: '2026-11-12T10:01:00Z' },
            { status: 201 },
          )
        }),
      ],
    )
    await csv(page).trigger('click')
    await vi.waitFor(() => expect(page.wrapper.find('[data-state="running"]').exists()).toBe(true))
    expect(csv(page).attributes('aria-disabled')).toBe('true')
    await csv(page).trigger('click')
    await vi.waitFor(() => expect(sent('/v1/download-tickets', 'POST')).toHaveLength(1))
    await page.wrapper.get('[data-testid="dr-export-cancel"]').trigger('click')
    release()
    await settle()
    await vi.waitFor(() => expect(card(page).exists()).toBe(false))
    expect(saved.clicked).toEqual([])
    expect(sent('/v1/downloads/tk-9')).toHaveLength(0)
  })
})

describe('CSV: yeni görünümler (v0.26)', () => {
  it('Tümü dokuz türü açıkça ister; Not ve gündem üç not türünü; süzgeçler taşınır, notes ayrı tür değil', async () => {
    world.records = [[record('files', 'f1')]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=tumu&q=plan&silen=acc-7' })
    await download(page)
    expect(ticket().path).toBe(
      '/v1/admin/deleted/export?kinds=tasks%2Csubtasks%2Cfiles%2Cmeetings%2Ctask_notes%2Cmeeting_notes%2Cagenda_items%2Cdepartments%2Caccounts&scope=program&q=plan&deleted_by=acc-7',
    )
    world.download.tickets.clear()
    world.records = [[record('task_notes', 'n1')]]
    await page.wrapper.get('[data-kind="notgundem"]').trigger('click')
    await settle()
    await download(page)
    expect(ticket().path).toBe(
      // Görünüm değişince `silen` temizlenir (mevcut kural); arama korunur.
      '/v1/admin/deleted/export?kinds=task_notes%2Cmeeting_notes%2Cagenda_items&scope=program&q=plan',
    )
    expect(ticket().path).not.toContain('notes&')
    expect(ticket().program).toBe('p1')
  })

  it('tek tür: alt görev ve dosya kendi türünü ister', async () => {
    world.subtasks = [[subtask('s1')]]
    world.files = [[file('f1')]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=altgorev' })
    await download(page)
    expect(ticket().path).toBe('/v1/admin/deleted/export?kinds=subtasks&scope=program')
    world.download.tickets.clear()
    await page.wrapper.get('[data-kind="dosya"]').trigger('click')
    await settle()
    await download(page)
    expect(ticket().path).toBe('/v1/admin/deleted/export?kinds=files&scope=program')
  })
})
