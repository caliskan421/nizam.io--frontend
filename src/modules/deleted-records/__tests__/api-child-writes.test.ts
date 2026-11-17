import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { createApp, defineComponent } from 'vue'

import { OPERATIONS } from '@/shared/api/operations.gen'
import { queryKeys, type OperationId } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'

import { useChildLifecycleWrites } from '../api/lifecycle-writes'
import { usePurgeAllDepartments } from '../api/purge-all'
import { CHILD_KINDS, LIFECYCLE, type ChildKind } from '../model/lifecycle'

const ORIGIN = 'http://localhost'
const server = setupServer()
interface Seen {
  method: string
  path: string
  search: string
  headers: Headers
  body: unknown
}
const seen: Seen[] = []
server.events.on('request:start', async ({ request }) => {
  const text = await request.clone().text()
  const url = new URL(request.url)
  seen.push({
    method: request.method,
    path: url.pathname,
    search: url.search,
    headers: new Headers(request.headers),
    body: text ? JSON.parse(text) : null,
  })
})
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  seen.length = 0
  server.resetHandlers()
})
afterAll(() => server.close())

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: 'dep-ignored' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  let writes!: ReturnType<typeof useChildLifecycleWrites>
  let purgeDepartments!: ReturnType<typeof usePurgeAllDepartments>
  const app = createApp(
    defineComponent({
      setup() {
        writes = useChildLifecycleWrites()
        purgeDepartments = usePurgeAllDepartments()
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  return { client, writes, purgeDepartments, app }
}

const PROGRAM = { programId: 'p1' }

describe('çocuk tür yaşam döngüsü yazmaları (25 uç)', () => {
  it.each(CHILD_KINDS)(
    '%s: beş uç gerçek yol/yöntem/gövdeyle gider; S2 başlık, CSRF var; anahtar ve departman yok',
    async (kind) => {
      server.use(
        http.all(`${ORIGIN}/v1/admin/*`, () =>
          HttpResponse.json({ status: 'ok', succeeded: [], failed: [], remaining: 0 }),
        ),
      )
      const { writes, app } = setup()
      const w = writes[kind]
      const path = LIFECYCLE[kind].path
      const outcomes = [
        await w.restore.submit({ ...PROGRAM, id: 'x1' }),
        await w.purge.submit({ ...PROGRAM, id: 'x1' }),
        await w.batchRestore.submit({ ...PROGRAM, ids: ['a', 'b'] }),
        await w.batchPurge.submit({ ...PROGRAM, ids: ['a'] }),
        await w.purgeAll.submit({ ...PROGRAM, confirm: path }),
      ]
      expect(outcomes.map((o) => o.kind)).toEqual(Array(5).fill('success'))
      expect(seen.map((r) => `${r.method} ${r.path}`)).toEqual([
        `PATCH /v1/admin/restore/${path}/x1`,
        `DELETE /v1/admin/permanent/${path}/x1`,
        `POST /v1/admin/deleted/${path}/restore`,
        `POST /v1/admin/deleted/${path}/purge`,
        `POST /v1/admin/deleted/${path}/purge-all`,
      ])
      expect(seen.map((r) => r.body)).toEqual([
        null,
        null,
        { ids: ['a', 'b'] },
        { ids: ['a'] },
        { confirm: path },
      ])
      for (const r of seen) {
        expect(r.headers.get('X-Nizamio-Program'), r.path).toBe('p1')
        expect(r.headers.get('X-Nizamio-Department'), r.path).toBeNull()
        expect(r.headers.get('X-Requested-With'), r.path).toBeTruthy()
        expect(r.headers.get('Idempotency-Key'), r.path).toBeNull()
        expect(r.search, r.path).toBe('')
      }
      app.unmount()
    },
  )

  it('her kayıt işlemi sözleşmedeki operationId ve yola bağlı', () => {
    for (const kind of CHILD_KINDS) {
      const ops = LIFECYCLE[kind].operations
      const route = (id: OperationId) =>
        Object.entries(OPERATIONS).find(([, meta]) => meta.operationId === id)![0]
      expect(route(ops.restore)).toBe(`PATCH /v1/admin/restore/${LIFECYCLE[kind].path}/{id}`)
      expect(route(ops.purge)).toBe(`DELETE /v1/admin/permanent/${LIFECYCLE[kind].path}/{id}`)
      expect(route(ops.purgeAll)).toBe(`POST /v1/admin/deleted/${LIFECYCLE[kind].path}/purge-all`)
    }
  })

  it('koordinatörlük çöpü boşalt: scope=program AÇIKÇA gider (company varsayılanına düşmez)', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/admin/deleted/departments/purge-all`, () =>
        HttpResponse.json({ succeeded: ['d1'], failed: [], remaining: 0 }),
      ),
    )
    const { purgeDepartments, app } = setup()
    const outcome = await purgeDepartments.submit({ ...PROGRAM, confirm: 'departments' })
    expect(outcome.kind).toBe('success')
    expect(seen).toHaveLength(1)
    expect(seen[0]!.search).toBe('?scope=program')
    expect(seen[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(seen[0]!.body).toEqual({ confirm: 'departments' })
    app.unmount()
  })

  it('dosya geri yükleme sonucu `renamed` ve `display_name` ile aynen döner', async () => {
    server.use(
      http.patch(`${ORIGIN}/v1/admin/restore/files/f1`, () =>
        HttpResponse.json({
          file_id: 'f1',
          status: 'restored',
          display_name: 'rapor (2).csv',
          renamed: true,
        }),
      ),
    )
    const { writes, app } = setup()
    const outcome = await writes.files.restore.submit({ ...PROGRAM, id: 'f1' })
    expect(outcome.kind === 'success' && outcome.data).toMatchObject({
      renamed: true,
      display_name: 'rapor (2).csv',
    })
    app.unmount()
  })

  it.each([
    ['files', 'restore', 'records.work_item_deleted'],
    ['files', 'restore', 'records.too_many_files'],
    ['subtasks', 'restore', 'work.item_completed'],
    ['subtasks', 'restore', 'work.subtask_limit_reached'],
    ['agenda_items', 'restore', 'collaboration.meeting_deleted'],
    ['meeting_notes', 'restore', 'collaboration.meeting_deleted'],
    ['files', 'purge', 'records.permanent_requires_deleted'],
  ] as const)(
    '%s.%s: 409/422 %s hata kodu olarak döner (kör tekrar yok)',
    async (kind, action, code) => {
      let calls = 0
      server.use(
        http.all(`${ORIGIN}/v1/admin/*`, () => {
          calls++
          return HttpResponse.json({ code, message: 'sunucu metni' }, { status: 409 })
        }),
      )
      const { writes, app } = setup()
      const w = writes[kind as ChildKind][action]
      const outcome = await w.submit({ ...PROGRAM, id: 'x1' })
      expect(outcome.kind).toBe('failed')
      expect(outcome.kind === 'failed' && outcome.error.code).toBe(code)
      expect(calls).toBe(1)
      app.unmount()
    },
  )

  it('toplu geri yükleme kısmi başarıyı (200 + failed[]) başarı zarfı olarak taşır', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/admin/deleted/files/restore`, () =>
        HttpResponse.json({
          succeeded: ['a'],
          failed: [{ id: 'b', code: 'records.work_item_deleted' }],
        }),
      ),
    )
    const { writes, app } = setup()
    const outcome = await writes.files.batchRestore.submit({ ...PROGRAM, ids: ['a', 'b'] })
    expect(outcome.kind === 'success' && outcome.data).toEqual({
      succeeded: ['a'],
      failed: [{ id: 'b', code: 'records.work_item_deleted' }],
    })
    app.unmount()
  })

  it('geri yükleme çöp listesi, birleşik liste, özet, canlı dosya yüzleri ve panoyu yeniler; başka program dokunulmaz', async () => {
    server.use(http.all(`${ORIGIN}/v1/admin/*`, () => HttpResponse.json({ status: 'restored' })))
    const { client, writes, app } = setup()
    const p1 = useScopeStore().snapshot
    const p2 = { programId: 'p2', departmentId: null }
    const keys = {
      files: queryKeys.deletedFiles.list(p1, { limit: 200 }),
      unified: queryKeys.deletedRecords.list(p1, { limit: 50 }),
      summary: queryKeys.deletedSummary.all(p1),
      archive: queryKeys.archive.list(p1, 'folders', {}),
      workFiles: queryKeys.workItems.files(p1, 'w1'),
      item: queryKeys.workItems.item(p1, 'w1'),
      report: queryKeys.report.dashboard(p1),
      otherProgram: queryKeys.deletedFiles.list(p2, { limit: 200 }),
    }
    for (const key of Object.values(keys)) client.setQueryData(key, 1)
    await writes.files.restore.submit({ ...PROGRAM, id: 'f1' })
    const stale = Object.entries(keys)
      .filter(([, key]) => client.getQueryState(key)?.isInvalidated)
      .map(([name]) => name)
    expect(stale.sort()).toEqual(
      ['archive', 'files', 'item', 'report', 'summary', 'unified', 'workFiles'].sort(),
    )
    app.unmount()
  })
})
