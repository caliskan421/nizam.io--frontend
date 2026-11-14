import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  http,
  mountSetup,
  noContent,
  ORIGIN,
  resetAll,
  sent,
  server,
  signIn,
} from '../__tests__/harness'
import { useTypingSignal } from './typing'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())
beforeEach(signIn)

describe('yazıyor sinyali', () => {
  it('en çok 1/3 sn: aralık dolmadan istek gitmez; CSRF + program başlığı; anahtar yok', async () => {
    server.use(http.post(`${ORIGIN}/v1/chats/c1/typing`, () => noContent()))
    let now = 10_000
    const m = mountSetup(() => useTypingSignal(() => now))
    const target = { programId: 'p1', chatId: 'c1' }
    expect(await m.result.notify(target)).toBe(true)
    now += 1000
    expect(await m.result.notify(target)).toBe(false)
    now += 2000
    expect(await m.result.notify(target)).toBe(true)
    const calls = sent('POST', '/v1/chats/c1/typing')
    expect(calls).toHaveLength(2)
    expect(calls[0]!.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(calls[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    m.result.reset()
    expect(await m.result.notify(target)).toBe(true)
  })

  it('hata/ret kullanıcıya iletilmez (fırlatmaz)', async () => {
    server.use(http.post(`${ORIGIN}/v1/chats/c1/typing`, () => new Response(null, { status: 500 })))
    const m = mountSetup(() => useTypingSignal())
    await expect(m.result.notify({ programId: 'p1', chatId: 'c1' })).resolves.toBe(true)
  })
})
