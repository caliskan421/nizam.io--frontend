import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { authSession } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'

import { fakeChatServer, msg, range, seqs, type FakeChatServer } from '../__tests__/fixtures'
import {
  http,
  HttpResponse,
  mountSetup,
  ORIGIN,
  resetAll,
  sent,
  server,
  settleQueries,
  signIn,
} from '../__tests__/harness'
import type { MessageWindow } from '../model/window'
import { useChatMessages } from './message-window'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())
beforeEach(signIn)

function serve(fake: FakeChatServer, chatId = 'c1') {
  server.use(
    http.get(`${ORIGIN}/v1/chats/${chatId}/messages`, ({ request }) => {
      const p = new URL(request.url).searchParams
      const num = (k: string) => (p.get(k) === null ? undefined : Number(p.get(k)))
      return HttpResponse.json(
        fake.readSync({
          limit: num('limit'),
          before: num('before'),
          after: num('after'),
          around: num('around'),
        }),
      )
    }),
  )
}

const key = (chatId = 'c1') =>
  queryKeys.chats.messages({ programId: 'p1', departmentId: null, lens: 'admin' }, chatId)

describe('useChatMessages', () => {
  it('ilk açılış son sayfayı kurar; veri düz MessageWindow (önbellekte)', async () => {
    const fake = fakeChatServer(range(1, 120), 90)
    serve(fake)
    const m = mountSetup(() => useChatMessages('c1'))
    await settleQueries(m.client)
    const win = m.result.window.value
    expect(seqs(win.items)).toEqual(range(71, 120).map((x) => x.seq))
    expect(win).toMatchObject({ hasOlder: true, hasNewer: false, peerReadSeq: 90 })
    expect(m.client.getQueryData<MessageWindow>(key())).toEqual(m.result.query.data.value)
    const call = sent('GET', '/v1/chats/c1/messages')[0]!
    expect(call.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(call.query.get('before')).toBeNull()
  })

  it('loadOlder / loadNewer / jumpTo / refreshMessage pencereyi adım adım günceller', async () => {
    const fake = fakeChatServer(range(1, 120))
    serve(fake)
    const m = mountSetup(() => useChatMessages('c1'))
    await settleQueries(m.client)
    await m.result.loadOlder()
    expect(m.result.window.value.items).toHaveLength(100)
    fake.add(msg(121))
    await m.result.loadNewer()
    expect(seqs(m.result.window.value.items).at(-1)).toBe(121)
    fake.edit(121, { body: 'düzenli', edited: true })
    await m.result.refreshMessage(121)
    expect(m.result.window.value.items.at(-1)).toMatchObject({ body: 'düzenli', edited: true })
    await m.result.jumpTo(10)
    expect(seqs(m.result.window.value.items)).toContain(10)
    expect(m.result.window.value.items.length).toBeLessThanOrEqual(50)
  })

  it('yeniden bağlanma uzlaştırması (reconcile): silinen kalkar, yeni gelir', async () => {
    const fake = fakeChatServer(range(1, 30))
    serve(fake)
    const m = mountSetup(() => useChatMessages('c1'))
    await settleQueries(m.client)
    fake.remove(10)
    fake.add(msg(31))
    await m.result.reconcile()
    const s = seqs(m.result.window.value.items)
    expect(s).not.toContain(10)
    expect(s).toContain(31)
  })

  it('query.refetch aynı uzlaştırmayı yapar (bayat pencere ilk açılış gibi sıfırlanmaz)', async () => {
    const fake = fakeChatServer(range(1, 30))
    serve(fake)
    const m = mountSetup(() => useChatMessages('c1'))
    await settleQueries(m.client)
    fake.add(msg(31))
    await m.result.query.refetch()
    expect(seqs(m.result.window.value.items).at(-1)).toBe(31)
    expect(sent('GET', '/v1/chats/c1/messages').some((r) => r.query.get('after') === '30')).toBe(
      true,
    )
  })

  it('aynı sohbette pencere işlemleri SIRAYLA koşar (iki toplu okuma yarışmaz)', async () => {
    const fake = fakeChatServer(range(1, 5))
    let inFlight = 0
    let maxInFlight = 0
    // İstek-varış ve yanıt bariyerleri: gerçek süre beklemesi yok. Bariyer ilk yüklemeden SONRA kurulur.
    let arrive = () => undefined as void
    let gate: Promise<void> = Promise.resolve()
    server.use(
      http.get(`${ORIGIN}/v1/chats/c1/messages`, async ({ request }) => {
        inFlight += 1
        maxInFlight = Math.max(maxInFlight, inFlight)
        arrive()
        await gate
        const after = new URL(request.url).searchParams.get('after')
        const out = fake.readSync(
          after === null ? { limit: 50 } : { limit: 50, after: Number(after) },
        )
        inFlight -= 1
        return HttpResponse.json(out)
      }),
    )
    const m = mountSetup(() => useChatMessages('c1'))
    await settleQueries(m.client)
    const arrived = new Promise<void>((r) => (arrive = r))
    let open!: () => void
    gate = new Promise<void>((r) => (open = r))
    const all = Promise.all([
      m.result.loadNewer(),
      m.result.loadNewer(),
      m.result.refreshMessage(3),
    ])
    await arrived
    await flushPromises()
    // İlk okuma yanıt beklerken sıradaki işlem BAŞLAMAMIŞ olmalı.
    expect(maxInFlight).toBe(1)
    open()
    await all
    expect(maxInFlight).toBe(1)
  })

  it('sohbet yokken (null) ve program yokken okuma/eylem yok', async () => {
    const m = mountSetup(() => useChatMessages(null))
    await settleQueries(m.client)
    await m.result.loadOlder()
    expect(sent('GET', '/v1/chats/null/messages')).toHaveLength(0)
    const none = mountSetup(() => useChatMessages('c1'), {
      scope: { programId: null, lens: null, departmentId: null },
    })
    await settleQueries(none.client)
    expect(sent('GET', '/v1/chats/c1/messages')).toHaveLength(0)
  })

  it('sohbet değişince (ref) yeni pencere kurulur; eskisi ayrı anahtarda kalır', async () => {
    serve(fakeChatServer(range(1, 5)), 'c1')
    serve(fakeChatServer(range(100, 105)), 'c2')
    const id = ref('c1')
    const m = mountSetup(() => useChatMessages(id))
    await settleQueries(m.client)
    id.value = 'c2'
    await vi.waitFor(() =>
      expect(seqs(m.result.window.value.items)).toEqual([100, 101, 102, 103, 104, 105]),
    )
    expect(m.client.getQueryData<MessageWindow>(key('c1'))?.items).toHaveLength(5)
  })
})

describe('geç sonuç, kapsam ve oturum (KESİN 26)', () => {
  function hold(fake: FakeChatServer) {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let arrived!: () => void
    const reached = new Promise<void>((resolve) => {
      arrived = resolve
    })
    let slow = false
    server.use(
      http.get(`${ORIGIN}/v1/chats/c1/messages`, async ({ request }) => {
        const before = new URL(request.url).searchParams.get('before')
        if (slow && before !== null) {
          arrived()
          await gate
        }
        const p = new URL(request.url).searchParams
        return HttpResponse.json(
          fake.readSync({
            limit: 50,
            ...(before !== null ? { before: Number(before) } : {}),
            ...(p.get('after') !== null ? { after: Number(p.get('after')) } : {}),
          }),
        )
      }),
    )
    return {
      arm: () => {
        slow = true
      },
      release,
      reached,
    }
  }

  it('okuma sürerken program değişirse sonuç eski anahtara yazılmaz', async () => {
    const fake = fakeChatServer(range(1, 120))
    const gate = hold(fake)
    const m = mountSetup(() => useChatMessages('c1'))
    await settleQueries(m.client)
    const before = m.client.getQueryData<MessageWindow>(key())!.items.length
    gate.arm()
    const pending = m.result.loadOlder()
    await gate.reached
    useScopeStore().commit({ programId: 'p2', lens: 'admin', departmentId: null })
    gate.release()
    await pending.catch(() => undefined)
    expect(m.client.getQueryData<MessageWindow>(key())?.items.length ?? before).toBe(before)
  })

  it('okuma sürerken oturum değişirse (çıkış) sonuç yazılmaz', async () => {
    const fake = fakeChatServer(range(1, 120))
    const gate = hold(fake)
    const m = mountSetup(() => useChatMessages('c1'))
    await settleQueries(m.client)
    const before = m.client.getQueryData<MessageWindow>(key())!.items.length
    gate.arm()
    const pending = m.result.loadOlder()
    await gate.reached
    authSession.clear()
    gate.release()
    await expect(pending).rejects.toThrow()
    expect(m.client.getQueryData<MessageWindow>(key())?.items.length ?? before).toBe(before)
  })

  it('read.updated yenilemesi beklerken oturum değişirse eski okundu bilgisi yazılmaz', async () => {
    const fake = fakeChatServer(range(1, 120))
    const gate = hold(fake)
    const m = mountSetup(() => useChatMessages('c1'))
    await settleQueries(m.client)
    const before = m.client.getQueryData<MessageWindow>(key())
    gate.arm()
    const pending = m.result.refreshPeerRead()
    await gate.reached
    authSession.clear()
    gate.release()
    await expect(pending).rejects.toThrow()
    expect(m.client.getQueryData<MessageWindow>(key())).toEqual(before)
  })

  it('read.updated beklerken kapsam değişimi eski pencereye yazmaz', async () => {
    const gate = hold(fakeChatServer(range(1, 120)))
    const m = mountSetup(() => useChatMessages('c1'))
    await settleQueries(m.client)
    const before = m.client.getQueryData<MessageWindow>(key())
    gate.arm()
    const pending = m.result.refreshPeerRead()
    await gate.reached
    useScopeStore().commit({ programId: 'p2', lens: 'admin', departmentId: null })
    gate.release()
    await pending.catch(() => undefined)
    expect(m.client.getQueryData<MessageWindow>(key())).toEqual(before)
  })

  it('read.updated beklerken söküm geç yanıtın pencereyi değiştirmesini engeller', async () => {
    const gate = hold(fakeChatServer(range(1, 120)))
    const m = mountSetup(() => useChatMessages('c1'))
    await settleQueries(m.client)
    const before = m.client.getQueryData<MessageWindow>(key())
    gate.arm()
    const pending = m.result.refreshPeerRead()
    await gate.reached
    m.wrapper.unmount()
    gate.release()
    await pending.catch(() => undefined)
    expect(m.client.getQueryData<MessageWindow>(key())).toEqual(before)
  })

  it('sahip sökülünce: uçuştaki sonuç yazılmaz, yeni okuma başlamaz', async () => {
    const fake = fakeChatServer(range(1, 120))
    const gate = hold(fake)
    const m = mountSetup(() => useChatMessages('c1'))
    await settleQueries(m.client)
    const before = m.client.getQueryData<MessageWindow>(key())!.items.length
    gate.arm()
    const pending = m.result.loadOlder()
    await gate.reached
    m.wrapper.unmount()
    gate.release()
    await pending.catch(() => undefined)
    const reads = sent('GET', '/v1/chats/c1/messages').length
    await m.result.loadNewer()
    expect(sent('GET', '/v1/chats/c1/messages')).toHaveLength(reads)
    expect(m.client.getQueryData<MessageWindow>(key())?.items.length).toBe(before)
  })
})
