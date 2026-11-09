// W48 madde 3 — olay zinciri GERÇEK bileşenlerle (taslak yok): yeni görev, kanıt isteği →
// yükleme, silme, alt görev başlığı → panel sekmesi, ortak sorgu anahtarları (tek GET).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { isValidIdempotencyKey } from '@/shared/http/mutation'

import { sent, server, subtask, workItem } from '../../../../model/__tests__/harness'
import type { WorkItemDetail } from '../../../../model/types'
import { stubBrowserClone } from '../../../../components/files/__tests__/support'
import type { StandingFixture } from '../page-harness'
import {
  backendHandlers,
  body,
  button,
  fakeWork,
  ME,
  mountApp,
  panelTab,
  setValue,
  settle,
  unmountApps,
} from './harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => {
  stubBrowserClone()
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => unmountApps())
afterAll(() => server.close())

const COORD: StandingFixture = {
  companyAdmin: false,
  rows: [{ department_id: 'd1', role: 'koordinator' }],
}
const COORD_SCOPE = { programId: 'p1', lens: 'coordinator', departmentId: 'd1' } as const
const MEMBERS = [
  { account_id: ME, full_name: 'Ayşe', membership_id: 'm1', role: 'uye', status: 'active' },
]

function rows(): WorkItemDetail[] {
  return [
    workItem({ work_item_id: 'w1', title: 'Asfalt', department_id: 'd1', status: 'devam_ediyor' }),
    workItem({ work_item_id: 'w2', title: 'Plan', department_id: 'd1' }),
  ]
}

const listGets = () => sent('GET', '/v1/program/work-items').length
const panel = () => body().find('[data-testid="work-detail"]')

