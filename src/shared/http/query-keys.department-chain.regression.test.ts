import { QueryClient } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'

import { invalidationFilters, queryKeys } from './query-keys'

const scopes = [
  { programId: 'p1', departmentId: 'd1' },
  { programId: 'p1', departmentId: 'd2' },
  { programId: 'p2', departmentId: 'd3' },
] as const
const actionScope = { programId: 'p1', departmentId: null }
const filters = {}

function chainKeys(scope: (typeof scopes)[number]) {
  return [
    queryKeys.departments.all(scope),
    queryKeys.deletedDepartments.list(scope, filters),
    queryKeys.deletedWorkItems.list(scope, filters),
    queryKeys.deletedRecords.list(scope, filters),
    queryKeys.deletedSummary.all(scope),
    queryKeys.deletedFiles.list(scope, filters),
    queryKeys.deletedSubtasks.list(scope, filters),
    queryKeys.deletedTaskNotes.list(scope, filters),
    queryKeys.workItems.list(scope, filters),
    queryKeys.workItems.item(scope, 'task-1'),
    queryKeys.workItems.counts(scope, filters),
    queryKeys.workItems.files(scope, 'task-1'),
    queryKeys.gantt.face(scope, 'all'),
    queryKeys.archive.list(scope, 'files', filters),
    queryKeys.report.dashboard(scope),
    queryKeys.report.season(scope),
    queryKeys.report.task(scope, 'task-1'),
    queryKeys.chats.refSummary(scope, 'file-ref-1'),
  ]
}

describe('departman zinciri şirket genelinde önbelleği yeniler', () => {
  it.each([
    'restoreDepartment',
    'permanentDeleteDepartment',
    'batchRestoreDepartments',
    'batchPurgeDepartments',
    'purgeAllDepartments',
  ] as const)(
    '%s etkilenen program ve departmanların okuyucularını bayatlatır',
    async (operation) => {
      const client = new QueryClient()
      const affected = scopes.flatMap(chainKeys)
      const unrelated = [queryKeys.instance.profile(), queryKeys.notifications.unreadCount()]
      for (const key of [...affected, ...unrelated]) client.setQueryData(key, 1)

      await Promise.all(
        invalidationFilters(operation, actionScope).map((filter) =>
          client.invalidateQueries(filter),
        ),
      )

      const stillFresh = affected.filter((key) => !client.getQueryState(key)?.isInvalidated)
      expect(stillFresh, `${operation}: bayatlatılmayan anahtarlar`).toEqual([])
      for (const key of unrelated) expect(client.getQueryState(key)?.isInvalidated).toBe(false)
    },
  )

  it('departman işlemi profil ve bildirimlere dokunmaz', async () => {
    const client = new QueryClient()
    const keys = [queryKeys.instance.profile(), queryKeys.notifications.unreadCount()]
    for (const key of keys) client.setQueryData(key, 1)
    await Promise.all(
      invalidationFilters('permanentDeleteDepartment', actionScope).map((filter) =>
        client.invalidateQueries(filter),
      ),
    )
    for (const key of keys) expect(client.getQueryState(key)?.isInvalidated).toBe(false)
  })

  it('dosya geri yükleme diğer programın önbelleğine dokunmaz', async () => {
    const client = new QueryClient()
    const sameProgram = queryKeys.chats.refSummary(scopes[1], 'file-ref-1')
    const otherProgram = queryKeys.chats.refSummary(scopes[2], 'file-ref-1')
    for (const key of [sameProgram, otherProgram]) client.setQueryData(key, 1)
    await Promise.all(
      invalidationFilters('restoreFile', actionScope).map((filter) =>
        client.invalidateQueries(filter),
      ),
    )
    expect(client.getQueryState(sameProgram)?.isInvalidated).toBe(true)
    expect(client.getQueryState(otherProgram)?.isInvalidated).toBe(false)
  })
})
