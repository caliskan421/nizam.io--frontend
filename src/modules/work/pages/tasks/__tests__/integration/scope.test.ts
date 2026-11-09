// W48 madde 5 — liste açıkken kapsam (birim / mercek / program) değişimi GERÇEK bileşenlerle:
// panel kapanır, `gorev`/`koordinatorluk` düşer, `durum`/`q`/`sirala`/`talep` kalır; eski
// kapsamın sorguları iptal; açık pencereler (yeni görev, yükleme) kapanır; eski kapsamla
// istek ve yanlış "bulunamadı" bildirimi yok.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { requests, sent, server, workItem } from '../../../../model/__tests__/harness'
import type { StandingFixture } from '../page-harness'
import {
  backendHandlers,
  body,
  button,
  fakeWork,
  ME,
  mountApp,
  panelTab,
  settle,
  unmountApps,
} from './harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => unmountApps())
afterAll(() => server.close())

/** İki birimde koordinatör + şirket yöneticisi (mercek değişimi için). */
const WHO: StandingFixture = {
  companyAdmin: true,
  rows: [
    { department_id: 'd1', role: 'koordinator' },
    { department_id: 'd2', role: 'koordinator' },
  ],
}
/** Yükleme yetkisi için yöneticiliksiz iki birim koordinatörü (s.148: yöneticilik baskın). */
const COORD2: StandingFixture = { ...WHO, companyAdmin: false }
const MEMBERS = [
  { account_id: ME, full_name: 'Ayşe', membership_id: 'm1', role: 'uye', status: 'active' },
]
const D1 = { programId: 'p1', lens: 'coordinator', departmentId: 'd1' } as const
const KEPT = { durum: 'devam_ediyor', q: 'a', sirala: 'bitis:artan' }
const OPEN = '/gorevler?durum=devam_ediyor&q=a&sirala=bitis:artan&gorev=w1'

function items() {
  return [
    workItem({ work_item_id: 'w1', title: 'Asfalt', department_id: 'd1', status: 'devam_ediyor' }),
    workItem({ work_item_id: 'w2', title: 'Plan', department_id: 'd2', status: 'devam_ediyor' }),
  ]
}

function toastText(): string {
  return body()
    .findAll('.t-toast, [role="status"], [role="alert"]')
    .map((t) => t.text())
    .join(' ')
}

/** Kapsam değişiminden sonra eski görev kimliğine giden okuma (yanlış kapsamla) yok. */
function staleItemReads(since: number) {
  return requests.slice(since).filter((r) => r.path.startsWith('/v1/work-items/w1'))
}

describe('W48 · kapsam değişimi (gerçek bileşenler)', () => {
  it('birim değişimi: panel + yükleme penceresi kapanır, süzgeçler korunur, eski kapsam okuması yok', async () => {
    server.use(...backendHandlers(COORD2, fakeWork(items(), MEMBERS)))
    const ctx = await mountApp(D1, OPEN)
    panelTab('Dosyalar').click()
    await settle(ctx.queryClient)
    body().find<HTMLButtonElement>('[data-testid="files-upload"]').element.click()
    await settle(ctx.queryClient)
    expect(body().find('[role="dialog"]').exists()).toBe(true)
    const since = requests.length

    ctx.store.setDepartment('d2')
    await settle(ctx.queryClient)

    expect(ctx.router.currentRoute.value.query).toEqual(KEPT)
    expect(body().find('[data-testid="work-detail"]').exists()).toBe(false)
    expect(body().find('[role="dialog"]').exists()).toBe(false)
    expect(staleItemReads(since)).toEqual([])
    expect(toastText()).toBe('')
    const list = sent('GET', '/v1/program/work-items').at(-1)!
    expect(list.query.get('department_id')).toBe('d2')
    expect(body().find('[data-work-item="w2"]').exists()).toBe(true)
  })

  it('mercek değişimi (Admin): koordinatorluk ve gorev düşer, talep kalır; eski liste sorgusu düşer', async () => {
    server.use(...backendHandlers(WHO, fakeWork(items(), MEMBERS)))
    const ctx = await mountApp(D1, `${OPEN}&talep=1`)
    const since = requests.length

    ctx.store.setLens('admin')
    await settle(ctx.queryClient)

    expect(ctx.router.currentRoute.value.query).toEqual({ ...KEPT, talep: '1' })
    expect(body().find('[data-testid="work-detail"]').exists()).toBe(false)
    expect(staleItemReads(since)).toEqual([])
    expect(toastText()).toBe('')
    const keys = ctx.queryClient
      .getQueryCache()
      .getAll()
      .map((q) => JSON.stringify(q.queryKey))
    expect(keys.some((k) => k.includes('"d1"') && k.includes('work-items'))).toBe(false)
  })

  it('program değişimi: açık "Yeni görev" penceresi kapanır', async () => {
    server.use(...backendHandlers(WHO, fakeWork(items(), MEMBERS)))
    const ctx = await mountApp({ programId: 'p1', lens: 'admin', departmentId: null })
    button('Yeni görev').click()
    await settle(ctx.queryClient)
    expect(body().find('[role="dialog"]').exists()).toBe(true)

    ctx.store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await settle(ctx.queryClient)

    expect(body().find('[role="dialog"]').exists()).toBe(false)
    expect(sent('POST', '/v1/work-items')).toHaveLength(0)
  })
})
