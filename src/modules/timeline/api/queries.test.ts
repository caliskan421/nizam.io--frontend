import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { authSession } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { purgeScopedQueries } from '@/shared/scope/lifecycle'
import { SessionChangedError } from '@/shared/session/query-session'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  errorEnvelope,
  gantt,
  ganttTask,
  harness,
  http,
  json,
  MEMBER_SCOPE,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../__tests__/harness'
import {
  dependenciesKey,
  useDateChangeRequests,
  useDependencies,
  useGantt,
  useMyDateChangeRequests,
} from './queries'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetHarness()
  authSession.clear()
})
afterAll(() => server.close())

const ADMIN_GANTT = '/v1/work-items/gantt/admin'
const COORD_GANTT = '/v1/work-items/gantt'
const MEMBER_GANTT = '/v1/work-items/gantt/mine'

describe('useGantt — üç yüz, kapsamdan türetilir', () => {
  it('Admin: adminGantt (S2) — yalnız program başlığı, overdue parametresi yok', async () => {
    server.use(http.get(`${ORIGIN}${ADMIN_GANTT}`, () => json(gantt())))
    const h = harness(ADMIN_SCOPE)
    const g = h.run(() => useGantt())
    await g.query.suspense()

    expect(g.face.value).toBe('admin')
    const [req] = sent('GET', ADMIN_GANTT)
    expect(sent('GET', ADMIN_GANTT)).toHaveLength(1)
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBeNull()
    expect(req!.query.has('overdue')).toBe(false)
    expect(g.tasks.value.map((t) => t.work_item_id)).toEqual(['w1'])
    expect(g.ceiling.value).toBe(false)
    // Anahtar §6 fabrikasından: kapsamlı `gantt` + yüz.
    expect(
      h.queryClient.getQueryData(queryKeys.gantt.face(h.store.snapshot, 'admin')),
    ).toBeDefined()
  })

  it('Koordinatör: coordinatorGantt (S3) — program + seçili birim başlığı', async () => {
    server.use(http.get(`${ORIGIN}${COORD_GANTT}`, () => json(gantt())))
    const h = harness(COORD_SCOPE)
    const g = h.run(() => useGantt())
    await g.query.suspense()

    expect(g.face.value).toBe('coordinator')
    const [req] = sent('GET', COORD_GANTT)
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(sent('GET', ADMIN_GANTT)).toHaveLength(0)
    expect(sent('GET', MEMBER_GANTT)).toHaveLength(0)
  })

  it('Üye: memberGantt (S3) — program + birim; bağlar gelir', async () => {
    server.use(
      http.get(`${ORIGIN}${MEMBER_GANTT}`, () =>
        json(
          gantt({
            links: [{ dependency_id: 'l1', source: 'w1', target: 'w2', cross_department: false }],
          }),
        ),
      ),
    )
    const h = harness(MEMBER_SCOPE)
    const g = h.run(() => useGantt())
    await g.query.suspense()

    expect(g.face.value).toBe('member')
    const [req] = sent('GET', MEMBER_GANTT)
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(g.links.value).toHaveLength(1)
  })

  it('birleşik rol (yönetici + koordinatör) Koordinatör merceğinde koordinatör yüzünü okur', async () => {
    // Yüz mercekten gelir; yönetici yetkisi `capabilities.ts`'te ayrıca korunur (P1).
    server.use(http.get(`${ORIGIN}${COORD_GANTT}`, () => json(gantt())))
    const h = harness(COORD_SCOPE)
    const g = h.run(() => useGantt())
    await g.query.suspense()
    expect(sent('GET', COORD_GANTT)).toHaveLength(1)
    expect(sent('GET', ADMIN_GANTT)).toHaveLength(0)
  })

  it('birim yoksa (Koordinatör merceği, birim seçilmemiş) istek atılmaz', async () => {
    const h = harness({ programId: 'p1', lens: 'coordinator', departmentId: null })
    const g = h.run(() => useGantt())
    await h.flush()
    expect(g.face.value).toBeNull()
    expect(g.query.fetchStatus.value).toBe('idle')
    expect(sent('GET', COORD_GANTT)).toHaveLength(0)
  })

  it('tam 200 kalem: tavan uyarısı; 199: yok', async () => {
    const tasks = (n: number) =>
      Array.from({ length: n }, (_, i) => ganttTask({ work_item_id: `w${i}` }))
    server.use(http.get(`${ORIGIN}${ADMIN_GANTT}`, () => json(gantt({ tasks: tasks(200) }))))
    const h = harness(ADMIN_SCOPE)
    const g = h.run(() => useGantt())
    await g.query.suspense()
    expect(g.tasks.value).toHaveLength(200)
    expect(g.ceiling.value).toBe(true)

    server.use(http.get(`${ORIGIN}${ADMIN_GANTT}`, () => json(gantt({ tasks: tasks(199) }))))
    await g.query.refetch()
    expect(g.ceiling.value).toBe(false)
  })

  it('403 work.not_authorized bir hükümdür: tekrar edilmez', async () => {
    server.use(http.get(`${ORIGIN}${ADMIN_GANTT}`, () => errorEnvelope('work.not_authorized', 403)))
    const h = harness(ADMIN_SCOPE)
    const g = h.run(() => useGantt())
    await vi.waitFor(() => expect(g.query.isError.value).toBe(true))
    expect(sent('GET', ADMIN_GANTT)).toHaveLength(1)
  })

  it('kapsam değişince Gantt sorgusu iptal edilip önbellekten düşer (K2, Ö-08)', async () => {
    server.use(http.get(`${ORIGIN}${ADMIN_GANTT}`, () => json(gantt())))
    const h = harness(ADMIN_SCOPE)
    const g = h.run(() => useGantt())
    await g.query.suspense()
    const key = queryKeys.gantt.face(h.store.snapshot, 'admin')
    expect(h.queryClient.getQueryData(key)).toBeDefined()

    h.store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    purgeScopedQueries(h.queryClient)
    expect(h.queryClient.getQueryData(key)).toBeUndefined()
    expect(h.queryClient.getQueryState(key)).toBeUndefined()
  })

  it('oturum değişimi: eski oturumun geç Gantt yanıtı yeni oturumun önbelleğine yazılmaz (Ö-08)', async () => {
    const login = (accountId: string) => ({
      token: `tok-${accountId}`,
      account_id: accountId,
      expires_at: Math.floor(Date.now() / 1000) + 900,
      force_password_change: false,
    })
    authSession.establish(login('acc-1'))
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.get(`${ORIGIN}${ADMIN_GANTT}`, async () => {
        await gate
        return json(gantt())
      }),
    )
    const h = harness(ADMIN_SCOPE)
    const g = h.run(() => useGantt())
    await vi.waitFor(() => expect(sent('GET', ADMIN_GANTT)).toHaveLength(1))
    authSession.clear()
    authSession.establish(login('acc-2'))
    release()
    await vi.waitFor(() => expect(g.query.isFetching.value).toBe(false))

    const key = queryKeys.gantt.face(h.store.snapshot, 'admin')
    expect(h.queryClient.getQueryData(key)).toBeUndefined()
    expect(h.queryClient.getQueryState(key)?.error).toBeInstanceOf(SessionChangedError)
  })
})

