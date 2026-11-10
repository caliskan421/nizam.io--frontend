import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { queryKeys } from '@/shared/http/query-keys'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  harness,
  http,
  json,
  errorEnvelope,
  ORIGIN,
  requests,
  resetHarness,
  sent,
  server,
  workItem,
} from '../model/__tests__/harness'
import {
  useMyProgramDepartments,
  useProgramDepartments,
  useWorkItem,
  useWorkItemCounts,
  useWorkItemFiles,
  useWorkItemList,
  useWorkItemNotes,
  useWorkItemSubtasks,
  useWorkItemTarget,
} from './queries'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const LIST = '/v1/program/work-items'
const target = { programId: 'p1', departmentId: 'd2' }

describe('useWorkItemList — listProgramWorkItems (imleçli sonsuz sorgu)', () => {
  it('Admin, süzgeçsiz: TEK istek, S2 başlığı, limit 200, department_id yok; next_cursor dolu → daha fazla', async () => {
    server.use(
      http.get(`${ORIGIN}${LIST}`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor')
        return cursor
          ? json({ items: [workItem({ work_item_id: 'w2' })] })
          : json({ items: [workItem()], next_cursor: 'c1' })
      }),
    )
    const h = harness(ADMIN_SCOPE)
    const list = h.run(() => useWorkItemList(null))
    await list.query.suspense()

    expect(sent('GET', LIST)).toHaveLength(1)
    const [first] = sent('GET', LIST)
    expect(first!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(first!.headers.get('X-Nizamio-Department')).toBeNull()
    expect(first!.query.get('limit')).toBe('200')
    expect(first!.query.has('department_id')).toBe(false)
    expect(first!.query.has('cursor')).toBe(false)
    expect(list.items.value.map((i) => i.work_item_id)).toEqual(['w1'])
    expect(list.query.hasNextPage.value).toBe(true)
    expect(list.complete.value).toBe(false)

    // "Daha fazla yükle": aynı uç, aynı süzgeç, imleçle (fan-out değil, §9).
    await list.query.fetchNextPage()
    const pages = sent('GET', LIST)
    expect(pages).toHaveLength(2)
    expect(pages[1]!.query.get('cursor')).toBe('c1')
    expect(pages[1]!.query.get('limit')).toBe('200')
    expect(list.items.value.map((i) => i.work_item_id)).toEqual(['w1', 'w2'])
    expect(list.query.hasNextPage.value).toBe(false)
    expect(list.complete.value).toBe(true)
  })

  it('next_cursor boş: ilk sayfada küme tam (sayaçlar kesin)', async () => {
    server.use(http.get(`${ORIGIN}${LIST}`, () => json({ items: [workItem()] })))
    const h = harness(ADMIN_SCOPE)
    const list = h.run(() => useWorkItemList(null))
    await list.query.suspense()
    expect(list.complete.value).toBe(true)
    expect(list.query.hasNextPage.value).toBe(false)
  })

  it('tek department_id gider (fan-out yok); anahtar §6 fabrikasından', async () => {
    server.use(http.get(`${ORIGIN}${LIST}`, () => json({ items: [] })))
    const h = harness(COORD_SCOPE)
    const list = h.run(() => useWorkItemList('d1'))
    await list.query.suspense()
    const calls = sent('GET', LIST)
    expect(calls).toHaveLength(1)
    expect(calls[0]!.query.getAll('department_id')).toEqual(['d1'])
    const key = queryKeys.workItems.list(h.store.snapshot, { department: 'd1' })
    expect(h.queryClient.getQueryData(key)).toBeDefined()
  })

  it('program seçili değilse istek atılmaz', async () => {
    const h = harness({ programId: null, lens: null, departmentId: null })
    h.run(() => useWorkItemList(null))
    await h.flush()
    expect(requests).toHaveLength(0)
  })

  it('403 membership_required tekrar edilmez (hüküm)', async () => {
    server.use(
      http.get(`${ORIGIN}${LIST}`, () => errorEnvelope('organization.membership_required', 403)),
    )
    const h = harness(COORD_SCOPE)
    const list = h.run(() => useWorkItemList('d1'))
    await list.query.suspense().catch(() => undefined)
    expect(list.query.error.value).toMatchObject({ code: 'organization.membership_required' })
    expect(sent('GET', LIST)).toHaveLength(1)
  })
})

