// F10 W193 · Tümü, Not ve gündem, Alt görev ve Dosya görünümleri (v0.26): tek birleşik sorgu,
// tipli listeler, satır anahtarı kind:id, bilinmeyen tür salt okunur, ebeveyn uyarısı ve bağlantısı,
// karma toplu işlem ve CSV. Durumlu sahte sunucu + gerçek router/sayfa.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import {
  agendaItem,
  file,
  meetingNote,
  mountPage,
  PATHS,
  record,
  requests,
  resetAll,
  sent,
  server,
  serverDefaults,
  settle,
  subtask,
  task,
  taskNote,
  world,
  type Mounted,
} from './harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-12T12:00:00Z') })
  server.use(...serverDefaults())
  world.dictionary = [{ department_id: 'd1', display_name: 'Mekanik' }]
})
afterEach(() => {
  vi.useRealTimers()
  useConfirm().clear()
  useToast().clear()
  resetAll()
})
afterAll(() => server.close())

const confirm = useConfirm()
const toasts = () => useToast().queue.value.map((t) => t.message)
const keys = (page: Mounted) =>
  page.wrapper.findAll('[data-record-key]').map((r) => r.attributes('data-record-key'))
const row = (page: Mounted, key: string) => page.wrapper.get(`[data-record-key="${key}"]`)
const query = (page: Mounted) => page.router.currentRoute.value.query
async function accept() {
  await confirm.accept(confirm.current.value!.id)
  await settle()
}

