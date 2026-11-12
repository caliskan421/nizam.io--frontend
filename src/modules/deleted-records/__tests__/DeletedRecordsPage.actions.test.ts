import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import {
  account,
  department,
  errorEnvelope,
  meeting,
  mountPage,
  ORIGIN,
  PATHS,
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

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  server.use(...serverDefaults())
  world.dictionary = [{ department_id: 'd1', display_name: 'Mekanik' }]
})
afterEach(() => {
  useConfirm().clear()
  useToast().clear()
  resetAll()
})
afterAll(() => server.close())

const confirm = useConfirm()
const toasts = () => useToast().queue.value.map((t) => t.message)
const row = (page: Mounted, id: string) => page.wrapper.get(`[data-record-key$=":${id}"]`)
const rowIds = (page: Mounted) =>
  page.wrapper.findAll('[data-record-key]').map((r) => r.attributes('data-record-key'))

async function accept(page: Mounted) {
  await confirm.accept(confirm.current.value!.id)
  await settle()
  return page
}

describe('Geri yükle (E-12-35/58)', () => {
  it('onay → PATCH (program başlığı, anahtarsız, CSRF) → satır düşer, bildirim, odak sıradaki satıra', async () => {
    world.tasks = [[task('w1', { title: 'Saha pano montajı' }), task('w2')]]
    const page = await mountPage()
    await row(page, 'w1').get('[data-action="restore"]').trigger('click')
    expect(confirm.current.value).toMatchObject({
      options: {
        title: 'Saha pano montajı geri yüklensin mi?',
        confirmLabel: 'Geri yükle',
        tone: 'primary',
        body: [
          'Bu işlem 1 kaydı geri yükler.',
          'Koordinatörlüğü silinmişse görev geri yüklenemez.',
        ],
      },
    })
    expect(sent('/v1/admin/restore/work-items/w1', 'PATCH')).toHaveLength(0)
    await accept(page)
    const [request] = sent('/v1/admin/restore/work-items/w1', 'PATCH')
    expect(request!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(request!.headers.get('Idempotency-Key')).toBeNull()
    expect(request!.headers.get('X-Requested-With')).toBeTruthy()
    expect(rowIds(page)).toEqual(['gorev:w2'])
    expect(toasts()).toEqual(['Saha pano montajı geri yüklendi.'])
    expect(document.activeElement).toBe(row(page, 'w2').element)
  })

  it('vazgeç: istek yok', async () => {
    world.tasks = [[task('w1')]]
    const page = await mountPage()
    await row(page, 'w1').get('[data-action="restore"]').trigger('click')
    confirm.cancel(confirm.current.value!.id)
    await settle()
    expect(sent('/v1/admin/restore/work-items/w1', 'PATCH')).toHaveLength(0)
    expect(rowIds(page)).toEqual(['gorev:w1'])
  })

  it.each([
    ['toplanti', '/v1/admin/restore/meetings/m1', 'Canlı konferans geri gelmez.'],
    [
      'koordinatorluk',
      '/v1/admin/restore/departments/d5',
      'Üyelik yetkileri geri döner, koordinatörlüğün görevleri dönmez.',
    ],
    ['kullanici', '/v1/admin/restore/accounts/a1', 'Devredilmiş açık görev atamaları geri dönmez.'],
  ] as const)('%s: türe özgü uyarı ve doğru uç', async (kind, path, warning) => {
    world.meetings = [[meeting('m1', { title: 'Fuar' })]]
    world.departments = [[department('d5', { name: 'Operasyon' })]]
    world.accounts = [[account('a1', { full_name: 'Ayşe' })]]
    const page = await mountPage({ path: `/silinen-kayitlar?tur=${kind}` })
    await page.wrapper.get('[data-action="restore"]').trigger('click')
    expect(confirm.current.value!.options.body).toContain(warning)
    await accept(page)
    const [request] = sent(path, 'PATCH')
    expect(request).toBeTruthy()
    // Hesap ucu S1: program başlığı yok; diğerleri S2.
    expect(request!.headers.get('X-Nizamio-Program')).toBe(kind === 'kullanici' ? null : 'p1')
    expect(rowIds(page)).toEqual([])
    expect(page.wrapper.get('[data-testid="dr-state"]').text()).toContain('Silinmiş')
  })
})

describe('Kalıcı sil (E-12-36/59)', () => {
  it('geri alınamaz uyarısı + dosya sayısı; DELETE; files_deleted bildirimi', async () => {
    world.tasks = [[task('w1', { title: 'Saha pano montajı', file_count: 2 })]]
    const page = await mountPage()
    await row(page, 'w1').get('[data-action="purge"]').trigger('click')
    expect(confirm.current.value!.options).toMatchObject({
      tone: 'danger',
      confirmLabel: 'Kalıcı sil',
      body: ['Bu işlem geri alınamaz.', '2 dosya da silinir.'],
    })
    await accept(page)
    expect(sent('/v1/admin/permanent/work-items/w1', 'DELETE')).toHaveLength(1)
    expect(toasts()).toEqual(['Saha pano montajı kalıcı olarak silindi, 2 dosya da silindi.'])
  })

  it('dosyasız kayıtta dosya cümlesi yok', async () => {
    world.meetings = [[meeting('m1')]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=toplanti' })
    await page.wrapper.get('[data-action="purge"]').trigger('click')
    expect(confirm.current.value!.options.body).toEqual(['Bu işlem geri alınamaz.'])
  })
})

describe('hata sınıfları (error-codes.json)', () => {
  async function failRestore(code: string, status: number) {
    world.tasks = [[task('w1'), task('w2')]]
    world.failures.set('PATCH /v1/admin/restore/work-items/w1', { status, code })
    const page = await mountPage()
    await row(page, 'w1').get('[data-action="restore"]').trigger('click')
    await accept(page)
    return page
  }

  it('409 work.not_deleted: zaten geri yüklenmiş, liste yenilenir', async () => {
    world.tasks = [[task('w1'), task('w2')]]
    const page = await mountPage()
    world.failures.set('PATCH /v1/admin/restore/work-items/w1', {
      status: 409,
      code: 'work.not_deleted',
    })
    world.tasks = [[task('w2')]]
    const before = sent(PATHS.tasks).length
    await row(page, 'w1').get('[data-action="restore"]').trigger('click')
    await accept(page)
    expect(toasts()).toEqual(['Kayıt zaten geri yüklenmiş.'])
    expect(sent(PATHS.tasks).length).toBeGreaterThan(before)
    expect(rowIds(page)).toEqual(['gorev:w2'])
  })

  it('404 work.item_not_found (geri yükleme): bulunamadı + yenile', async () => {
    await failRestore('work.item_not_found', 404)
    expect(toasts()).toEqual(['Kayıt bulunamadı.'])
  })

  it('409 work.department_unavailable: satır içi bildirim + Koordinatörlük sekmesine bağlantı', async () => {
    world.departments = [[department('d1')]]
    const page = await failRestore('work.department_unavailable', 409)
    const notice = page.wrapper.get('[data-testid="dr-notice"]')
    expect(notice.text()).toContain('Önce Koordinatörlük sekmesinden geri yükleyin')
    expect(rowIds(page)).toEqual(['gorev:w1', 'gorev:w2'])
    await notice.get('[data-testid="dr-open-departments"]').trigger('click')
    await settle()
    expect(page.router.currentRoute.value.query.tur).toBe('koordinatorluk')
    expect(page.wrapper.find('[data-testid="dr-notice"]').exists()).toBe(false)
    expect(sent(PATHS.departments)).toHaveLength(1)
  })

  it.each([
    ['work.constraint_violation', 'Kalıcı silinemedi: kayıt başka kayıtlarca kullanılıyor.'],
    ['provisioning.write_not_allowed', 'Yazma şu anda kapalı.'],
  ])('409 %s (kalıcı silme)', async (code, message) => {
    world.tasks = [[task('w1')]]
    world.failures.set('DELETE /v1/admin/permanent/work-items/w1', { status: 409, code })
    const page = await mountPage()
    await row(page, 'w1').get('[data-action="purge"]').trigger('click')
    await accept(page)
    expect(toasts()).toEqual([message])
    expect(rowIds(page)).toEqual(['gorev:w1'])
  })

  it('409 organization.department_in_use ve identity.account_referenced', async () => {
    world.departments = [[department('d5')]]
    world.failures.set('DELETE /v1/admin/permanent/departments/d5', {
      status: 409,
      code: 'organization.department_in_use',
    })
    const page = await mountPage({ path: '/silinen-kayitlar?tur=koordinatorluk' })
    await page.wrapper.get('[data-action="purge"]').trigger('click')
    await accept(page)
    expect(toasts()).toEqual([
      'Kalıcı silinemedi: koordinatörlüğün görevleri veya program katılımı var.',
    ])
  })

  it('404 kalıcı silmede: başarı gibi, liste yenilenir', async () => {
    world.accounts = [[account('a1')]]
    world.failures.set('DELETE /v1/admin/permanent/accounts/a1', {
      status: 404,
      code: 'organization.account_not_found',
    })
    const page = await mountPage({ path: '/silinen-kayitlar?tur=kullanici' })
    world.accounts = [[]]
    await page.wrapper.get('[data-action="purge"]').trigger('click')
    await accept(page)
    expect(toasts()).toEqual(['Kayıt zaten silinmiş.'])
    expect(rowIds(page)).toEqual([])
  })

  it('sonuç bilinmiyor (5xx): kör tekrar YOK, liste yeniden okunur, görev kalıcı silmede "tamamlanamadı"', async () => {
    world.tasks = [[task('w1')]]
    server.use(
      http.delete(`${ORIGIN}/v1/admin/permanent/work-items/w1`, () =>
        errorEnvelope('platform.internal', 500),
      ),
    )
    const page = await mountPage()
    const before = sent(PATHS.tasks).length
    await row(page, 'w1').get('[data-action="purge"]').trigger('click')
    await accept(page)
    expect(sent('/v1/admin/permanent/work-items/w1', 'DELETE')).toHaveLength(1)
    expect(sent(PATHS.tasks).length).toBeGreaterThan(before)
    expect(toasts()).toEqual(['Silme tamamlanamadı, yeniden deneyin.'])
  })

  it('sonuç bilinmiyor: hesap geri yüklemede ortak "sonuç bilinmiyor" bildirimi, tek istek', async () => {
    world.accounts = [[account('a1')]]
    server.use(
      http.patch(`${ORIGIN}/v1/admin/restore/accounts/a1`, () =>
        errorEnvelope('platform.internal', 503),
      ),
    )
    const page = await mountPage({ path: '/silinen-kayitlar?tur=kullanici' })
    await page.wrapper.get('[data-action="restore"]').trigger('click')
    await accept(page)
    expect(sent('/v1/admin/restore/accounts/a1', 'PATCH')).toHaveLength(1)
    expect(toasts()).toHaveLength(1)
    expect(rowIds(page)).toEqual(['kullanici:a1'])
  })
})

describe('sahip sökülmesi ve geç sonuç (KESİN 20, 26)', () => {
  it('onay açıkken sayfa sökülünce onay vazgeçilir, istek gitmez', async () => {
    world.tasks = [[task('w1')]]
    const page = await mountPage()
    await row(page, 'w1').get('[data-action="restore"]').trigger('click')
    expect(confirm.current.value).not.toBeNull()
    page.wrapper.unmount()
    await settle()
    expect(confirm.current.value).toBeNull()
    expect(sent('/v1/admin/restore/work-items/w1', 'PATCH')).toHaveLength(0)
  })

  it('istek uçuştayken sayfa sökülürse geç sonuç sahibe ulaşmaz: bildirim ve ek okuma yok', async () => {
    world.tasks = [[task('w1')]]
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    let arrived!: () => void
    const reached = new Promise<void>((resolve) => (arrived = resolve))
    server.use(
      http.patch(`${ORIGIN}/v1/admin/restore/work-items/w1`, async () => {
        arrived()
        await gate
        return HttpResponse.json({ work_item_id: 'w1', status: 'restored' })
      }),
    )
    const page = await mountPage()
    await row(page, 'w1').get('[data-action="restore"]').trigger('click')
    const pending = confirm.accept(confirm.current.value!.id)
    await reached
    const reads = sent(PATHS.tasks).length
    page.wrapper.unmount()
    release()
    await pending
    await settle()
    expect(toasts()).toEqual([])
    expect(sent(PATHS.tasks).length).toBe(reads)
  })
})
