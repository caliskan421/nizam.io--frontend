import { QueryClient } from '@tanstack/vue-query'
import { expect, it } from 'vitest'

import { invalidationFilters, queryKeys } from './query-keys'

it('dosya geri yükleme aynı programdaki bütün departmanların sohbet referans özetlerini bayatlatır', async () => {
  const client = new QueryClient()
  const d1 = queryKeys.chats.refSummary({ programId: 'p1', departmentId: 'd1' }, 'ref-1')
  const d2 = queryKeys.chats.refSummary({ programId: 'p1', departmentId: 'd2' }, 'ref-2')
  const other = queryKeys.chats.refSummary({ programId: 'p2', departmentId: 'd1' }, 'ref-3')
  client.setQueryData(d1, { available: false })
  client.setQueryData(d2, { available: true, file: { name: 'eski.png' } })
  client.setQueryData(other, { available: false })

  await Promise.all(
    invalidationFilters('restoreFile', { programId: 'p1', departmentId: null }, {}).map((filter) =>
      client.invalidateQueries(filter),
    ),
  )

  expect(client.getQueryState(d1)?.isInvalidated).toBe(true)
  expect(client.getQueryState(d2)?.isInvalidated).toBe(true)
  expect(client.getQueryState(other)?.isInvalidated).toBe(false)
})
