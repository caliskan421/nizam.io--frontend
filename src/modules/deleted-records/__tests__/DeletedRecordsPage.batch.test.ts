// BE-114 · toplu geri yükle / kalıcı sil: seçim, çubuk, onay, kısmi başarı özeti, 100 tavan,
// 5xx, çift tık kilidi, seçimin sıfırlanması ve odak (KESİN 27). Durumlu sahte sunucu gerçek
// zarf biçimini (`succeeded[]`, `failed[{id, code}]`) döner.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import {
  account,
  department,
  meeting,
  mountPage,
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
const ids = (page: Mounted) =>
  page.wrapper
    .findAll('[data-record-key]')
    .map((r) => r.attributes('data-record-key')!.split(':')[1])
const box = (page: Mounted, id: string) =>
  page.wrapper.get(`[data-record-key$=":${id}"] [data-testid="dr-row-check"]`)
const bar = (page: Mounted) => page.wrapper.find('[data-testid="dr-bulk"]')

async function check(page: Mounted, ...rowIds: string[]) {
  for (const id of rowIds) await box(page, id).setValue(true)
}
async function accept() {
  await confirm.accept(confirm.current.value!.id)
  await settle()
}

describe('seçim ve çubuk (E-12-21/22/23)', () => {
  it('seçim yokken çubuk yok; kutular çubuğu açar: "n kayıt seçildi"; Seçimi kaldır kapatır ve odak "tümünü seç"e gider', async () => {
    world.tasks = [[task('w1'), task('w2'), task('w3')]]
    const page = await mountPage()
    expect(bar(page).exists()).toBe(false)
    await check(page, 'w1', 'w3')
    expect(bar(page).get('[role="status"]').text()).toBe('2 kayıt seçildi')
    expect(bar(page).attributes('aria-label')).toBe('Seçili kayıtlar')
    await bar(page).get('[data-action="bulk-clear"]').trigger('click')
    await settle()
    expect(bar(page).exists()).toBe(false)
    expect(document.activeElement).toBe(page.wrapper.get('[data-testid="dr-select-all"]').element)
  })

  it('tümünü seç: yüklenen satırların hepsi; ikinci tık bırakır; kısmi seçimde tri-state', async () => {
    world.tasks = [[task('w1'), task('w2')]]
    const page = await mountPage()
    const all = page.wrapper.get('[data-testid="dr-select-all"]')
    await all.setValue(true)
    expect(bar(page).get('[role="status"]').text()).toBe('2 kayıt seçildi')
    await box(page, 'w1').setValue(false)
    expect((all.element as HTMLInputElement).indeterminate).toBe(true)
    await all.setValue(true)
    expect(bar(page).get('[role="status"]').text()).toBe('2 kayıt seçildi')
    await all.setValue(false)
    expect(bar(page).exists()).toBe(false)
  })

  it('satır kutusu satırı seçmez (panel/URL kayit değişmez); tür, süzgeç ve sıra değişince seçim sıfırlanır', async () => {
    world.tasks = [[task('w1', { title: 'Motor' }), task('w2', { title: 'Şasi' })]]
    world.accounts = [[account('a1')]]
    const page = await mountPage()
    await check(page, 'w1')
    expect(page.router.currentRoute.value.query.kayit).toBeUndefined()
    await page.wrapper.get('[data-sort="name"]').trigger('click')
    await settle()
    expect(bar(page).exists()).toBe(false)
    await check(page, 'w2')
    await page.wrapper.get('[data-kind="kullanici"]').trigger('click')
    await settle()
    expect(bar(page).exists()).toBe(false)
    await check(page, 'a1')
    await page.wrapper.get('[data-kind="gorev"]').trigger('click')
    await settle()
    expect(bar(page).exists()).toBe(false)
  })
})