describe('useWorkItemList — sunucu atanan süzgeci (BE-038)', () => {
  it('assignee_account_id tekrarlı ve tekrarsız/sıralı gider; anahtar süzgeçle ayrışır', async () => {
    server.use(http.get(`${ORIGIN}${LIST}`, () => json({ items: [] })))
    const h = harness(ADMIN_SCOPE)
    const list = h.run(() => useWorkItemList(null, ['acc-2', 'acc-1', 'acc-2', '']))
    await list.query.suspense()
    const [call] = sent('GET', LIST)
    expect(call!.query.getAll('assignee_account_id')).toEqual(['acc-1', 'acc-2'])
    const key = queryKeys.workItems.list(h.store.snapshot, {
      department: null,
      assignees: ['acc-1', 'acc-2'],
    })
    expect(h.queryClient.getQueryData(key)).toBeDefined()
    // Süzgeçsiz anahtar etkilenmez (boş liste anahtara girmez).
    expect(
      h.queryClient.getQueryData(queryKeys.workItems.list(h.store.snapshot, { department: null })),
    ).toBeUndefined()
  })

  it('sonraki sayfa aynı süzgeçleri tekrar gönderir', async () => {
    server.use(
      http.get(`${ORIGIN}${LIST}`, ({ request }) =>
        new URL(request.url).searchParams.get('cursor')
          ? json({ items: [] })
          : json({ items: [workItem()], next_cursor: 'c1' }),
      ),
    )
    const h = harness(COORD_SCOPE)
    const list = h.run(() => useWorkItemList('d1', ['acc-1']))
    await list.query.suspense()
    await list.query.fetchNextPage()
    const pages = sent('GET', LIST)
    expect(pages.map((p) => p.query.getAll('assignee_account_id'))).toEqual([['acc-1'], ['acc-1']])
    expect(pages.map((p) => p.query.get('department_id'))).toEqual(['d1', 'd1'])
  })

  it('en çok 50 kimlik gider (sözleşme sınırı)', async () => {
    server.use(http.get(`${ORIGIN}${LIST}`, () => json({ items: [] })))
    const h = harness(ADMIN_SCOPE)
    const ids = Array.from({ length: 60 }, (_, i) => `a${String(i).padStart(2, '0')}`)
    const list = h.run(() => useWorkItemList(null, ids))
    await list.query.suspense()
    expect(sent('GET', LIST)[0]!.query.getAll('assignee_account_id')).toHaveLength(50)
  })
})