describe('Tümü: tek birleşik sorgu', () => {
  it('yalnız listDeletedRecords çağrılır (fan-out yok); scope=program, limit 50, sıra/kinds yok', async () => {
    world.records = [[record('files', 'f1'), record('tasks', 't1'), record('accounts', 'a1')]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=tumu' })
    expect(keys(page)).toEqual(['files:f1', 'tasks:t1', 'accounts:a1'])
    const calls = sent(PATHS.records)
    expect(calls).toHaveLength(1)
    expect(calls[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(calls[0]!.query.get('scope')).toBe('program')
    expect(calls[0]!.query.get('limit')).toBe('50')
    for (const name of ['sort', 'order', 'kinds', 'cursor']) {
      expect(calls[0]!.query.has(name), name).toBe(false)
    }
    for (const path of [PATHS.tasks, PATHS.files, PATHS.subtasks, PATHS.meetings, PATHS.accounts]) {
      expect(sent(path), path).toHaveLength(0)
    }
  })

  it('sayfa limitten kısa olabilir: dolu imleç sürer; daha fazla yükleme sonraki sayfayı ekler', async () => {
    world.records = [[record('files', 'f1')], [record('subtasks', 's1')], [record('tasks', 't1')]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=tumu' })
    expect(keys(page)).toEqual(['files:f1'])
    await page.wrapper.get('[data-testid="dr-more"]').trigger('click')
    await settle()
    expect(sent(PATHS.records)[1]!.query.get('cursor')).toBe('1')
    expect(keys(page)).toEqual(['files:f1', 'subtasks:s1'])
    await page.wrapper.get('[data-testid="dr-more"]').trigger('click')
    await settle()
    expect(keys(page)).toEqual(['files:f1', 'subtasks:s1', 'tasks:t1'])
    expect(page.wrapper.find('[data-testid="dr-more"]').exists()).toBe(false)
  })

  it('sıralama başlıkları kilitli (yalnız sunucu sırası); süzgeç değişince imleç sıfırlanır', async () => {
    world.records = [[record('files', 'f1', { name: 'Motor.pdf' })], [record('tasks', 't1')]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=tumu' })
    expect(page.wrapper.find('[data-sort]').exists()).toBe(false)
    await page.wrapper.get('[data-testid="dr-more"]').trigger('click')
    await settle()
    expect(sent(PATHS.records).at(-1)!.query.get('cursor')).toBe('1')
    await page.router.replace({ query: { tur: 'tumu', q: 'motor' } })
    await settle()
    const last = sent(PATHS.records).at(-1)!
    expect(last.query.get('q')).toBe('motor')
    expect(last.query.has('cursor')).toBe(false)
  })

  it('aynı kimlik iki türde: satırlar ayrı anahtarlı; seçim ve panel yalnız seçileni etkiler', async () => {
    world.records = [
      [record('files', '7', { name: 'Plan.pdf' }), record('subtasks', '7', { name: 'Plan işi' })],
    ]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=tumu' })
    await row(page, 'files:7').get('[data-testid="dr-row-check"]').setValue(true)
    expect(page.wrapper.get('[data-testid="dr-bulk"] [role="status"]').text()).toBe(
      '1 kayıt seçildi',
    )
    expect(
      (row(page, 'subtasks:7').get('[data-testid="dr-row-check"]').element as HTMLInputElement)
        .checked,
    ).toBe(false)
    await row(page, 'subtasks:7').trigger('click')
    await settle()
    expect(query(page).kayit).toBe('subtasks:7')
    expect(row(page, 'subtasks:7').attributes('aria-current')).toBe('true')
    expect(row(page, 'files:7').attributes('aria-current')).toBeUndefined()
    expect(page.wrapper.get('[data-testid="dr-panel"]').text()).toContain('Plan işi')
  })

  it('bilinmeyen (gelecek) tür: salt okunur, onay kutusu ve eylem yok; total gizlice düşmez', async () => {
    world.records = [[record('tasks', 't1'), record('calendar_events', 'c1', { name: 'Takvim' })]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=tumu' })
    const unknown = row(page, 'calendar_events:c1')
    expect(unknown.find('[data-testid="dr-row-check"]').exists()).toBe(false)
    expect(unknown.find('[data-action="restore"]').exists()).toBe(false)
    expect(unknown.find('[data-action="purge"]').exists()).toBe(false)
    expect(unknown.text()).toContain('Tanınmayan tür')
    expect(unknown.text()).toContain('bu sürümde yönetilemiyor')
    expect(page.wrapper.get('[data-testid="dr-count"]').text()).toBe('2 kayıt')
    await page.wrapper.get('[data-testid="dr-select-all"]').setValue(true)
    expect(page.wrapper.get('[data-testid="dr-bulk"] [role="status"]').text()).toBe(
      '1 kayıt seçildi',
    )
    await unknown.trigger('click')
    await settle()
    expect(page.wrapper.find('[data-testid="dr-panel"] [data-action="restore"]').exists()).toBe(
      false,
    )
  })

  it('adı ve ebeveyn adı olmayan satır kimliği ad diye göstermez', async () => {
    world.records = [
      [
        record('files', 'f9', {
          name: '',
          parent: { kind: 'tasks', id: 'gizli-kimlik', name: null, deleted: true },
        }),
      ],
    ]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=tumu' })
    const text = row(page, 'files:f9').text()
    expect(text).toContain('Adı okunamayan kayıt')
    expect(text).not.toContain('gizli-kimlik')
    expect(text).not.toContain('f9')
    expect(row(page, 'files:f9').find('[data-action="open-parent"]').exists()).toBe(false)
  })
})

describe('Not ve gündem: tek sorgu, üç tür', () => {
  it('kinds açıkça üç not türü; sayaç notes (Tümü toplamına ikinci kez eklenmez)', async () => {
    world.taskNotes = [[taskNote('n1')]]
    world.meetingNotes = [[meetingNote('m1')]]
    world.agendaItems = [[agendaItem('a1')]]
    world.records = [
      [record('task_notes', 'n1'), record('meeting_notes', 'm1'), record('agenda_items', 'a1')],
    ]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=notgundem' })
    expect(sent(PATHS.records)[0]!.query.get('kinds')).toBe('task_notes,meeting_notes,agenda_items')
    expect(sent(PATHS.taskNotes)).toHaveLength(0)
    const count = (kind: string) =>
      page.wrapper.get(`[data-testid="dr-kinds"] [data-kind="${kind}"] .rp-count`).text()
    expect(count('notgundem')).toBe('3')
    expect(count('tumu')).toBe('3')
    expect(page.wrapper.get('[data-testid="dr-sub"]').text()).toBe(
      '3 not ve gündem · yalnız yönetici görür',
    )
  })
})

describe('tipli görünümler: Alt görev ve Dosya', () => {
  it('dosya listesi kendi ucundan; ad, görev kodu/başlığı ve panel alanları yalnız dönen veriden', async () => {
    world.files = [
      [file('f1', { display_name: 'Rapor.pdf', work_item_code: 'OPE-3', size_bytes: 3072 })],
    ]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=dosya' })
    expect(sent(PATHS.files)).toHaveLength(1)
    expect(sent(PATHS.files)[0]!.query.get('limit')).toBe('200')
    expect(sent(PATHS.records)).toHaveLength(0)
    const first = row(page, 'files:f1')
    expect(first.text()).toContain('Rapor.pdf')
    expect(first.text()).toContain('OPE-3')
    await first.trigger('click')
    await settle()
    const panel = page.wrapper.get('[data-testid="dr-panel"]').text()
    expect(panel).toContain('3 KB')
    expect(panel).toContain('application/pdf')
    expect(query(page).kayit).toBe('f1')
  })

  it('eski düz kimlikli kayit bağlantısı tek türlü görünümde seçimi kurar', async () => {
    world.subtasks = [[subtask('s1'), subtask('s2', { title: 'İkinci alt görev' })]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=altgorev&kayit=s2' })
    expect(row(page, 'subtasks:s2').attributes('aria-current')).toBe('true')
    expect(page.wrapper.get('[data-testid="dr-panel"]').text()).toContain('İkinci alt görev')
  })

  it('Tümü içinde kind:id ile seçili kayıt geri kurulur', async () => {
    world.records = [[record('files', 'f1'), record('subtasks', 's1', { name: 'Kablo çekimi' })]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=tumu&kayit=subtasks:s1' })
    expect(row(page, 'subtasks:s1').attributes('aria-current')).toBe('true')
    expect(page.wrapper.get('[data-testid="dr-panel"]').text()).toContain('Kablo çekimi')
  })
})

describe('ebeveyn çöpte', () => {
  const orphan = () =>
    record('files', 'f1', {
      name: 'Plan.pdf',
      parent: { kind: 'tasks', id: 'w5', name: 'Pano montajı', deleted: true },
    })

  it('uyarı gösterilir, geri yükle etkin kalır; gerçek 409 W192 metniyle bildirilir', async () => {
    world.records = [[orphan()]]
    world.failures.set('PATCH /v1/admin/restore/files/f1', {
      status: 409,
      code: 'records.work_item_deleted',
    })
    const page = await mountPage({ path: '/silinen-kayitlar?tur=tumu' })
    const line = row(page, 'files:f1')
    expect(line.get('[data-testid="dr-parent"]').text()).toContain(
      'Önce bağlı görevi geri yükleyin.',
    )
    expect(page.wrapper.text()).not.toContain('birlikte geri yüklenir')
    await line.get('[data-action="restore"]').trigger('click')
    await settle()
    await accept()
    expect(sent('/v1/admin/restore/files/f1', 'PATCH')).toHaveLength(1)
    expect(toasts()).toContain('Önce kaydın bağlı olduğu görevi geri yükleyin.')
  })

  it('bağlantı ebeveyn görünümünü açar; çocuğun süzgeçleri taşınmaz, ebeveyn seçili gelir', async () => {
    world.records = [[orphan()]]
    world.tasks = [[task('w5', { title: 'Pano montajı' })]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=tumu&q=plan&aralik=7gun' })
    await row(page, 'files:f1').get('[data-action="open-parent"]').trigger('click')
    await settle()
    // Görev varsayılan görünümdür: URL'de `tur` yazılmaz; çocuğun süzgeçleri taşınmaz.
    expect(query(page).kayit).toBe('w5')
    expect(query(page).tur).toBeUndefined()
    expect(page.wrapper.get('[data-kind="gorev"]').attributes('aria-pressed')).toBe('true')
    expect(query(page).q).toBeUndefined()
    expect(query(page).aralik).toBeUndefined()
    expect(row(page, 'tasks:w5').attributes('aria-current')).toBe('true')
  })

  it('ebeveyn çöpte değilse ya da türü bilinmiyorsa uyarı/bağlantı yok', async () => {
    world.records = [
      [
        record('files', 'f1', {
          parent: { kind: 'tasks', id: 'w5', name: 'Canlı görev', deleted: false },
        }),
        record('files', 'f2', {
          parent: { kind: 'calendar', id: 'x', name: 'Takvim', deleted: true },
        }),
      ],
    ]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=tumu' })
    expect(row(page, 'files:f1').find('[data-testid="dr-parent"]').exists()).toBe(false)
    const unknownParent = row(page, 'files:f2')
    expect(unknownParent.find('[data-testid="dr-parent"]').exists()).toBe(true)
    expect(unknownParent.find('[data-action="open-parent"]').exists()).toBe(false)
  })
})

describe('tekil geri yükleme: dosya yeni adı', () => {
  it('ad çakışırsa gerçek yanıttaki display_name bildirilir; çakışma yoksa düz mesaj', async () => {
    world.files = [
      [file('f1', { display_name: 'rapor.csv' }), file('f2', { display_name: 'plan.csv' })],
    ]
    world.fileRenames.set('f1', 'rapor (2).csv')
    const page = await mountPage({ path: '/silinen-kayitlar?tur=dosya' })
    await row(page, 'files:f1').get('[data-action="restore"]').trigger('click')
    await settle()
    await accept()
    expect(toasts()).toContain(
      'rapor.csv geri yüklendi; aynı ad görevde kullanıldığı için “rapor (2).csv” olarak adlandırıldı.',
    )
    await row(page, 'files:f2').get('[data-action="restore"]').trigger('click')
    await settle()
    await accept()
    expect(toasts()).toContain('plan.csv geri yüklendi.')
  })
})

describe('karma toplu işlem', () => {
  const mixed = () => {
    world.records = [
      [
        record('files', '7'),
        record('tasks', '7'),
        record('subtasks', '7'),
        record('accounts', '7'),
      ],
    ]
    world.files = [[file('7')]]
    world.tasks = [[task('7')]]
    world.subtasks = [[subtask('7')]]
  }
  const selectAll = async (page: Mounted) =>
    page.wrapper.get('[data-testid="dr-select-all"]').setValue(true)
  const posts = (suffix: string) =>
    requests.filter((r) => r.method === 'POST' && r.path.endsWith(suffix)).map((r) => r.path)

  it('onay tür+sayı özetini ve hesap kapsamını söyler; geri yüklemede ebeveyn önce gönderilir; her tür kendi ucuna', async () => {
    mixed()
    const page = await mountPage({ path: '/silinen-kayitlar?tur=tumu' })
    await selectAll(page)
    await page.wrapper.get('[data-action="bulk-restore"]').trigger('click')
    const options = confirm.current.value!.options
    expect(options.title).toContain('1 kullanıcı, 1 görev, 1 alt görev, 1 dosya')
    expect(options.body).toContain('Hesaplar şirket genelinde geri yüklenir.')
    await accept()
    const order = requests
      .filter((r) => r.method === 'POST' && r.path.endsWith('/restore'))
      .map((r) => r.path.split('/').at(-2))
    expect(order).toEqual(['accounts', 'work-items', 'subtasks', 'files'])
    expect(posts('/accounts/restore')).toHaveLength(1)
    expect(
      requests.find((r) => r.path.endsWith('/accounts/restore'))!.headers.get('X-Nizamio-Program'),
    ).toBeNull()
    expect(
      requests.find((r) => r.path.endsWith('/files/restore'))!.headers.get('X-Nizamio-Program'),
    ).toBe('p1')
  })

  it('kalıcı silmede çocuklar önce; görev kaskad uyarısı ve hesap kapsamı onayda korunur', async () => {
    mixed()
    const page = await mountPage({ path: '/silinen-kayitlar?tur=tumu' })
    await selectAll(page)
    await page.wrapper.get('[data-action="bulk-purge"]').trigger('click')
    const body = confirm.current.value!.options.body as string[]
    expect(body).toContain('Bu işlem geri alınamaz.')
    expect(body).toContain('Görevlerin dosyaları da silinir.')
    expect(body).toContain('Hesaplar şirket genelinde kalıcı silinir.')
    await accept()
    const order = requests
      .filter((r) => r.method === 'POST' && r.path.endsWith('/purge'))
      .map((r) => r.path.split('/').at(-2))
    expect(order).toEqual(['files', 'subtasks', 'work-items', 'accounts'])
  })

  it('kısmi başarısızlık özeti doğru kind:id satırını adıyla gösterir; başarısız satır seçili kalır', async () => {
    world.records = [
      [record('files', '7', { name: 'Plan.pdf' }), record('subtasks', '7', { name: 'Plan işi' })],
    ]
    world.files = [[file('7')]]
    world.subtasks = [[subtask('7')]]
    world.itemFailures.set('7', 'records.work_item_deleted')
    const page = await mountPage({ path: '/silinen-kayitlar?tur=tumu' })
    await selectAll(page)
    await page.wrapper.get('[data-action="bulk-restore"]').trigger('click')
    await accept()
    const summary = page.wrapper.get('[data-testid="dr-batch-summary"]')
    expect(summary.get('[data-failed-id="files:7"]').text()).toContain('Plan.pdf')
    expect(summary.get('[data-failed-id="subtasks:7"]').text()).toContain('Plan işi')
    expect(page.wrapper.get('[data-testid="dr-bulk"] [role="status"]').text()).toBe(
      '2 kayıt seçildi',
    )
  })
})

describe('tekil kalıcı silme: birleşik listeden', () => {
  it('görev satırı dosya sayısı taşımaz: sayı uydurulmaz, genel kaskad uyarısı verilir', async () => {
    world.records = [[record('tasks', 'w9', { name: 'Eski görev' })]]
    world.tasks = [[task('w9')]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=tumu' })
    await row(page, 'tasks:w9').get('[data-action="purge"]').trigger('click')
    const body = confirm.current.value!.options.body as string[]
    expect(body).toContain('Bu işlem geri alınamaz.')
    expect(body).toContain('Görevin dosyaları da silinir.')
    expect(body.join(' ')).not.toMatch(/\d+ dosya/)
    await accept()
    expect(sent('/v1/admin/permanent/work-items/w9', 'DELETE')).toHaveLength(1)
  })

  it('çocuk satır kendi ucuna gider; yetkisiz ya da başka program yanıtı sunucu kodunu taşır', async () => {
    world.records = [[record('meeting_notes', 'n1', { name: 'Toplantı özeti' })]]
    world.meetingNotes = [[meetingNote('n1')]]
    const page = await mountPage({ path: '/silinen-kayitlar?tur=tumu' })
    await row(page, 'meeting_notes:n1').get('[data-action="purge"]').trigger('click')
    await accept()
    const call = sent('/v1/admin/permanent/meeting-notes/n1', 'DELETE')[0]!
    expect(call.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(call.headers.get('X-Requested-With')).toBeTruthy()
    expect(toasts()).toContain('Toplantı özeti kalıcı olarak silindi.')
  })
})
