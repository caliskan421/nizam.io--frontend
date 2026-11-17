// Kaydedilmiş yazma sonrası `around` yeniden okuması başarısız olursa: yazma sonucu korunur,
// tek PUT, otomatik tekrar yok; geçerli bağlamda "kaydedildi, yenilenemedi" bildirimi, bağlam
// kaybolmuşsa sessizlik.
import type { QueryClient } from '@tanstack/vue-query'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest'
import { authSession } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'
import { chatText } from '../messages'
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
import { useSetChatReaction, useVoteChatPoll } from './writes'

const KEY = queryKeys.chats.messages({ programId: 'p1', departmentId: null, lens: 'admin' }, 'c1')
const REACTION = { programId: 'p1', chatId: 'c1', messageId: 'm1', seq: 1, kind: 'like' } as const
const NOTICE = () => chatText('chat.thread.savedRefreshFailed')

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  signIn()
  useToast().clear()
  server.use(http.put(`${ORIGIN}/v1/chats/c1/messages/m1/reaction`, () => noContent()))
})
afterEach(resetAll)
afterAll(() => server.close())

const seed = (client: QueryClient) =>
  client.setQueryData(KEY, { ...emptyWindow(), items: [msg(1)] })
const messages = () => useToast().queue.value.map((t) => t.message)

it('around 503: yazma success kalır, tek PUT, pencere korunur, bildirim tek', async () => {
  server.use(
    http.get(`${ORIGIN}/v1/chats/c1/messages`, () => errorEnvelope('platform.unavailable', 503)),
  )
  const mounted = mountSetup(() => useSetChatReaction())
  seed(mounted.client)
  const before = mounted.client.getQueryData(KEY)
  const outcome = await mounted.result.submit(REACTION)
  expect(outcome.kind).toBe('success')
  expect(sent('PUT', '/v1/chats/c1/messages/m1/reaction')).toHaveLength(1)
  expect(mounted.client.getQueryData(KEY)).toBe(before)
  expect(messages()).toEqual([NOTICE()])
  mounted.wrapper.unmount()
})

it('around ağ hatası: aynı sonuç (success + bildirim)', async () => {
  server.use(http.get(`${ORIGIN}/v1/chats/c1/messages`, () => Response.error()))
  const mounted = mountSetup(() => useSetChatReaction())
  seed(mounted.client)
  const outcome = await mounted.result.submit(REACTION)
  expect(outcome.kind).toBe('success')
  expect(sent('PUT', '/v1/chats/c1/messages/m1/reaction')).toHaveLength(1)
  expect(messages()).toEqual([NOTICE()])
  mounted.wrapper.unmount()
})

it('kapsam okuma sırasında değişti: sessiz, başka pencere değişmez', async () => {
  server.use(
    http.get(`${ORIGIN}/v1/chats/c1/messages`, () => {
      useScopeStore().commit({ programId: 'p2', lens: 'admin', departmentId: null })
      return errorEnvelope('platform.unavailable', 503)
    }),
  )
  const mountedRef = mountSetup(() => useSetChatReaction())
  seed(mountedRef.client)
  const before = mountedRef.client.getQueryData(KEY)
  const outcome = await mountedRef.result.submit(REACTION)
  expect(outcome.kind).toBe('success')
  expect(messages()).toEqual([])
  expect(mountedRef.client.getQueryData(KEY)).toBe(before)
  mountedRef.wrapper.unmount()
})

it('oturum okuma sırasında bitti: sessiz, yeni girişe bildirim sızmaz', async () => {
  server.use(
    http.get(`${ORIGIN}/v1/chats/c1/messages`, () => {
      authSession.clear()
      return errorEnvelope('platform.unavailable', 503)
    }),
  )
  const mounted = mountSetup(() => useSetChatReaction())
  seed(mounted.client)
  const outcome = await mounted.result.submit(REACTION)
  expect(outcome.kind).toBe('success')
  signIn()
  expect(messages()).toEqual([])
  mounted.wrapper.unmount()
})

it('sahip okuma sırasında söküldü: sessiz', async () => {
  const mounted = mountSetup(() => useSetChatReaction())
  server.use(
    http.get(`${ORIGIN}/v1/chats/c1/messages`, () => {
      mounted.wrapper.unmount()
      return errorEnvelope('platform.unavailable', 503)
    }),
  )
  seed(mounted.client)
  const outcome = await mounted.result.submit(REACTION)
  expect(outcome.kind).toBe('success')
  expect(messages()).toEqual([])
})

it('oy başarısız (409) + around 503: failed korunur, ret sızmaz, "kaydedildi" bildirimi yok', async () => {
  server.use(
    http.put(`${ORIGIN}/v1/chats/c1/messages/m1/vote`, () =>
      errorEnvelope('messaging.poll_closed', 409),
    ),
    http.get(`${ORIGIN}/v1/chats/c1/messages`, () => errorEnvelope('platform.unavailable', 503)),
  )
  const mounted = mountSetup(() => useVoteChatPoll())
  seed(mounted.client)
  const outcome = await mounted.result.submit({ ...REACTION, optionIndexes: [0] })
  expect(outcome.kind).toBe('failed')
  expect(messages()).toEqual([])
  mounted.wrapper.unmount()
})