describe('W48 · olay zinciri (gerçek bileşenler)', () => {
  it('Yeni görev → created: liste yeniden okunur, yeni görev panelde açılır (URL gorev)', async () => {
    const db = fakeWork(rows(), MEMBERS)
    server.use(...backendHandlers(COORD, db))
    const ctx = await mountApp(COORD_SCOPE)
    const before = listGets()

    button('Yeni görev').click()
    await settle(ctx.queryClient)
    setValue('[name="title"]', 'Yeni rapor')
    setValue('[name="startOn"]', '2026-11-10')
    setValue('[name="endOn"]', '2026-11-12')
    await settle(ctx.queryClient)
    body().find<HTMLButtonElement>('[data-testid="wf-submit"]').element.click()
    await vi.waitFor(() => expect(sent('POST', '/v1/work-items')).toHaveLength(1))
    await settle(ctx.queryClient)

    // Madde 4: vee-validate'in reaktif değerleri düz JSON gövdeye iner (vekil sızmaz).
    const [post] = sent('POST', '/v1/work-items')
    expect(post!.body).toMatchObject({
      title: 'Yeni rapor',
      start_on: '2026-11-10',
      end_on: '2026-11-12',
      priority: 'orta',
      completion_evidence_required: true,
    })
    expect(isValidIdempotencyKey(post!.headers.get('Idempotency-Key') ?? '')).toBe(true)
    expect(post!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(listGets()).toBeGreaterThan(before)
    expect(ctx.router.currentRoute.value.query).toEqual({ gorev: 'w-new-3' })
    expect(body().find('[role="dialog"]').exists()).toBe(false)
    expect(panel().text()).toContain('Yeni rapor')
    expect(body().find('[data-work-item="w-new-3"]').classes()).toContain('rp-sel')
  })

  it('StatusMenu requestEvidence → yükleme penceresi → uploaded: dosya sayacı yenilenir, durum değişmez', async () => {
    const db = fakeWork(rows(), MEMBERS)
    server.use(...backendHandlers(COORD, db))
    const ctx = await mountApp(COORD_SCOPE, '/gorevler?gorev=w1')
    expect(panelTab('Dosyalar').textContent).toContain('0')

    body().find<HTMLButtonElement>('[data-testid="wf-status-trigger"]').element.click()
    await settle(ctx.queryClient)
    body().find<HTMLElement>('[data-to="tamamlandi"]').element.click()
    await settle(ctx.queryClient)
    expect(sent('POST', '/v1/work-items/w1/transitions')).toHaveLength(1)
    const dialog = body().find('[role="dialog"]')
    expect(dialog.exists()).toBe(true)

    const input = body().find('[data-testid="upload-file"]')
    Object.defineProperty(input.element, 'files', {
      value: [new File(['abc'], 'kanit.pdf', { type: 'application/pdf' })],
      configurable: true,
    })
    await input.trigger('change')
    setValue('[data-testid="upload-tag"]', 'sonuc')
    await body().find('[role="dialog"] form').trigger('submit')
    await settle(ctx.queryClient)

    // Madde 4: `File` reaktif pencere durumundan çok parçalı gövdeye aynen gider.
    const uploads = sent('POST', '/v1/work-items/w1/files')
    expect(uploads).toHaveLength(1)
    expect(uploads[0]!.headers.get('content-type')).toContain('multipart/form-data')
    expect(uploads[0]!.query.get('tag')).toBe('sonuc')
    expect(isValidIdempotencyKey(uploads[0]!.headers.get('Idempotency-Key') ?? '')).toBe(true)
    expect(body().find('[role="dialog"]').exists()).toBe(false)
    expect(panelTab('Dosyalar').textContent).toContain('1')
    panelTab('Dosyalar').click()
    await settle(ctx.queryClient)
    expect(body().find('[data-testid="files-list"]').text()).toContain('kanit.pdf')
    expect(sent('POST', '/v1/work-items/w1/transitions')).toHaveLength(1)
    expect(db.items[0]!.status).toBe('devam_ediyor')
    expect(body().find('[data-testid="wf-status-trigger"]').text()).toContain('Devam ediyor')
  })

  it('DeleteTaskAction deleted → panel kapanır (close deleted), URL gorev düşer, liste yenilenir', async () => {
    const db = fakeWork(rows(), MEMBERS)
    server.use(...backendHandlers(COORD, db))
    const ctx = await mountApp(COORD_SCOPE, '/gorevler?gorev=w1')
    const before = listGets()

    body().find<HTMLButtonElement>('[data-testid="wf-delete"]').element.click()
    await settle(ctx.queryClient)
    button('Sil').click()
    await settle(ctx.queryClient)

    expect(sent('DELETE', '/v1/work-items/w1')).toHaveLength(1)
    expect(ctx.router.currentRoute.value.query).toEqual({})
    expect(panel().exists()).toBe(false)
    expect(listGets()).toBeGreaterThan(before)
    expect(body().find('[data-work-item="w1"]').exists()).toBe(false)
    const toasts = body()
      .findAll('[role="status"], [role="alert"]')
      .map((t) => t.text())
    expect(toasts.join(' ')).not.toContain('bulunamadı')
  })

  it('Admin merceğinde silme: satır listeden düşünce "kapsam bilinmiyor" / "bulunamadı" bildirimi yok', async () => {
    const ADMIN: StandingFixture = { companyAdmin: true, rows: [] }
    const db = fakeWork(rows(), MEMBERS)
    server.use(...backendHandlers(ADMIN, db))
    const ctx = await mountApp(
      { programId: 'p1', lens: 'admin', departmentId: null },
      '/gorevler?gorev=w1',
    )

    body().find<HTMLButtonElement>('[data-testid="wf-delete"]').element.click()
    await settle(ctx.queryClient)
    button('Sil').click()
    await settle(ctx.queryClient)

    expect(ctx.router.currentRoute.value.query).toEqual({})
    expect(panel().exists()).toBe(false)
    expect(body().text()).not.toContain('bulunamadı')
    expect(body().text()).not.toContain('kapsam')
    expect(sent('GET', '/v1/work-items/w1').length).toBeGreaterThan(0)
  })

  it('SubtaskBlock openSubtasks → panel Alt görevler sekmesinde; blok ↔ sekme tek GET', async () => {
    const items = rows()
    items[1] = { ...items[1]!, subtask_counts: { total: 1, done: 0 } }
    const db = fakeWork(items, MEMBERS)
    db.subtasks.set('w2', [subtask({ work_item_id: 'w2', title: 'Çizim' })])
    server.use(...backendHandlers(COORD, db))
    const ctx = await mountApp(COORD_SCOPE)

    body().findAll<HTMLButtonElement>('.rp-subtog')[1]!.element.click()
    await settle(ctx.queryClient)
    const block = body().find('[data-testid="subtask-block"]')
    expect(block.text()).toContain('Çizim')
    block.find<HTMLElement>('.rp-stask__title').element.click()
    await settle(ctx.queryClient)

    expect(ctx.router.currentRoute.value.query).toEqual({ gorev: 'w2' })
    expect(panelTab('Alt görevler').getAttribute('aria-selected')).toBe('true')
    expect(body().find('[data-testid="subtask-tab"]').text()).toContain('Çizim')
    expect(sent('GET', '/v1/work-items/w2/subtasks')).toHaveLength(1)
  })

  it('SubtaskFileSlot ↔ FilesTab aynı files anahtarı: tek GET', async () => {
    const items = rows()
    items[0] = { ...items[0]!, subtask_counts: { total: 1, done: 0 } }
    const db = fakeWork(items, MEMBERS)
    db.subtasks.set('w1', [subtask({ work_item_id: 'w1' })])
    server.use(...backendHandlers(COORD, db))
    const ctx = await mountApp(COORD_SCOPE, '/gorevler?gorev=w1')
    body().findAll<HTMLButtonElement>('.rp-subtog')[0]!.element.click()
    await settle(ctx.queryClient)
    panelTab('Dosyalar').click()
    await settle(ctx.queryClient)

    expect(body().find('[data-testid="subtask-file-slot"]').exists()).toBe(true)
    expect(body().find('[data-testid="files-tab"]').exists()).toBe(true)
    expect(sent('GET', '/v1/work-items/w1/files')).toHaveLength(1)
    expect(sent('GET', '/v1/work-items/w1/subtasks')).toHaveLength(1)
  })
})

describe('W48 · madde 1 — panel hedefi (useWorkItemTarget, koordinatörlük süzgeci)', () => {
  it('Admin + koordinatorluk süzgeci: derin bağlantı paneli süzgeçli listenin satırından açar', async () => {
    const ADMIN: StandingFixture = { companyAdmin: true, rows: [] }
    const items = [
      workItem({ work_item_id: 'w1', title: 'Asfalt', department_id: 'd1' }),
      workItem({ work_item_id: 'w2', title: 'Plan', department_id: 'd2' }),
    ]
    server.use(...backendHandlers(ADMIN, fakeWork(items, MEMBERS)))
    const ctx = await mountApp(
      { programId: 'p1', lens: 'admin', departmentId: null },
      '/gorevler?koordinatorluk=d2&gorev=w2',
    )
    expect(ctx.router.currentRoute.value.query).toEqual({ koordinatorluk: 'd2', gorev: 'w2' })
    expect(panel().text()).toContain('Plan')
    const get = sent('GET', '/v1/work-items/w2')
    expect(get).toHaveLength(1)
    expect(get[0]!.headers.get('X-Nizamio-Department')).toBe('d2')
  })
})
