import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'

import { fakeChatServer, range } from '../__tests__/fixtures'
import {
  http,
  HttpResponse,
  mountSetup,
  ORIGIN,
  resetAll,
  sent,
  server,
  signIn,
} from '../__tests__/harness'
import { useChatMessages } from './message-window'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())
beforeEach(signIn)

/** `limit=1` giriş okumasını tutar; ilk açılış ve diğer okumalar serbest. */
function holdEntryRead(seq: number | null) {
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  let arrive!: () => void
  const reached = new Promise<void>((resolve) => {
    arrive = resolve
  })
  const fake = fakeChatServer(range(1, 5), null, { seq })
  server.use(
    http.get(`${ORIGIN}/v1/chats/:id/messages`, async ({ request }) => {
      const limit = Number(new URL(request.url).searchParams.get('limit'))
      if (limit === 1) {
        arrive()
        await gate
      }
      return HttpResponse.json(fake.readSync({ limit }))
    }),
  )
  return { release, reached }
}

describe('readFirstUnread: yakalanan bağlam kapıları', () => {
  it('geçerli bağlamda sunucunun first_unread_seq değerini döner', async () => {
    const gate = holdEntryRead(3)
    const m = mountSetup(() => useChatMessages('c1'))
    await vi.waitFor(() => expect(m.result.query.isSuccess.value).toBe(true))
    const pending = m.result.readFirstUnread()
    await gate.reached
    gate.release()
    expect(await pending).toBe(3)
  })

  it('uçuşta oturum silinirse sonuç undefined', async () => {
    const gate = holdEntryRead(3)
    const m = mountSetup(() => useChatMessages('c1'))
    await vi.waitFor(() => expect(m.result.query.isSuccess.value).toBe(true))
    const pending = m.result.readFirstUnread()
    await gate.reached
    authSession.clear()
    gate.release()
    expect(await pending).toBeUndefined()
  })

  it('uçuşta sahip sökülürse sonuç undefined', async () => {
    const gate = holdEntryRead(3)
    const m = mountSetup(() => useChatMessages('c1'))
    await vi.waitFor(() => expect(m.result.query.isSuccess.value).toBe(true))
    const pending = m.result.readFirstUnread()
    await gate.reached
    m.wrapper.unmount()
    gate.release()
    expect(await pending).toBeUndefined()
  })

  it('uçuşta sohbet değişirse sonuç undefined (A→B eski yanıtı)', async () => {
    const gate = holdEntryRead(3)
    const id = ref('c1')
    const m = mountSetup(() => useChatMessages(id))
    await vi.waitFor(() => expect(m.result.query.isSuccess.value).toBe(true))
    const pending = m.result.readFirstUnread()
    await gate.reached
    id.value = 'c2'
    gate.release()
    expect(await pending).toBeUndefined()
  })

  it('kuyrukta beklerken kapsam değişirse eski kapsam için okuma başlamaz', async () => {
    const gate = holdEntryRead(3)
    const m = mountSetup(() => useChatMessages('c1'))
    await vi.waitFor(() => expect(m.result.query.isSuccess.value).toBe(true))
    const first = m.result.readFirstUnread()
    await gate.reached
    const queued = m.result.readFirstUnread()
    useScopeStore().commit({ programId: 'p2', lens: 'admin', departmentId: null })
    const reads = () =>
      sent('GET', '/v1/chats/c1/messages').filter(
        (r) => r.query.get('limit') === '1' && r.headers.get('X-Nizamio-Program') === 'p1',
      ).length
    expect(reads()).toBe(1)
    gate.release()
    expect(await first).toBeUndefined()
    expect(await queued).toBeUndefined()
    expect(reads()).toBe(1)
  })
})
