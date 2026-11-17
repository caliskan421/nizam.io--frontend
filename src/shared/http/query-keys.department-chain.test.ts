import { QueryClient } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'

import { invalidationFilters, queryKeys } from './query-keys'

const p1 = { programId: 'p1', departmentId: null }
const p2 = { programId: 'p2', departmentId: null }
const p2d = { programId: 'p2', departmentId: 'd9' }

async function run(operation: Parameters<typeof invalidationFilters>[0], client: QueryClient) {
  await Promise.all(invalidationFilters(operation, p1).map((f) => client.invalidateQueries(f)))
}

describe('departman zinciri kapsamı', () => {
  it('kalıcı silme başka programın ekip ve sohbet okuyucularını da yeniler', async () => {
    const client = new QueryClient()
    const keys = [
      queryKeys.departments.members(p2d, 'd1'),
      queryKeys.chats.list(p2d, ''),
      queryKeys.deletedWorkItems.list(p2, {}),
      queryKeys.meetings.list(p2d, {}),
    ]
    for (const key of keys) client.setQueryData(key, 1)
    await run('permanentDeleteDepartment', client)
    for (const key of keys) expect(client.getQueryState(key)?.isInvalidated).toBe(true)
  })

  it('geri yükleme sohbet listesine dokunmaz', async () => {
    const client = new QueryClient()
    const keys = [queryKeys.chats.list(p2d, '')]
    for (const key of keys) client.setQueryData(key, 1)
    await run('restoreDepartment', client)
    for (const key of keys) expect(client.getQueryState(key)?.isInvalidated).toBe(false)
  })

  it('görev geri yükleme başka programın görev önbelleğine dokunmaz', async () => {
    const client = new QueryClient()
    const other = queryKeys.workItems.list(p2, {})
    const same = queryKeys.workItems.list(p1, {})
    for (const key of [other, same]) client.setQueryData(key, 1)
    await run('restoreWorkItem', client)
    expect(client.getQueryState(same)?.isInvalidated).toBe(true)
    expect(client.getQueryState(other)?.isInvalidated).toBe(false)
  })

  it('programsız eylem bağlamında da kapsamlı anahtarlar yenilenir, hesap geneli korunur', async () => {
    const client = new QueryClient()
    const scoped = queryKeys.report.dashboard(p2)
    const accounts = queryKeys.deletedAccounts.list({})
    for (const key of [scoped, accounts]) client.setQueryData(key, 1)
    await Promise.all(
      invalidationFilters('batchPurgeDepartments', { programId: null, departmentId: null }).map(
        (f) => client.invalidateQueries(f),
      ),
    )
    expect(client.getQueryState(scoped)?.isInvalidated).toBe(true)
    expect(client.getQueryState(accounts)?.isInvalidated).toBe(false)
  })
})
