// BE-115 · Çöpü boşalt: tür adı yazarak onay → ortak onay → ≤50'lik parçalar döngüsü
// (`remaining` > 0 ve başarı varken sürer), durdur, kapsam değişimi, 5xx, kalan başarısızlar.
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
const panel = (page: Mounted) => page.wrapper.find('[data-testid="dr-purgeall"]')
const trash = (page: Mounted) => page.wrapper.get('[data-testid="dr-empty-trash"]')
const rowIds = (page: Mounted) =>
  page.wrapper.findAll('[data-record-key]').map((r) => r.attributes('data-record-key'))

async function open(page: Mounted) {
  await trash(page).trigger('click')
  await settle()
}
async function type(page: Mounted, text: string) {
  await page.wrapper.get('[data-testid="dr-purgeall-input"]').setValue(text)
}
async function submit(page: Mounted) {
  await page.wrapper.get('[data-testid="dr-purgeall-confirm"]').trigger('click')
  await settle()
}
async function accept() {
  await confirm.accept(confirm.current.value!.id)
  await settle()
}
const posts = (segment: string) => sent(`/v1/admin/deleted/${segment}/purge-all`, 'POST')

describe('tür adı yazarak onay (varsayım 11)', () => {
  it('panel sayıyı ve kapsamı söyler; tür adı yazılana dek onay düğmesi etkisiz, ortak onay açılmaz', async () => {
    world.tasks = [[task('w1'), task('w2'), task('w3')]]
    const page = await mountPage()
    expect(panel(page).exists()).toBe(false)
    expect(trash(page).attributes('aria-expanded')).toBe('false')
    expect(trash(page).attributes('aria-controls')).toBeUndefined()
    await open(page)
    expect(trash(page).attributes('aria-expanded')).toBe('true')
    expect(trash(page).attributes('aria-controls')).toBe('dr-purgeall')
    const text = panel(page).text()
    expect(text).toContain('3 görev kalıcı olarak silinecek')
    expect(text).toContain('süzgeçler dikkate alınmaz')
    expect(text).toContain('Bu işlem geri alınamaz.')
    expect(document.activeElement).toBe(
      page.wrapper.get('[data-testid="dr-purgeall-input"]').element,
    )
    expect(
      page.wrapper.get('[data-testid="dr-purgeall-confirm"]').attributes('aria-disabled'),
    ).toBe('true')
    await submit(page)
    await type(page, 'görevler')
    await submit(page)
    expect(confirm.current.value).toBeNull()
    expect(posts('work-items')).toHaveLength(0)
    await type(page, 'GÖREV')
    expect(
      page.wrapper.get('[data-testid="dr-purgeall-confirm"]').attributes('aria-disabled'),
    ).toBeUndefined()
    await submit(page)
    expect(confirm.current.value!.options).toMatchObject({
      tone: 'danger',
      confirmLabel: 'Çöpü boşalt',
      title: 'Silinmiş görev kayıtları kalıcı olarak silinsin mi?',
    })
    expect(posts('work-items')).toHaveLength(0)
  })

  it('Esc ve Vazgeç paneli kapatır; odak başlıktaki düğmeye döner; istek yok', async () => {
    world.tasks = [[task('w1')]]
    const page = await mountPage()
    await open(page)
    await page.wrapper.get('[data-testid="dr-purgeall"]').trigger('keydown', { key: 'Escape' })
    await settle()
    expect(panel(page).exists()).toBe(false)
    expect(document.activeElement).toBe(trash(page).element)
    await open(page)
    await page.wrapper.get('[data-testid="dr-purgeall-cancel"]').trigger('click')
    await settle()
    expect(panel(page).exists()).toBe(false)
    expect(document.activeElement).toBe(trash(page).element)
    expect(posts('work-items')).toHaveLength(0)
  })

  it('ortak onaydan vazgeçilirse istek gitmez ve panel açık kalır', async () => {
    world.tasks = [[task('w1')]]
    const page = await mountPage()
    await open(page)
    await type(page, 'görev')
    await submit(page)
    confirm.cancel(confirm.current.value!.id)
    await settle()
    expect(posts('work-items')).toHaveLength(0)
    expect(panel(page).exists()).toBe(true)
  })
})