describe('tarih talebi okumaları — scoped([date-requests, filtre])', () => {
  const list = { requests: [], total: 0 }

  it('listDateChangeRequests S1: kapsam başlığı yok, status=pending; yalnız yönetici olgusuyla', async () => {
    server.use(http.get(`${ORIGIN}/v1/date-change-requests`, () => json(list)))
    const h = harness(ADMIN_SCOPE)
    const q = h.run(() => useDateChangeRequests({ status: 'pending' }))
    await q.suspense()
    const [req] = sent('GET', '/v1/date-change-requests')
    expect(req!.query.get('status')).toBe('pending')
    expect(
      h.queryClient.getQueryData(
        queryKeys.dateRequests.list(h.store.snapshot, { status: 'pending' }),
      ),
    ).toEqual(list)
  })

  it('enabled=false (yönetici değil): istek yok', async () => {
    const h = harness(COORD_SCOPE)
    const q = h.run(() => useDateChangeRequests({ status: 'pending' }, false))
    await h.flush()
    expect(q.fetchStatus.value).toBe('idle')
    expect(sent('GET', '/v1/date-change-requests')).toHaveLength(0)
  })

  it('myDateChangeRequests S3: görevin kendi program + birim başlıkları', async () => {
    server.use(http.get(`${ORIGIN}/v1/date-change-requests/mine`, () => json(list)))
    const h = harness(COORD_SCOPE)
    const q = h.run(() => useMyDateChangeRequests({ programId: 'p1', departmentId: 'd1' }))
    await q.suspense()
    const [req] = sent('GET', '/v1/date-change-requests/mine')
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d1')
  })
})

describe('useDependencies — görevin kendi kapsamı', () => {
  it('listDependencies S3: başlıklar hedeften; üyede enabled=false → istek yok', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/work-items/w1/dependencies`, () =>
        json({ dependencies: [], dependents: [] }),
      ),
    )
    const h = harness(COORD_SCOPE)
    const target = { programId: 'p1', departmentId: 'd2' }
    const q = h.run(() => useDependencies('w1', target))
    await q.suspense()
    const [req] = sent('GET', '/v1/work-items/w1/dependencies')
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(h.queryClient.getQueryData(dependenciesKey(h.store.snapshot, 'w1'))).toBeDefined()

    const off = h.run(() => useDependencies('w2', target, false))
    await h.flush()
    expect(off.fetchStatus.value).toBe('idle')
    expect(sent('GET', '/v1/work-items/w2/dependencies')).toHaveLength(0)
  })
})