describe('useWorkItemCounts — countProgramWorkItems (BE-003)', () => {
  const COUNTS = '/v1/program/work-items/counts'
  const body = {
    total: 263,
    by_status: {
      baslanmadi: 100,
      devam_ediyor: 60,
      onaya_sunuldu: 3,
      iade_edildi: 1,
      tamamlandi: 99,
    },
    overdue: 12,
    pending_date_requests: 4,
  }

  it('tek istek: S2 başlığı, limit/cursor yok; departman + atanan süzgeci listeyle aynı', async () => {
    server.use(http.get(`${ORIGIN}${COUNTS}`, () => json(body)))
    const h = harness(COORD_SCOPE)
    const counts = h.run(() => useWorkItemCounts('d1', ['acc-1']))
    await counts.suspense()
    const calls = sent('GET', COUNTS)
    expect(calls).toHaveLength(1)
    expect(calls[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(calls[0]!.headers.get('X-Nizamio-Department')).toBeNull()
    expect(calls[0]!.query.get('department_id')).toBe('d1')
    expect(calls[0]!.query.getAll('assignee_account_id')).toEqual(['acc-1'])
    expect(calls[0]!.query.has('limit')).toBe(false)
    expect(calls[0]!.query.has('cursor')).toBe(false)
    expect(counts.data.value).toEqual(body)
    const key = queryKeys.workItems.counts(h.store.snapshot, {
      department: 'd1',
      assignees: ['acc-1'],
    })
    expect(h.queryClient.getQueryData(key)).toEqual(body)
  })

  it('süzgeçsiz Admin: ek parametre yok; program yokken ve kapalıyken istek yok', async () => {
    server.use(http.get(`${ORIGIN}${COUNTS}`, () => json(body)))
    const h = harness(ADMIN_SCOPE)
    const counts = h.run(() => useWorkItemCounts(null))
    await counts.suspense()
    expect([...sent('GET', COUNTS)[0]!.query.keys()]).toEqual([])
    const off = harness({ programId: null, lens: null, departmentId: null })
    off.run(() => useWorkItemCounts(null))
    const closed = harness(ADMIN_SCOPE)
    closed.run(() => useWorkItemCounts(null, undefined, false))
    await closed.flush()
    expect(sent('GET', COUNTS)).toHaveLength(1)
  })

  it('403 membership_required tekrar edilmez (hüküm)', async () => {
    server.use(
      http.get(`${ORIGIN}${COUNTS}`, () => errorEnvelope('organization.membership_required', 403)),
    )
    const h = harness(COORD_SCOPE)
    const counts = h.run(() => useWorkItemCounts('d1'))
    await counts.suspense().catch(() => undefined)
    expect(counts.error.value).toMatchObject({ code: 'organization.membership_required' })
    expect(sent('GET', COUNTS)).toHaveLength(1)
  })
})

describe('ayrıntı uçları — görevin kendi kapsamı (S3)', () => {
  it.each([
    ['item', '/v1/work-items/w1', useWorkItem, workItem({ description: 'x' })],
    ['subtasks', '/v1/work-items/w1/subtasks', useWorkItemSubtasks, { subtasks: [], total: 0 }],
    ['files', '/v1/work-items/w1/files', useWorkItemFiles, { files: [] }],
    ['notes', '/v1/work-items/w1/notes', useWorkItemNotes, { notes: [], total: 0 }],
  ] as const)(
    '%s: Admin merceğinde bile görevin departman başlığı',
    async (part, path, use, body) => {
      server.use(http.get(`${ORIGIN}${path}`, () => json(body)))
      const h = harness(ADMIN_SCOPE)
      const query = h.run(() => use('w1', target))
      await query.suspense()
      const [req] = sent('GET', path)
      expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
      expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
      expect(query.data.value).toEqual(body)
      // Anahtar §6 fabrikasından; dosyalar 03/03c/06 ortak anahtarı.
      expect(h.queryClient.getQueryData(queryKeys.workItems[part](h.store.snapshot, 'w1'))).toEqual(
        body,
      )
    },
  )

  it('hedef bilinmiyorsa istek yok', async () => {
    const h = harness(ADMIN_SCOPE)
    h.run(() => useWorkItem('w1', null))
    await h.flush()
    expect(requests).toHaveLength(0)
  })

  it('404 work.item_not_found hata olarak döner, tekrar yok', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/work-items/w1`, () => errorEnvelope('work.item_not_found', 404)),
    )
    const h = harness(ADMIN_SCOPE)
    const query = h.run(() => useWorkItem('w1', target))
    await query.suspense().catch(() => undefined)
    expect(query.error.value).toMatchObject({ code: 'work.item_not_found', status: 404 })
    expect(sent('GET', '/v1/work-items/w1')).toHaveLength(1)
  })
})

describe('useWorkItemTarget — liste verisine reaktif', () => {
  it('önce null; liste SONRADAN yüklenince hedef dolar; kendisi istek atmaz', async () => {
    server.use(http.get(`${ORIGIN}${LIST}`, () => json({ items: [workItem()] })))
    const h = harness(ADMIN_SCOPE)
    const { known, unknown } = h.run(() => ({
      known: useWorkItemTarget('w1'),
      unknown: useWorkItemTarget('w9'),
    }))
    await h.flush()
    expect(known.value).toBeNull()
    expect(sent('GET', LIST)).toHaveLength(0)

    const list = h.run(() => useWorkItemList(null))
    await list.query.suspense()
    expect(sent('GET', LIST)).toHaveLength(1)
    expect(known.value).toEqual(target)
    expect(unknown.value).toBeNull()
  })

  it('"daha fazla yükle" ile gelen satır da hedefi doldurur; süzgeçli liste anahtarı verilebilir', async () => {
    server.use(
      http.get(`${ORIGIN}${LIST}`, ({ request }) =>
        new URL(request.url).searchParams.get('cursor')
          ? json({ items: [workItem({ work_item_id: 'w2', department_id: 'd5' })] })
          : json({ items: [workItem()], next_cursor: 'c1' }),
      ),
    )
    const h = harness(ADMIN_SCOPE)
    const second = h.run(() => useWorkItemTarget('w2', 'd2'))
    const list = h.run(() => useWorkItemList('d2'))
    await list.query.suspense()
    expect(second.value).toBeNull()
    await list.query.fetchNextPage()
    expect(second.value).toEqual({ programId: 'p1', departmentId: 'd5' })
  })

  it('kapsam değişince sıfırlanır (yeni anahtar, eski satır kullanılmaz)', async () => {
    server.use(http.get(`${ORIGIN}${LIST}`, () => json({ items: [workItem()] })))
    const h = harness(ADMIN_SCOPE)
    const { resolved, list } = h.run(() => ({
      resolved: useWorkItemTarget('w1'),
      list: useWorkItemList(null),
    }))
    await list.query.suspense()
    expect(resolved.value).toEqual(target)
    h.store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    expect(resolved.value).toBeNull()
  })

  it('Koordinatör merceğinde liste dışı görev → seçili birim', () => {
    const h = harness(COORD_SCOPE)
    const resolved = h.run(() => useWorkItemTarget('w9'))
    expect(resolved.value).toEqual({ programId: 'p1', departmentId: 'd1' })
  })
})

describe('departman seçenekleri', () => {
  it('listProgramDepartments: S2, ad/kod sözlüğü, kapsamlı anahtar', async () => {
    const departments = [{ department_id: 'd2', display_name: 'Yazılım', code: 'YZL' }]
    server.use(http.get(`${ORIGIN}/v1/program/departments`, () => json({ departments })))
    const h = harness(ADMIN_SCOPE)
    const result = h.run(() => useProgramDepartments())
    await result.query.suspense()
    const [req] = sent('GET', '/v1/program/departments')
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBeNull()
    expect(result.byId.value.get('d2')?.code).toBe('YZL')
    expect(h.queryClient.getQueryData(queryKeys.departments.all(h.store.snapshot))).toEqual({
      departments,
    })
  })

  it('myDepartments: seçili programın satırları (tekil), standing ile aynı anahtar', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/me/departments`, () =>
        json({
          departments: [
            {
              program_id: 'p1',
              program_name: 'P',
              department_id: 'd1',
              display_name: 'A',
              role: 'koordinator',
            },
            {
              program_id: 'p1',
              program_name: 'P',
              department_id: 'd1',
              display_name: 'A',
              role: 'uye',
            },
            {
              program_id: 'p2',
              program_name: 'Q',
              department_id: 'd3',
              display_name: 'C',
              role: 'uye',
            },
          ],
        }),
      ),
    )
    const h = harness(COORD_SCOPE)
    const result = h.run(() => useMyProgramDepartments())
    await result.query.suspense()
    expect(result.departments.value).toEqual([{ departmentId: 'd1', displayName: 'A' }])
    expect(sent('GET', '/v1/me/departments')[0]!.headers.get('X-Nizamio-Program')).toBeNull()
    expect(h.queryClient.getQueryData(queryKeys.me.departments())).toBeDefined()
  })
})