describe('döngü', () => {
  it('120 görev 50 + 50 + 20 üç çağrıda; confirm=work-items, program başlığı, anahtarsız; sonunda bildirim ve boş liste', async () => {
    world.tasks = [Array.from({ length: 120 }, (_, i) => task(`w${i}`))]
    const page = await mountPage()
    await open(page)
    await type(page, 'görev')
    await submit(page)
    await accept()
    const calls = posts('work-items')
    expect(calls).toHaveLength(3)
    expect(calls[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(calls[0]!.headers.get('Idempotency-Key')).toBeNull()
    expect(calls[0]!.headers.get('X-Requested-With')).toBeTruthy()
    expect(toasts()).toEqual(['Çöp boşaltıldı: 120 kayıt kalıcı olarak silindi.'])
    expect(rowIds(page)).toEqual([])
    expect(panel(page).exists()).toBe(false)
    expect(document.activeElement).toBe(trash(page).element)
    // Özet sayacı yenilendi (çöpten sonra 0).
    expect(page.wrapper.get('[data-kind="gorev"] .rp-count').text()).toBe('0')
  })

  it.each([
    ['toplanti', 'meetings', 'toplantı', 'p1'],
    ['kullanici', 'accounts', 'kullanıcı', null],
  ] as const)(
    '%s: doğru uç ve onay değeri (%s); hesap ucu S1 başlıksız',
    async (kind, segment, name, program) => {
      world.meetings = [[meeting('m1'), meeting('m2')]]
      world.accounts = [[account('a1'), account('a2')]]
      const page = await mountPage({ path: `/silinen-kayitlar?tur=${kind}` })
      await open(page)
      expect(panel(page).text()).toContain(`2 ${name} kalıcı olarak silinecek`)
      await type(page, name)
      await submit(page)
      await accept()
      expect(posts(segment)).toHaveLength(1)
      expect(posts(segment)[0]!.headers.get('X-Nizamio-Program')).toBe(program)
      expect(rowIds(page)).toEqual([])
    },
  )

  it('hiç başarı olmayan çağrıdan sonra durur; kalanlar koduyla gruplanır, sonsuz döngü yok', async () => {
    world.accounts = [[account('a1'), account('a2'), account('a3')]]
    for (const id of ['a1', 'a2', 'a3']) world.itemFailures.set(id, 'identity.account_referenced')
    const page = await mountPage({ path: '/silinen-kayitlar?tur=kullanici' })
    await open(page)
    await type(page, 'kullanıcı')
    await submit(page)
    await accept()
    expect(posts('accounts')).toHaveLength(1)
    const summary = page.wrapper.get('[data-testid="dr-batch-summary"]').text()
    expect(summary).toContain('0 kayıt silindi, 3 kayıt silinemedi.')
    expect(summary).toContain('3 kayıt')
    expect(summary).toContain('Kalıcı silinemedi: kayıt başka kayıtlarca kullanılıyor.')
    expect(rowIds(page)).toHaveLength(3)
  })

  it('bir kısmı silinir, kalanlar başarısız: döngü sürer sonra durur', async () => {
    world.accounts = [Array.from({ length: 60 }, (_, i) => account(`a${i}`))]
    world.itemFailures.set('a55', 'identity.account_referenced')
    const page = await mountPage({ path: '/silinen-kayitlar?tur=kullanici' })
    await open(page)
    await type(page, 'kullanıcı')
    await submit(page)
    await accept()
    // 1. çağrı 50 siler; 2. çağrı kalan 10'dan 9'unu siler, a55 başarısız kalır; 3. çağrı hiç
    // başarı olmadığından durur (aynı kayıt iki çağrıda başarısız: tek satır).
    expect(posts('accounts')).toHaveLength(3)
    expect(page.wrapper.get('[data-testid="dr-batch-summary"]').text()).toContain(
      '59 kayıt silindi, 1 kayıt silinemedi.',
    )
  })

  it('Durdur: çalışan çağrı biter, sonraki gitmez; "Durduruldu" özeti', async () => {
    world.tasks = [Array.from({ length: 120 }, (_, i) => task(`w${i}`))]
    let release!: () => void
    // İlk parça onay penceresinde (diyalog meşgul) gider; durdurma düğmesi ilerleme panelindedir.
    world.purgeGate = (call) =>
      call === 2 ? new Promise<void>((resolve) => (release = resolve)) : Promise.resolve()
    const page = await mountPage()
    await open(page)
    await type(page, 'görev')
    await submit(page)
    // `settle` ikinci (bekletilen) çağrıyı beklerdi: onay doğrudan kabul edilir.
    await confirm.accept(confirm.current.value!.id)
    await vi.waitFor(() => expect(posts('work-items')).toHaveLength(2))
    expect(page.wrapper.get('[data-testid="dr-purgeall-progress"]').text()).toContain(
      '50 kayıt silindi, 70 kayıt kaldı',
    )
    await page.wrapper.get('[data-testid="dr-purgeall-stop"]').trigger('click')
    release()
    await vi.waitFor(() =>
      expect(page.wrapper.find('[data-testid="dr-batch-summary"]').exists()).toBe(true),
    )
    await settle()
    expect(posts('work-items')).toHaveLength(2)
    expect(page.wrapper.get('[data-testid="dr-batch-summary"]').text()).toContain(
      'Durduruldu: 100 kayıt silindi, kalanına dokunulmadı.',
    )
    expect(rowIds(page).length).toBe(20)
  })

  it('kapsam değişince sonraki çağrı gitmez (bağlam bayat)', async () => {
    world.tasks = [Array.from({ length: 160 }, (_, i) => task(`w${i}`))]
    let release!: () => void
    world.purgeGate = (call) =>
      call === 2 ? new Promise<void>((resolve) => (release = resolve)) : Promise.resolve()
    const page = await mountPage()
    await open(page)
    await type(page, 'görev')
    await submit(page)
    await confirm.accept(confirm.current.value!.id)
    await vi.waitFor(() => expect(posts('work-items')).toHaveLength(2))
    page.store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    release()
    await settle()
    await vi.waitFor(() =>
      expect(page.wrapper.find('[data-testid="dr-purgeall-progress"]').exists()).toBe(false),
    )
    expect(posts('work-items')).toHaveLength(2)
  })

  it('5xx: bildirim, liste yenilenir, "yarıda kaldı" özeti; kör tekrar yok', async () => {
    world.tasks = [[task('w1'), task('w2')]]
    world.failures.set('POST /v1/admin/deleted/work-items/purge-all', {
      status: 500,
      code: 'platform.internal',
    })
    const page = await mountPage()
    await open(page)
    await type(page, 'görev')
    await submit(page)
    const lists = sent(PATHS.tasks).length
    await accept()
    expect(posts('work-items')).toHaveLength(1)
    expect(sent(PATHS.tasks).length).toBeGreaterThan(lists)
    expect(page.wrapper.get('[data-testid="dr-batch-summary"]').text()).toContain('yarıda kaldı')
    expect(toasts().length).toBeGreaterThan(0)
  })
})

describe('koordinatörlük türü: çöpü boşalt devre dışı (kalan stub BE-115)', () => {
  it('sekmede devre dışı + açıklama; panel açılmaz, istek yok; diğer türlerde etkin', async () => {
    world.departments = [[department('d5')]]
    world.tasks = [[task('w1')]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=koordinatorluk' })
    const button = trash(page)
    expect(button.attributes('disabled')).toBeDefined()
    expect(page.wrapper.get('[data-design-stub="BE-163"]').element.contains(button.element)).toBe(
      true,
    )
    expect(button.attributes('title')).toContain('şirket geneli')
    await button.trigger('click')
    expect(panel(page).exists()).toBe(false)
    await page.wrapper.get('[data-kind="gorev"]').trigger('click')
    await settle()
    expect(trash(page).attributes('disabled')).toBeUndefined()
    expect(page.wrapper.find('[data-design-stub="BE-163"]').exists()).toBe(false)
  })
})
