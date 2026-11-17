import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { createApp, defineComponent, ref } from 'vue'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { queryKeys } from '@/shared/http/query-keys'
import { purgeScopedQueries } from '@/shared/scope/lifecycle'
import { useScopeStore } from '@/shared/scope/store'

import {
  useDeletedAgendaItems,
  useDeletedFiles,
  useDeletedMeetingNotes,
  useDeletedSubtasks,
  useDeletedTaskNotes,
} from '../api/queries-child'
import { UNIFIED_PAGE_LIMIT, useDeletedRecords } from '../api/unified'
import type { UnifiedQuery } from '../model/lifecycle'

const ORIGIN = 'http://localhost'
const server = setupServer()
const seen: Array<{ path: string; program: string | null; query: URLSearchParams }> = []
server.events.on('request:start', ({ request }) => {
  const url = new URL(request.url)
  seen.push({
    path: url.pathname,
    program: request.headers.get('X-Nizamio-Program'),
    query: url.searchParams,
  })
})
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  seen.length = 0
  server.resetHandlers()
})
afterAll(() => server.close())

function setup(program: string | null = 'p1') {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  if (program) store.commit({ programId: program, lens: 'admin', departmentId: null })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  return { client, store, pinia }
}

function mount<T>(pinia: ReturnType<typeof createPinia>, client: QueryClient, make: () => T) {
  let result!: T
  const app = createApp(
    defineComponent({
      setup() {
        result = make()
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  return { result, app }
}

const LISTS = [
  ['files', '/v1/admin/deleted/files', useDeletedFiles, 'deletedFiles'],
  ['subtasks', '/v1/admin/deleted/subtasks', useDeletedSubtasks, 'deletedSubtasks'],
  ['task_notes', '/v1/admin/deleted/task-notes', useDeletedTaskNotes, 'deletedTaskNotes'],
  [
    'meeting_notes',
    '/v1/admin/deleted/meeting-notes',
    useDeletedMeetingNotes,
    'deletedMeetingNotes',
  ],
  ['agenda_items', '/v1/admin/deleted/agenda-items', useDeletedAgendaItems, 'deletedAgendaItems'],
] as const

describe('çocuk tür silinen listeleri', () => {
  it.each(LISTS)(
    '%s: S2 program başlığı, limit 200, süzgeç sorguda, imleç sonraki sayfaya; departman başlığı yok',
    async (_, path, use) => {
      server.use(
        http.get(`${ORIGIN}${path}`, ({ request }) =>
          Response.json(
            new URL(request.url).searchParams.get('cursor')
              ? { items: [], total: 1 }
              : { items: [], next_cursor: 'c2', total: 1 },
          ),
        ),
      )
      const { client, pinia } = setup()
      const { result, app } = mount(pinia, client, () => use({ q: 'rapor', sort: 'name' }, true))
      await settleQueries(client)
      expect(seen).toHaveLength(1)
      expect(seen[0]!.program).toBe('p1')
      expect(seen[0]!.query.get('limit')).toBe('200')
      expect(seen[0]!.query.get('q')).toBe('rapor')
      expect(seen[0]!.query.get('sort')).toBe('name')
      expect(seen[0]!.query.has('cursor')).toBe(false)
      expect(result.hasNextPage.value).toBe(true)
      await result.fetchNextPage()
      expect(seen[1]!.query.get('cursor')).toBe('c2')
      expect(result.hasNextPage.value).toBe(false)
      app.unmount()
    },
  )

  it.each(LISTS)(
    '%s: devre dışı ya da programsız ağ isteği atmaz; kapsam değişince düşer',
    async (_, path, use, key) => {
      server.use(http.get(`${ORIGIN}${path}`, () => Response.json({ items: [], total: 0 })))
      const off = setup()
      const a = mount(off.pinia, off.client, () => use({}, false))
      await settleQueries(off.client)
      expect(seen).toEqual([])
      a.app.unmount()

      const noProgram = setup(null)
      const b = mount(noProgram.pinia, noProgram.client, () => use({}, true))
      await settleQueries(noProgram.client)
      expect(seen).toEqual([])
      b.app.unmount()

      const live = setup()
      const c = mount(live.pinia, live.client, () => use({}, true))
      await settleQueries(live.client)
      const cached = queryKeys[key].list(live.store.snapshot, { limit: 200 })
      expect(live.client.getQueryData(cached)).toBeDefined()
      purgeScopedQueries(live.client)
      expect(live.client.getQueryData(cached)).toBeUndefined()
      c.app.unmount()
    },
  )
})

describe('birleşik silinenler listesi', () => {
  const item = (id: string, kind = 'files') => ({
    kind,
    id,
    name: id,
    department_id: null,
    parent: null,
    deleted_at: '2026-11-17T10:00:00Z',
    deleted_by: null,
  })

  it('scope=program AÇIKÇA, limit 50 (eski 200 değil), kinds/süzgeç sorguda, sort/order yok', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/admin/deleted/records`, () =>
        Response.json({ items: [item('a')], next_cursor: '', total: 1 }),
      ),
    )
    const { client, pinia } = setup()
    const query: UnifiedQuery = {
      kinds: ['task_notes', 'meeting_notes', 'agenda_items'],
      q: 'plan',
      deleted_by: 'u1',
      department_id: 'd1',
    }
    const { app } = mount(pinia, client, () => useDeletedRecords(query, true))
    await settleQueries(client)
    expect(seen).toHaveLength(1)
    const r = seen[0]!
    expect(r.program).toBe('p1')
    expect(r.query.get('scope')).toBe('program')
    expect(r.query.get('limit')).toBe(String(UNIFIED_PAGE_LIMIT))
    expect(UNIFIED_PAGE_LIMIT).toBe(50)
    expect(r.query.get('kinds')).toBe('task_notes,meeting_notes,agenda_items')
    expect(r.query.get('q')).toBe('plan')
    expect(r.query.get('deleted_by')).toBe('u1')
    expect(r.query.get('department_id')).toBe('d1')
    expect(r.query.has('sort')).toBe(false)
    expect(r.query.has('order')).toBe(false)
    expect(r.query.has('cursor')).toBe(false)
    app.unmount()
  })

  it('kısa sayfa bitiş değildir: dolu imleç sürer, yalnız boş imleç durur', async () => {
    let call = 0
    server.use(
      http.get(`${ORIGIN}/v1/admin/deleted/records`, () => {
        call++
        if (call === 1) return Response.json({ items: [item('a')], next_cursor: 'c2', total: 3 })
        if (call === 2) return Response.json({ items: [], next_cursor: 'c3', total: 3 })
        return Response.json({ items: [item('b')], next_cursor: '', total: 3 })
      }),
    )
    const { client, pinia } = setup()
    const { result, app } = mount(pinia, client, () => useDeletedRecords({}, true))
    await settleQueries(client)
    expect(result.hasNextPage.value).toBe(true) // 1 < limit, yine de sürer
    await result.fetchNextPage()
    expect(seen[1]!.query.get('cursor')).toBe('c2')
    expect(result.hasNextPage.value).toBe(true) // dolu imleçli boş sayfa
    await result.fetchNextPage()
    expect(seen[2]!.query.get('cursor')).toBe('c3')
    expect(result.hasNextPage.value).toBe(false)
    app.unmount()
  })

  it('kinds ya da süzgeç değişince yeni sorgu: ilk sayfa, eski imleç gönderilmez', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/admin/deleted/records`, () =>
        Response.json({ items: [item('a')], next_cursor: 'c2', total: 2 }),
      ),
    )
    const { client, pinia } = setup()
    const query = ref<UnifiedQuery>({ kinds: ['files'] })
    const { result, app } = mount(pinia, client, () => useDeletedRecords(query, true))
    await settleQueries(client)
    await result.fetchNextPage()
    expect(seen[1]!.query.get('cursor')).toBe('c2')
    query.value = { kinds: ['subtasks'] }
    await settleQueries(client)
    const last = seen[seen.length - 1]!
    expect(last.query.get('kinds')).toBe('subtasks')
    expect(last.query.has('cursor')).toBe(false)
    query.value = { kinds: ['subtasks'], q: 'x' }
    await settleQueries(client)
    const next = seen[seen.length - 1]!
    expect(next.query.get('q')).toBe('x')
    expect(next.query.has('cursor')).toBe(false)
    app.unmount()
  })

  it('bilinmeyen kind ham öğede kalır (düşürülmez)', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/admin/deleted/records`, () =>
        Response.json({ items: [item('z', 'calendar_events')], next_cursor: '', total: 1 }),
      ),
    )
    const { client, pinia } = setup()
    const { result, app } = mount(pinia, client, () => useDeletedRecords({}, true))
    await settleQueries(client)
    expect(result.data.value?.pages[0]?.items[0]?.kind).toBe('calendar_events')
    app.unmount()
  })

  it('devre dışı ya da programsız ağ isteği yok; kapsam değişince program anahtarı düşer', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/admin/deleted/records`, () =>
        Response.json({ items: [], next_cursor: '', total: 0 }),
      ),
    )
    const off = setup()
    const a = mount(off.pinia, off.client, () => useDeletedRecords({}, false))
    await settleQueries(off.client)
    const none = setup(null)
    const b = mount(none.pinia, none.client, () => useDeletedRecords({}, true))
    await settleQueries(none.client)
    expect(seen).toEqual([])
    a.app.unmount()
    b.app.unmount()

    const live = setup()
    const { app } = mount(live.pinia, live.client, () => useDeletedRecords({}, true))
    await settleQueries(live.client)
    const key = queryKeys.deletedRecords.list(live.store.snapshot, {
      limit: 50,
      scope: 'program',
      kinds: null,
    })
    expect(live.client.getQueryData(key)).toBeDefined()
    purgeScopedQueries(live.client)
    expect(live.client.getQueryData(key)).toBeUndefined()
    app.unmount()
  })
})
