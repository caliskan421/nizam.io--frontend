import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { queryKeys } from '@/shared/http/query-keys'

import { ADMIN_SCOPE, harness, knownUser, resetHarness, server } from '../../__tests__/harness'
import { useUserCacheIndex } from './use-user-cache'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const page = (users: ReturnType<typeof knownUser>[]) => ({
  pages: [{ page: { users }, truncated: false }],
  pageParams: [undefined],
})

describe('önbellekteki kullanıcı dizini (BE-043)', () => {
  it('bütün listUsers anahtarlarından okur, istek atmaz; önbellek değişince güncellenir', async () => {
    const h = harness(ADMIN_SCOPE)
    h.queryClient.setQueryData(
      queryKeys.users.list({ search: null, sortOrder: 'asc' }),
      page([knownUser('a', 'Ayşe')]),
    )
    const index = h.run(() => useUserCacheIndex())
    expect([...index.value.keys()]).toEqual(['a'])

    h.queryClient.setQueryData(
      queryKeys.users.list({ search: 'be', sortOrder: 'desc' }),
      page([knownUser('b', 'Berk'), knownUser('a', 'Ayşe')]),
    )
    await vi.waitFor(() => expect([...index.value.keys()].sort()).toEqual(['a', 'b']))
    expect(index.value.get('b')?.full_name).toBe('Berk')
  })
})
