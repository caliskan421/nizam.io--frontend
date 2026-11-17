// BE-080 / BE-029 (W185b) yazma katmanı: durumlu sahte uç + gerçek istemci/motor. İletme sonucu
// önbelleğe içerik YAZMAZ (yalnız ilişki geçersizlemesi); arşive kaydet gerçek cevap mesajını
// pencereye yamar ve görev dosya/arşiv yüzeylerini yeniler.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { queryKeys } from '@/shared/http/query-keys'

import { msg, range, seqs } from '../__tests__/fixtures'
import {
  errorEnvelope,
  http,
  HttpResponse,
  json,
  mountSetup,
  ORIGIN,
  resetAll,
  sent,
  server,
  settleQueries,
  signIn,
} from '../__tests__/harness'
import type { MessageWindow } from '../model/window'
import { useArchiveChatFile } from './attachments'
import { useForwardChatMessage } from './forward'
import { useChatMessages } from './message-window'

const nativeClone = globalThis.structuredClone
function browserLikeClone(value: unknown): unknown {
  if (value instanceof Blob) return value
  if (Array.isArray(value)) return value.map(browserLikeClone)
  if (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, browserLikeClone(v)]))
  }
  return nativeClone(value)
}

beforeAll(() => {
  vi.stubGlobal('structuredClone', browserLikeClone)
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => {
  resetAll()
  vi.restoreAllMocks()
})
afterAll(() => {
  vi.unstubAllGlobals()
  server.close()
})
beforeEach(signIn)

const scope = { programId: 'p1', departmentId: null, lens: 'admin' as const }
const FORWARD = `${ORIGIN}/v1/chats/c1/messages/m2/forward`
const ARCHIVE = `${ORIGIN}/v1/chats/c1/archived-files`

const forwardInput = (over = {}) => ({
  programId: 'p1',
  chatId: 'c1',
  messageId: 'm2',
  body: { targets: ['g1', 'g2'] },
  ...over,
})

async function setup<T>(use: () => T) {
  server.use(
    http.get(`${ORIGIN}/v1/chats/c1/messages`, () =>
      json({ items: range(1, 3), peer_read_seq: null }),
    ),
    http.get(`${ORIGIN}/v1/chats`, () => json({ items: [], next_cursor: '' })),
  )
  const m = mountSetup(() => ({ window: useChatMessages('c1'), write: use() }))
  await settleQueries(m.client)
  return m
}

describe('forwardChatMessage', () => {
  it('201: gövde {targets,note}; Idempotency-Key + CSRF + program; sonuç yalnız items', async () => {
    const m = await setup(useForwardChatMessage)
    const bodies: unknown[] = []
    server.use(
      http.post(FORWARD, async ({ request }) => {
        bodies.push(await request.clone().json())
        return json(
          {
            items: [
              { chat_id: 'g1', message_id: 'x1' },
              { chat_id: 'g2', message_id: 'x2' },
            ],
          },
          201,
        )
      }),
    )
    const out = await m.result.write.submit(
      forwardInput({ body: { targets: ['g1', 'g2'], note: 'Bakın' } }),
    )
    expect(out).toMatchObject({
      kind: 'success',
      status: 201,
      data: {
        items: [
          { chat_id: 'g1', message_id: 'x1' },
          { chat_id: 'g2', message_id: 'x2' },
        ],
      },
    })
    const call = sent('POST', '/v1/chats/c1/messages/m2/forward')[0]!
    expect(bodies).toEqual([{ targets: ['g1', 'g2'], note: 'Bakın' }])
    expect(call.headers.get('Idempotency-Key')).toBeTruthy()
    expect(call.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(call.headers.get('X-Nizamio-Program')).toBe('p1')
  })

  it('200 (anahtar tekrarı) da başarıdır; yeni mesaj gövdesi kaynaktan KURULMAZ: kaynak pencere değişmez', async () => {
    const m = await setup(useForwardChatMessage)
    const before = m.client.getQueryData<MessageWindow>(queryKeys.chats.messages(scope, 'c1'))!
    server.use(
      http.post(FORWARD, () => json({ items: [{ chat_id: 'c1', message_id: 'x1' }] }, 200)),
    )
    const out = await m.result.write.submit(forwardInput({ body: { targets: ['c1'] } }))
    expect(out).toMatchObject({ kind: 'success', status: 200 })
    const after = m.client.getQueryData<MessageWindow>(queryKeys.chats.messages(scope, 'c1'))!
    expect(seqs(after.items)).toEqual(seqs(before.items))
    expect(after.items).toEqual(before.items)
  })

  it('başarıda sohbet liste/ref/ek/sayaç okumaları geçersizlenir; mesaj penceresi geçersizlenmez', async () => {
    const m = await setup(useForwardChatMessage)
    const keys = {
      list: queryKeys.chats.list(scope, '', null, false),
      refs: queryKeys.chats.refs(scope, 'g1', 'file'),
      counts: queryKeys.chats.sharedCounts(scope, 'g2'),
      attachments: queryKeys.chats.attachments(scope, 'g1'),
      messages: queryKeys.chats.messages(scope, 'g1'),
    }
    for (const key of Object.values(keys)) m.client.setQueryData(key, { seeded: true })
    server.use(
      http.post(FORWARD, () => json({ items: [{ chat_id: 'g1', message_id: 'x1' }] }, 201)),
    )
    await m.result.write.submit(forwardInput())
    const state = (key: readonly unknown[]) => m.client.getQueryState(key)?.isInvalidated
    expect(state(keys.list)).toBe(true)
    expect(state(keys.refs)).toBe(true)
    expect(state(keys.counts)).toBe(true)
    expect(state(keys.attachments)).toBe(true)
    expect(state(keys.messages)).toBeFalsy()
  })

  it('404 (hedef/mesaj) ve 422: hata; hiçbir önbellek geçersizlenmez, pencere yazılmaz (hepsi ya da hiçbiri)', async () => {
    const m = await setup(useForwardChatMessage)
    const list = queryKeys.chats.list(scope, '', null, false)
    m.client.setQueryData(list, { seeded: true })
    for (const [code, status] of [
      ['messaging.chat_not_found', 404],
      ['messaging.input_invalid', 422],
    ] as const) {
      server.use(http.post(FORWARD, () => errorEnvelope(code, status)))
      const out = await m.result.write.submit(forwardInput())
      expect(out).toMatchObject({ kind: 'failed', error: { code } })
    }
    expect(m.client.getQueryState(list)?.isInvalidated).toBeFalsy()
  })

  it('ağ hatasında retry AYNI Idempotency-Key ve AYNI gövdeyle gider', async () => {
    const m = await setup(useForwardChatMessage)
    const bodies: unknown[] = []
    let n = 0
    server.use(
      http.post(FORWARD, async ({ request }) => {
        bodies.push(await request.clone().json())
        n += 1
        return n === 1
          ? HttpResponse.error()
          : json({ items: [{ chat_id: 'g1', message_id: 'x1' }] }, 200)
      }),
    )
    const first = await m.result.write.submit(forwardInput())
    expect(first.kind).toBe('unknown_outcome')
    if (first.kind !== 'unknown_outcome') return
    expect(await first.retry!()).toMatchObject({ kind: 'success' })
    const [a, b] = sent('POST', '/v1/chats/c1/messages/m2/forward')
    expect(b!.headers.get('Idempotency-Key')).toBe(a!.headers.get('Idempotency-Key'))
    expect(bodies[1]).toEqual(bodies[0])
  })
})

describe('archiveChatFile', () => {
  const input = (over = {}) => ({
    programId: 'p1',
    chatId: 'c1',
    clientMessageId: 'cm-arch',
    workItemId: 'w1',
    tag: 'plan',
    file: new File(['içerik'], 'plan.pdf', { type: 'application/pdf' }),
    ...over,
  })
  const answer = (status = 201) =>
    json({ file_id: 'f9', message: msg(4, { body: 'plan.pdf' }) }, status)

  it('201: multipart, Idempotency-Key + CSRF + program; cevaptaki GERÇEK mesaj pencereye yamanır', async () => {
    const m = await setup(useArchiveChatFile)
    server.use(http.post(ARCHIVE, () => answer(201)))
    const out = await m.result.write.submit(input())
    expect(out).toMatchObject({ kind: 'success', status: 201, data: { file_id: 'f9' } })
    const call = sent('POST', '/v1/chats/c1/archived-files')[0]!
    expect(call.headers.get('Idempotency-Key')).toBeTruthy()
    expect(call.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(call.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(call.headers.get('Content-Type')).toMatch(/^multipart\/form-data; boundary=/)
    const win = m.client.getQueryData<MessageWindow>(queryKeys.chats.messages(scope, 'c1'))!
    expect(seqs(win.items)).toEqual([1, 2, 3, 4])
  })

  it('200 (tekrar): ilk dosya/mesaj döner; pencere kopya eklemez (aynı mesaj kimliği)', async () => {
    const m = await setup(useArchiveChatFile)
    server.use(http.post(ARCHIVE, () => answer(200)))
    await m.result.write.submit(input())
    await m.result.write.submit(input({ clientMessageId: 'cm-arch' }))
    const win = m.client.getQueryData<MessageWindow>(queryKeys.chats.messages(scope, 'c1'))!
    expect(seqs(win.items)).toEqual([1, 2, 3, 4])
  })

  it('başarıda görevin dosyaları/arşiv/ayrıntı + sohbet ref/sayaç/liste geçersizlenir; başka görev ve cihaz ekleri değil', async () => {
    const m = await setup(useArchiveChatFile)
    const keys = {
      files: queryKeys.workItems.files(scope, 'w1'),
      otherFiles: queryKeys.workItems.files(scope, 'w2'),
      item: queryKeys.workItems.item(scope, 'w1'),
      archive: queryKeys.archive.list(scope, 'attachments', {}),
      refs: queryKeys.chats.refs(scope, 'c1', 'file'),
      counts: queryKeys.chats.sharedCounts(scope, 'c1'),
      otherRefs: queryKeys.chats.refs(scope, 'c9', 'file'),
      attachments: queryKeys.chats.attachments(scope, 'c1'),
    }
    for (const key of Object.values(keys)) m.client.setQueryData(key, { seeded: true })
    server.use(http.post(ARCHIVE, () => answer(201)))
    await m.result.write.submit(input())
    const state = (key: readonly unknown[]) => m.client.getQueryState(key)?.isInvalidated
    for (const k of ['files', 'item', 'archive', 'refs', 'counts'] as const)
      expect(state(keys[k]), k).toBe(true)
    for (const k of ['otherFiles', 'otherRefs', 'attachments'] as const)
      expect(state(keys[k]), k).toBeFalsy()
  })

  it('ağ hatasında retry AYNI Idempotency-Key ve AYNI client_message_id (vars) ile gider; 403/404/409/422 hataları ayrışır', async () => {
    const m = await setup(useArchiveChatFile)
    let n = 0
    server.use(
      http.post(ARCHIVE, () => {
        n += 1
        return n === 1 ? HttpResponse.error() : answer(200)
      }),
    )
    const first = await m.result.write.submit(input())
    expect(first.kind).toBe('unknown_outcome')
    if (first.kind !== 'unknown_outcome') return
    expect(await first.retry!()).toMatchObject({ kind: 'success' })
    const [a, b] = sent('POST', '/v1/chats/c1/archived-files')
    expect(b!.headers.get('Idempotency-Key')).toBe(a!.headers.get('Idempotency-Key'))
    for (const [code, status] of [
      ['records.not_authorized', 403],
      ['work.item_not_found', 404],
      ['messaging.idempotency_key_reused', 409],
      ['records.tag_invalid', 422],
    ] as const) {
      server.use(http.post(ARCHIVE, () => errorEnvelope(code, status)))
      expect(await m.result.write.submit(input())).toMatchObject({
        // 409 anahtar çakışması motorda ayrı sonuç sınıfıdır (otomatik tekrar yok).
        kind: code === 'messaging.idempotency_key_reused' ? 'idempotency_key_reused' : 'failed',
        error: { code },
      })
    }
  })
})