describe('toplu geri yükle (E-12-21)', () => {
  it('onay sayıyı ve türü söyler; POST ids + program başlığı, anahtarsız, CSRF; satırlar düşer; özet ve rozet sayacı yenilenir', async () => {
    world.tasks = [[task('w1'), task('w2'), task('w3')]]
    const page = await mountPage()
    await check(page, 'w1', 'w2')
    await bar(page).get('[data-action="bulk-restore"]').trigger('click')
    expect(confirm.current.value!.options).toMatchObject({
      title: '2 görev geri yüklensin mi?',
      confirmLabel: 'Geri yükle',
      tone: 'primary',
    })
    expect(confirm.current.value!.options.body).toContain(
      'Koordinatörlüğü silinmişse görev geri yüklenemez.',
    )
    expect(sent('/v1/admin/deleted/work-items/restore', 'POST')).toHaveLength(0)
    const summaries = sent(PATHS.summary).length
    await accept()
    const [request] = sent('/v1/admin/deleted/work-items/restore', 'POST')
    expect(request!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(request!.headers.get('Idempotency-Key')).toBeNull()
    expect(request!.headers.get('X-Requested-With')).toBeTruthy()
    expect(ids(page)).toEqual(['w3'])
    expect(toasts()).toEqual(['2 kayıt geri yüklendi.'])
    expect(bar(page).exists()).toBe(false)
    expect(sent(PATHS.summary).length).toBeGreaterThan(summaries)
    expect(page.wrapper.get('[data-kind="gorev"] .rp-count').text()).toBe('1')
    expect(document.activeElement).not.toBe(document.body)
  })

  it('vazgeç: istek yok, seçim korunur', async () => {
    world.tasks = [[task('w1')]]
    const page = await mountPage()
    await check(page, 'w1')
    await bar(page).get('[data-action="bulk-restore"]').trigger('click')
    confirm.cancel(confirm.current.value!.id)
    await settle()
    expect(sent('/v1/admin/deleted/work-items/restore', 'POST')).toHaveLength(0)
    expect(bar(page).exists()).toBe(true)
  })

  it.each([
    ['toplanti', '/v1/admin/deleted/meetings/restore', 'Canlı konferans geri gelmez.', 'p1'],
    [
      'koordinatorluk',
      '/v1/admin/deleted/departments/restore',
      'Üyelik yetkileri geri döner, koordinatörlüğün görevleri dönmez.',
      'p1',
    ],
    [
      'kullanici',
      '/v1/admin/deleted/accounts/restore',
      'Devredilmiş açık görev atamaları geri dönmez.',
      null,
    ],
  ] as const)(
    '%s: doğru uç, türe özgü uyarı, başlık (hesap S1: başlıksız)',
    async (kind, path, warning, program) => {
      world.meetings = [[meeting('m1')]]
      world.departments = [[department('d5')]]
      world.accounts = [[account('a1')]]
      const page = await mountPage({ path: `/silinen-kayitlar?tur=${kind}` })
      await page.wrapper.get('[data-testid="dr-select-all"]').setValue(true)
      await bar(page).get('[data-action="bulk-restore"]').trigger('click')
      expect(confirm.current.value!.options.body).toContain(warning)
      await accept()
      const [request] = sent(path, 'POST')
      expect(request!.headers.get('X-Nizamio-Program')).toBe(program)
      expect(ids(page)).toEqual([])
    },
  )
})

describe('toplu kalıcı sil', () => {
  it('geri alınamaz + görevde dosya uyarısı; danger; DELETE değil POST purge; ids gövdede', async () => {
    world.tasks = [[task('w1'), task('w2')]]
    const page = await mountPage()
    await page.wrapper.get('[data-testid="dr-select-all"]').setValue(true)
    await bar(page).get('[data-action="bulk-purge"]').trigger('click')
    expect(confirm.current.value!.options).toMatchObject({
      title: '2 görev kalıcı olarak silinsin mi?',
      tone: 'danger',
      confirmLabel: 'Kalıcı sil',
      body: ['Bu işlem geri alınamaz.', 'Görevlerin dosyaları da silinir.'],
    })
    await accept()
    expect(sent('/v1/admin/deleted/work-items/purge', 'POST')).toHaveLength(1)
    expect(sent('/v1/admin/permanent/work-items/w1', 'DELETE')).toHaveLength(0)
    expect(toasts()).toEqual(['2 kayıt kalıcı olarak silindi.'])
    expect(ids(page)).toEqual([])
  })
})

describe('kısmi başarı ve hata kodları', () => {
  it('başarısız kayıtlar adı ve gerekçesiyle özette kalır; başarısızlar seçili kalır; başarılar düşer', async () => {
    world.departments = [
      [
        department('d5', { name: 'Operasyon' }),
        department('d6', { name: 'Fuar' }),
        department('d7'),
      ],
    ]
    world.itemFailures.set('d6', 'organization.department_in_use')
    world.itemFailures.set('d7', 'bilinmeyen.kod')
    const page = await mountPage({ path: '/silinen-kayitlar?tur=koordinatorluk' })
    await page.wrapper.get('[data-testid="dr-select-all"]').setValue(true)
    await bar(page).get('[data-action="bulk-purge"]').trigger('click')
    await accept()
    expect(ids(page)).toEqual(['d6', 'd7'])
    const summary = page.wrapper.get('[data-testid="dr-batch-summary"]')
    expect(summary.text()).toContain('1 kayıt işlendi, 2 kayıt işlenemedi.')
    expect(summary.get('[data-failed-id="d6"]').text()).toContain('Fuar')
    expect(summary.get('[data-failed-id="d6"]').text()).toContain(
      'Kalıcı silinemedi: koordinatörlüğün görevleri veya program katılımı var.',
    )
    expect(summary.get('[data-failed-id="d7"]').text()).toContain('Bu kayıt işlenemedi.')
    // Sunucu iletisi ve ham kod gösterilmez.
    expect(page.wrapper.text()).not.toMatch(/sunucu iletisi|organization\.department_in_use/)
    // Başarısızlar seçili kaldı: çubuk 2 kayıt gösterir.
    expect(bar(page).get('[role="status"]').text()).toBe('2 kayıt seçildi')
    await summary.get('[data-testid="dr-batch-dismiss"]').trigger('click')
    await settle()
    expect(page.wrapper.find('[data-testid="dr-batch-summary"]').exists()).toBe(false)
    expect(document.activeElement).toBe(page.wrapper.get('[data-kind="koordinatorluk"]').element)
  })

  it('hiçbiri işlenmedi: "Hiçbir kayıt işlenemedi"; hesap hata kodları (kendi hesabı, başvurulan)', async () => {
    world.accounts = [[account('a1', { full_name: 'Ben' }), account('a2', { full_name: 'Başka' })]]
    world.itemFailures.set('a1', 'organization.not_authorized')
    world.itemFailures.set('a2', 'identity.account_referenced')
    const page = await mountPage({ path: '/silinen-kayitlar?tur=kullanici' })
    await page.wrapper.get('[data-testid="dr-select-all"]').setValue(true)
    await bar(page).get('[data-action="bulk-purge"]').trigger('click')
    await accept()
    const summary = page.wrapper.get('[data-testid="dr-batch-summary"]').text()
    expect(summary).toContain('Hiçbir kayıt işlenemedi (2 kayıt).')
    expect(summary).toContain('Kendi hesabınız kalıcı silinemez.')
    expect(summary).toContain('Kalıcı silinemedi: kayıt başka kayıtlarca kullanılıyor.')
    expect(ids(page)).toEqual(['a1', 'a2'])
  })

  it('görevde koordinatörlük silinmiş: gerekçe "Önce Koordinatörlük sekmesinden geri yükleyin"', async () => {
    world.tasks = [[task('w1', { title: 'Kapalı birim görevi' })]]
    world.itemFailures.set('w1', 'work.department_unavailable')
    const page = await mountPage()
    await check(page, 'w1')
    await bar(page).get('[data-action="bulk-restore"]').trigger('click')
    await accept()
    expect(page.wrapper.get('[data-failed-id="w1"]').text()).toContain(
      'Önce Koordinatörlük sekmesinden geri yükleyin',
    )
  })

  it('5xx: sistem hatası bildirimi, liste yeniden okunur, kör tekrar yok; işlenenler kalıcıdır', async () => {
    world.tasks = [[task('w1'), task('w2')]]
    world.failures.set('POST /v1/admin/deleted/work-items/restore', {
      status: 500,
      code: 'platform.internal',
    })
    const page = await mountPage()
    await page.wrapper.get('[data-testid="dr-select-all"]').setValue(true)
    const lists = sent(PATHS.tasks).length
    await bar(page).get('[data-action="bulk-restore"]').trigger('click')
    await accept()
    expect(sent('/v1/admin/deleted/work-items/restore', 'POST')).toHaveLength(1)
    expect(sent(PATHS.tasks).length).toBeGreaterThan(lists)
    expect(toasts().length).toBeGreaterThan(0)
    expect(page.wrapper.get('[data-testid="dr-batch-summary"]').text()).toContain('yarıda kaldı')
    expect(ids(page)).toEqual(['w1', 'w2'])
  })
})

describe('100 tavan ve çift tık', () => {
  it('120 kayıt iki ardışık istekte (100 + 20), onay parçalamayı söyler', async () => {
    world.tasks = [Array.from({ length: 120 }, (_, i) => task(`w${i}`))]
    const page = await mountPage()
    await page.wrapper.get('[data-testid="dr-select-all"]').setValue(true)
    await bar(page).get('[data-action="bulk-restore"]').trigger('click')
    expect(confirm.current.value!.options.body).toContain(
      'Kayıtlar 100’erli gruplar hâlinde işlenir.',
    )
    await accept()
    const posts = sent('/v1/admin/deleted/work-items/restore', 'POST')
    expect(posts).toHaveLength(2)
    expect(toasts()).toEqual(['120 kayıt geri yüklendi.'])
    expect(ids(page)).toEqual([])
  })

  it('uçuşta düğmeler aria-disabled; ikinci tık ikinci istek başlatmaz', async () => {
    world.tasks = [[task('w1')]]
    const page = await mountPage()
    await check(page, 'w1')
    await bar(page).get('[data-action="bulk-restore"]').trigger('click')
    const pending = confirm.accept(confirm.current.value!.id)
    await bar(page).get('[data-action="bulk-restore"]').trigger('click')
    await bar(page).get('[data-action="bulk-purge"]').trigger('click')
    await pending
    await settle()
    expect(sent('/v1/admin/deleted/work-items/restore', 'POST')).toHaveLength(1)
    expect(sent('/v1/admin/deleted/work-items/purge', 'POST')).toHaveLength(0)
  })
})
