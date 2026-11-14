// Ö-06: korunan taslak devam gönderiminde yeni kimlikle gerçek pin sözleşmesini karşılar.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  boot,
  chatOf,
  GROUP,
  hold,
  idle,
  MEMBER,
  messageEls,
  ORIGIN,
  pressEnter,
  resetChats,
  rowOf,
  sent,
  teardown,
  tool,
  typeText,
  until,
  useChatBackend,
  userClick,
  watchStreams,
} from './chat-support'

const backend = useChatBackend({ coordinator: 'koordinator', member: 'uye' })
const path = `/v1/chats/${GROUP}/messages`
const field = () => $('[data-chat-composer-input]') as HTMLTextAreaElement
const posts = () => sent('POST', path)
const copies = (body: string) => chatOf(GROUP).messages.filter((m) => m.base.body === body)

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetChats()
  await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
  await until(() => messageEls().length > 0, 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  resetChats()
  watchStreams()
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
})
afterEach(teardown)
afterAll(() => backend.server.close())

async function open() {
  const app = await boot({ ...MEMBER, path: `/mesajlar/${GROUP}` })
  await until(() => rowOf(60), 'mesajlar')
  await idle(app.queryClient)
  return app
}

// Fixture da sınanır: aynı ID + farklı gönderim200 yapsa bu test mutlaka kırılır.
describe('pin §10.2 fixture gönderim izi', () => {
  it('özdeş tekrar200; değişen gövde, yanıt, bahsetme, ref ve anket409', async () => {
    const app = await open()
    await typeText('Sözleşme')
    await pressEnter()
    await until(() => field().value === '', 'ilk başarı')
    await idle(app.queryClient)
    const first = posts()[0]!
    const replay = (over: object) =>
      fetch(`${ORIGIN}${path}`, {
        method: 'POST',
        headers: {
          Authorization: first.headers.get('Authorization')!,
          'X-Nizamio-Program': 'p1',
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...(first.body as object), ...over }),
      })
    expect((await replay({})).status).toBe(200)
    for (const changed of [
      { body: 'Farklı metin' },
      { reply_to_message_id: `${GROUP}-m60` },
      { mentions: [{ kind: 'account', target_id: 'second' }] },
      { refs: [{ kind: 'task', target_id: 'w1' }] },
      { poll: { options: ['Evet', 'Hayır'] } },
    ]) {
      const response = await replay(changed)
      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({
        code: 'messaging.idempotency_key_reused',
      })
    }
    expect(copies('Sözleşme')).toHaveLength(1)
  })
})

describe('geç başarıdan sonra yeni semantik taslak (Ö-06)', () => {
  it('aynı gövdeye Yanıtla eklenir: ilk başarı korur, ikinci POST yeni ID ile iki ayrı mesaj oluşturur', async () => {
    const app = await open()
    const gate = hold('POST', new RegExp(`${path}$`))
    await typeText('Aynı gövde')
    await pressEnter()
    await gate.arrived
    await userClick(() => tool(rowOf(60)!, 'Yanıtla'))
    await until(() => $('[data-testid="chat-composer-band"]'), 'yanıt bandı')
    gate.release()
    await until(() => copies('Aynı gövde').length === 1, 'ilk mesaj')
    await idle(app.queryClient)
    expect(field().value).toBe('Aynı gövde')
    await pressEnter()
    await until(() => field().value === '', 'ikinci başarı')
    await idle(app.queryClient)
    expect(posts()).toHaveLength(2)
    const [first, second] = posts().map((p) => p.body as Record<string, unknown>)
    expect(first!.reply_to_message_id).toBeUndefined()
    expect(second).toMatchObject({ body: first!.body, reply_to_message_id: `${GROUP}-m60` })
    expect(second!.client_message_id).not.toBe(first!.client_message_id)
    expect(copies('Aynı gövde')).toHaveLength(2)
    expect($('[data-testid="chat-composer-band"]')).toBeNull()
  })
})
