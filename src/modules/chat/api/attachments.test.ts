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
import { chatDownloadPath, useChatDownload, useSendChatAttachment } from './attachments'
import { useChatMessages } from './message-window'

// Tarayıcıda `structuredClone(File)` yine `File` döndürür; jsdom'da Node'un özgün işlevi jsdom
// `FormData`'sının kabul etmediği nesne üretir. Yazma motoru gövdeyi dondururken (`freezeVars`)
// tarayıcı davranışı korunsun: Blob değişmezdir, aynen taşınır (work `files.test.ts` kalıbı).
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

describe('ek yükleme', () => {
  const input = (over = {}) => ({
    programId: 'p1',
    chatId: 'c1',
    clientMessageId: 'cm-att',
    file: new File(['içerik'], 'rapor.pdf', { type: 'application/pdf' }),
    ...over,
  })

  async function setup() {
    server.use(
      http.get(`${ORIGIN}/v1/chats/c1/messages`, () =>
        json({ items: range(1, 3), peer_read_seq: null }),
      ),
      http.get(`${ORIGIN}/v1/chats`, () => json({ items: [], next_cursor: '' })),
    )
    const m = mountSetup(() => ({ window: useChatMessages('c1'), send: useSendChatAttachment() }))
    await settleQueries(m.client)
    return m
  }

  it('multipart: client_message_id SORGUda, anahtar başlığı yok, CSRF var; açıklama dosyadan ÖNCE; pencereye yamanır', async () => {
    const m = await setup()
    server.use(
      http.post(`${ORIGIN}/v1/chats/c1/attachments`, () => {
        // Gövde burada OKUNMAZ (jsdom `FormData` + msw gövde okuması asılır; work `files.test.ts`
        // aynı kalıp). Parça sırası `model/attachments.test.ts`'te sınanır.
        return json(
          msg(4, {
            body: '',
            attachments: [
              {
                attachment_id: 'a1',
                file_name: 'rapor.pdf',
                content_type: 'application/pdf',
                size_bytes: 6,
              },
            ],
          }),
          201,
        )
      }),
    )
    const out = await m.result.send.submit(input({ caption: 'Bakın', replyToMessageId: 'm2' }))
    expect(out).toMatchObject({ kind: 'success', status: 201 })
    const call = sent('POST', '/v1/chats/c1/attachments')[0]!
    expect(call.query.get('client_message_id')).toBe('cm-att')
    expect(call.query.get('reply_to_message_id')).toBe('m2')
    expect(call.headers.get('Idempotency-Key')).toBeNull()
    expect(call.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(call.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(call.headers.get('Content-Type')).toMatch(/^multipart\/form-data; boundary=/)
    const win = m.client.getQueryData<MessageWindow>(queryKeys.chats.messages(scope, 'c1'))!
    expect(seqs(win.items)).toEqual([1, 2, 3, 4])
    expect(win.items.at(-1)!.attachments[0]!.file_name).toBe('rapor.pdf')
  })

  it('açıklamasız yükleme yalnız file parçası taşır; reply_to yoksa sorguda yok', async () => {
    const m = await setup()
    server.use(http.post(`${ORIGIN}/v1/chats/c1/attachments`, () => json(msg(4), 200)))
    const out = await m.result.send.submit(input())
    expect(out).toMatchObject({ kind: 'success', status: 200 })
    expect(sent('POST', '/v1/chats/c1/attachments')[0]!.query.get('reply_to_message_id')).toBeNull()
  })

  it('ağ hatasında retry aynı kimlik ve aynı dosyayla gider', async () => {
    const m = await setup()
    let n = 0
    server.use(
      http.post(`${ORIGIN}/v1/chats/c1/attachments`, () => {
        n += 1
        return n === 1 ? HttpResponse.error() : json(msg(4), 200)
      }),
    )
    const first = await m.result.send.submit(input())
    expect(first.kind).toBe('unknown_outcome')
    if (first.kind !== 'unknown_outcome') return
    expect(await first.retry!()).toMatchObject({ kind: 'success' })
    const posts = sent('POST', '/v1/chats/c1/attachments')
    expect(posts.map((p) => p.query.get('client_message_id'))).toEqual(['cm-att', 'cm-att'])
  })

  it.each([
    ['messaging.file_too_large', 422],
    ['messaging.file_rejected', 422],
    ['messaging.input_invalid', 422],
    ['messaging.message_deleted', 409],
  ])('%s sonuç olarak döner; pencere değişmez', async (code, status) => {
    const m = await setup()
    server.use(http.post(`${ORIGIN}/v1/chats/c1/attachments`, () => errorEnvelope(code, status)))
    expect(await m.result.send.submit(input())).toMatchObject({
      kind: 'failed',
      error: { code },
    })
    const win = m.client.getQueryData<MessageWindow>(queryKeys.chats.messages(scope, 'c1'))!
    expect(seqs(win.items)).toEqual([1, 2, 3])
  })
})

describe('ek / paylaşılan dosya indirme (bilet akışı)', () => {
  const created: Blob[] = []
  beforeEach(() => {
    created.length = 0
    Object.assign(URL, {
      createObjectURL: (blob: Blob) => {
        created.push(blob)
        return `blob:${created.length}`
      },
      revokeObjectURL: () => undefined,
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
  })

  it('yollar: ek ve paylaşılan dosya; kimlik kodlanır', () => {
    const base = { programId: 'p1', fallbackName: 'x' }
    expect(chatDownloadPath({ ...base, kind: 'attachment', id: 'a/1' })).toBe(
      '/v1/chat-attachments/a%2F1',
    )
    expect(chatDownloadPath({ ...base, kind: 'shared-file', id: 'r1' })).toBe(
      '/v1/chat-file-refs/r1',
    )
  })

  it('bilet: S1 + program başlığı bilete yazılır, hedef yol kapalı listeden; sonra tüketilir ve kaydedilir', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, () =>
        json({ ticket: 'tk1', url: '/v1/downloads/tk1', expires_at: '2026-11-14T10:01:00Z' }, 201),
      ),
      http.get(`${ORIGIN}/v1/downloads/tk1`, () =>
        HttpResponse.arrayBuffer(new Uint8Array([1, 2]).buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="rapor.pdf"; filename*=UTF-8''rapor%20%C3%BC.pdf`,
          },
        }),
      ),
    )
    const m = mountSetup(() => useChatDownload())
    const result = await m.result.start({
      programId: 'p1',
      kind: 'attachment',
      id: 'a1',
      fallbackName: 'ek',
    })
    expect(result).toEqual({ kind: 'saved', fileName: 'rapor ü.pdf' })
    const issue = sent('POST', '/v1/download-tickets')[0]!
    expect(issue.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(issue.headers.get('Idempotency-Key')).toBeNull()
    expect(created).toHaveLength(1)
  })

  it('mesaj silinmiş/üye değil: bilet 404 message_not_found → failed (artık yok)', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, () =>
        json({ ticket: 'tk2', url: '/v1/downloads/tk2', expires_at: '2026-11-14T10:01:00Z' }, 201),
      ),
      http.get(`${ORIGIN}/v1/downloads/tk2`, () =>
        errorEnvelope('messaging.message_not_found', 404),
      ),
    )
    const m = mountSetup(() => useChatDownload())
    const result = await m.result.start({
      programId: 'p1',
      kind: 'shared-file',
      id: 'r1',
      fallbackName: 'dosya',
    })
    expect(result).toMatchObject({ kind: 'failed', error: { code: 'messaging.message_not_found' } })
    expect(created).toHaveLength(0)
  })
})
