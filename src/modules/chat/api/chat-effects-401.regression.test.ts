import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest'
import { queryKeys } from '@/shared/http/query-keys'
import { msg } from '../__tests__/fixtures'
import {
  errorEnvelope,
  http,
  mountSetup,
  noContent,
  ORIGIN,
  resetAll,
  sent,
  server,
  signIn,
} from '../__tests__/harness'
import { emptyWindow } from '../model/window'
import { useSetChatReaction } from './writes'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(signIn)
afterEach(resetAll)
afterAll(() => server.close())

it('tepki 204 sonrası around 401, başarılı yazma promise zincirinden yakalanmamış ret üretmez', async () => {
  server.use(
    http.put(`${ORIGIN}/v1/chats/c1/messages/m1/reaction`, () => noContent()),
    http.get(`${ORIGIN}/v1/chats/c1/messages`, () =>
      errorEnvelope('platform.unauthenticated', 401),
    ),
    http.post(`${ORIGIN}/v1/auth/refresh`, () => errorEnvelope('platform.unauthenticated', 401)),
  )
  const mounted = mountSetup(() => useSetChatReaction())
  mounted.client.setQueryData(
    queryKeys.chats.messages({ programId: 'p1', departmentId: null, lens: 'admin' }, 'c1'),
    {
      ...emptyWindow(),
      items: [msg(1)],
    },
  )
  const result = await mounted.result
    .submit({ programId: 'p1', chatId: 'c1', messageId: 'm1', seq: 1, kind: 'like' })
    .then(
      (outcome) => ({ outcome, error: null }),
      (error: unknown) => ({ outcome: null, error }),
    )
  expect(sent('PUT', '/v1/chats/c1/messages/m1/reaction')).toHaveLength(1)
  expect(
    sent('GET', '/v1/chats/c1/messages').some((call) => call.query.get('around') === '1'),
  ).toBe(true)
  mounted.wrapper.unmount()
  expect(result.error).toBeNull()
  expect(result.outcome).toBeDefined()
})
