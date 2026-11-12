import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { createApp, defineComponent } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'

import {
  usePermanentDeleteAccount,
  usePermanentDeleteDepartment,
  usePermanentDeleteWorkItem,
  useRestoreAccount,
  useRestoreDepartment,
  useRestoreWorkItem,
} from '../api/writes'

const ORIGIN = 'http://localhost'
const server = setupServer()
const seen: Array<{ method: string; path: string; headers: Headers }> = []
server.events.on('request:start', ({ request }) => {
  seen.push({
    method: request.method,
    path: new URL(request.url).pathname,
    headers: new Headers(request.headers),
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
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  let writes!: ReturnType<typeof make>
  function make() {
    return {
      restoreTask: useRestoreWorkItem(),
      purgeTask: usePermanentDeleteWorkItem(),
      restoreDepartment: useRestoreDepartment(),
      purgeDepartment: usePermanentDeleteDepartment(),
      restoreAccount: useRestoreAccount(),
      purgeAccount: usePermanentDeleteAccount(),
    }
  }
  const app = createApp(
    defineComponent({
      setup() {
        writes = make()
        return () => null
      },
    }),
  )
  app.use(pinia).use(VueQueryPlugin, { queryClient: client }).mount(document.createElement('div'))
  return { client, writes, app }
}

describe('yaşam döngüsü yazmaları (görev, departman, hesap)', () => {
  it('altı uç doğru yol/kapsamla gider; Idempotency-Key yok, X-Requested-With var', async () => {
    server.use(http.all(`${ORIGIN}/v1/admin/*`, () => HttpResponse.json({ status: 'ok' })))
    const { writes, app } = setup()
    const s2 = { programId: 'p1', id: 'x1' }
    const outcomes = [
      await writes.restoreTask.submit(s2),
      await writes.purgeTask.submit(s2),
      await writes.restoreDepartment.submit(s2),
      await writes.purgeDepartment.submit(s2),
      await writes.restoreAccount.submit({ id: 'a1' }),
      await writes.purgeAccount.submit({ id: 'a1' }),
    ]
    expect(outcomes.map((o) => o.kind)).toEqual(Array(6).fill('success'))
    expect(seen.map((r) => `${r.method} ${r.path}`)).toEqual([
      'PATCH /v1/admin/restore/work-items/x1',
      'DELETE /v1/admin/permanent/work-items/x1',
      'PATCH /v1/admin/restore/departments/x1',
      'DELETE /v1/admin/permanent/departments/x1',
      'PATCH /v1/admin/restore/accounts/a1',
      'DELETE /v1/admin/permanent/accounts/a1',
    ])
    for (const request of seen) {
      expect(request.headers.get('Idempotency-Key'), request.path).toBeNull()
      expect(request.headers.get('X-Requested-With'), request.path).toBeTruthy()
      const s1 = request.path.includes('/accounts/')
      expect(request.headers.get('X-Nizamio-Program'), request.path).toBe(s1 ? null : 'p1')
      expect(request.headers.get('X-Nizamio-Department'), request.path).toBeNull()
    }
    app.unmount()
  })

  it('görev geri yükleme geçersizleme ilişkileri: silinen görevler, görev listesi, gantt, arşiv, pano düşer', async () => {
    server.use(http.all(`${ORIGIN}/v1/admin/*`, () => HttpResponse.json({ status: 'restored' })))
    const { client, writes, app } = setup()
    const scope = useScopeStore().snapshot
    const keys = {
      deleted: queryKeys.deletedWorkItems.list(scope, { limit: 200 }),
      list: queryKeys.workItems.list(scope, { status: 'x' }),
      gantt: queryKeys.gantt.face(scope, 'admin'),
      archive: queryKeys.archive.list(scope, 'folders', {}),
      report: queryKeys.report.dashboard(scope),
      meetings: queryKeys.meetings.deleted(scope),
    }
    for (const key of Object.values(keys)) client.setQueryData(key, 1)
    await writes.restoreTask.submit({ programId: 'p1', id: 'w1' })
    const stale = Object.entries(keys)
      .filter(([, key]) => client.getQueryState(key)?.isInvalidated)
      .map(([name]) => name)
    expect(stale.sort()).toEqual(['archive', 'deleted', 'gantt', 'list', 'report'])
    app.unmount()
  })

  it('departman geri yükleme: silinen departmanlar, katalog, departmanlar, me, pano; hesap: silinen hesaplar, kullanıcılar, pano', async () => {
    server.use(http.all(`${ORIGIN}/v1/admin/*`, () => HttpResponse.json({ status: 'restored' })))
    const { client, writes, app } = setup()
    const scope = useScopeStore().snapshot
    const group = {
      deletedDepartments: queryKeys.deletedDepartments.all(scope),
      catalog: queryKeys.catalog.departments(),
      departments: queryKeys.departments.all(scope),
      me: queryKeys.me.departments(),
      report: queryKeys.report.dashboard(scope),
      users: queryKeys.users.list({ q: '' }),
      deletedAccounts: queryKeys.deletedAccounts.list({ limit: 200 }),
      deletedWorkItems: queryKeys.deletedWorkItems.list(scope, { limit: 200 }),
    }
    const reset = () => {
      for (const key of Object.values(group)) client.setQueryData(key, 1)
    }
    const stale = () =>
      Object.entries(group)
        .filter(([, key]) => client.getQueryState(key)?.isInvalidated)
        .map(([name]) => name)
        .sort()
    reset()
    await writes.restoreDepartment.submit({ programId: 'p1', id: 'd1' })
    expect(stale()).toEqual(['catalog', 'deletedDepartments', 'departments', 'me', 'report'])
    reset()
    await writes.restoreAccount.submit({ id: 'a1' })
    expect(stale()).toEqual(['deletedAccounts', 'report', 'users'])
    app.unmount()
  })

  it('sonuç bilinmiyor (5xx): kör tekrar yok, retry düşürülür', async () => {
    server.use(
      http.patch(`${ORIGIN}/v1/admin/restore/accounts/a1`, () =>
        HttpResponse.json(
          { code: 'platform.internal', message: 'x', request_id: 'r', fields: [] },
          { status: 500 },
        ),
      ),
    )
    const { writes, app } = setup()
    const outcome = await writes.restoreAccount.submit({ id: 'a1' })
    expect(outcome).toMatchObject({ kind: 'unknown_outcome', retry: null })
    expect(seen.filter((r) => r.method === 'PATCH')).toHaveLength(1)
    app.unmount()
  })
})
