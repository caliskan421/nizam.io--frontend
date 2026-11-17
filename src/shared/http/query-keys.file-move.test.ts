import { QueryClient, type QueryKey } from '@tanstack/vue-query'
import { expect, it } from 'vitest'

import { invalidationFilters, queryKeys, resourcesInvalidatedBy } from './query-keys'

const SOURCE = { programId: 'p1', departmentId: 'd1' }
const TARGET = { programId: 'p1', departmentId: 'd2' }
const OTHER_PROGRAM = { programId: 'p2', departmentId: 'd1' }

async function staleAfterMove(keys: QueryKey[]): Promise<QueryKey[]> {
  const client = new QueryClient()
  for (const key of keys) client.setQueryData(key, 1)
  await Promise.all(
    invalidationFilters('moveFile', SOURCE, {}).map((filter) => client.invalidateQueries(filter)),
  )
  return keys.filter((key) => client.getQueryState(key)?.isInvalidated)
}

it('dosya taşıma aynı programın başka departmanındaki görev okuyucularını da bayatlatır', async () => {
  const hit = [
    queryKeys.workItems.item(TARGET, 'w-target'),
    queryKeys.workItems.list(TARGET, { status: 'yeni' }),
    queryKeys.workItems.files(TARGET, 'w-target'),
    queryKeys.workItems.counts(TARGET, {}),
    queryKeys.shellBadges.counts(TARGET, {}),
    queryKeys.workItems.item(SOURCE, 'w-source'),
    queryKeys.workItems.files(SOURCE, 'w-source'),
    queryKeys.archive.list(TARGET, 'attachments', {}),
    queryKeys.report.task(TARGET, 'w-target'),
    queryKeys.chats.refSummary(TARGET, 'ref-1'),
  ]
  expect(await staleAfterMove(hit)).toEqual(hit)
})

it('dosya taşıma başka programa, alt görev/not/bağımlılık ve sohbet sayaçlarına dokunmaz', async () => {
  const untouched = [
    queryKeys.workItems.item(OTHER_PROGRAM, 'w-other'),
    queryKeys.workItems.files(OTHER_PROGRAM, 'w-other'),
    queryKeys.archive.list(OTHER_PROGRAM, 'attachments', {}),
    queryKeys.report.task(OTHER_PROGRAM, 'w-other'),
    queryKeys.chats.refSummary(OTHER_PROGRAM, 'ref-2'),
    queryKeys.workItems.subtasks(TARGET, 'w-target'),
    queryKeys.workItems.notes(TARGET, 'w-target'),
    queryKeys.workItems.dependencies(TARGET, 'w-target'),
    queryKeys.chats.sharedCounts(TARGET, 'chat-1'),
    queryKeys.chats.attachments(TARGET, 'chat-1'),
    queryKeys.deletedFiles.list(TARGET, {}),
  ]
  expect(await staleAfterMove(untouched)).toEqual([])
  const resources = resourcesInvalidatedBy('moveFile')
  expect(resources).not.toContain('chats.sharedCounts')
  expect(resources).not.toContain('chats.attachments')
  expect(resources).not.toContain('report')
})
