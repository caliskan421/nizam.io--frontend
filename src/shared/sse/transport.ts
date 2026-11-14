/**
 * Akış taşıyıcısı: mevcut http istemcisi (`api`) üzerinden `fetch` akışı. Belirteç ve kapsam
 * başlığı ara katmandan gelir (`Authorization`, `X-Nizamio-Program`); 401'de tek uçuş refresh
 * ve tek tekrar da orada yapılır (`createApiClient`). `EventSource` kullanılmaz (KESİN 34).
 * Açılış `sessionBound` kapısından geçer: oturum başka bir hesaba/nesle geçtiyse akış açılmaz,
 * geç gelen yanıt kullanılmaz.
 */
import { api } from '@/shared/http'
import { sessionBound } from '@/shared/session/query-session'

/** Akış uçları (`text/event-stream`). Yeni uç buraya açıkça eklenir. */
export type StreamPath = '/v1/chats/stream'

export interface OpenRequest {
  path: StreamPath
  programId: string
  signal: AbortSignal
  /** Sunucu `id:` çerçevesi yazdıysa son değer; yoksa `null` (bugün sunucu yazmaz). */
  lastEventId: string | null
}

export type OpenResult =
  | { kind: 'open'; body: ReadableStream<Uint8Array> }
  | { kind: 'rejected'; status: number; retryAfterMs: number | null }

export type StreamTransport = (request: OpenRequest) => Promise<OpenResult>

function retryAfterMs(response: Response): number | null {
  const raw = response.headers.get('Retry-After')
  if (raw === null) return null
  const seconds = Number(raw)
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds * 1000) : null
}

async function openOnce(request: OpenRequest): Promise<OpenResult> {
  const { data, response } = await api.GET(request.path, {
    params: { header: { 'X-Nizamio-Program': request.programId } },
    ...(request.lastEventId !== null ? { headers: { 'Last-Event-ID': request.lastEventId } } : {}),
    parseAs: 'stream',
    signal: request.signal,
  })
  if (!response.ok || !data) {
    return { kind: 'rejected', status: response.status, retryAfterMs: retryAfterMs(response) }
  }
  return { kind: 'open', body: data }
}

const gated = sessionBound(({ request }: { signal: AbortSignal; request: OpenRequest }) =>
  openOnce(request),
)

export const apiTransport: StreamTransport = (request) => gated({ signal: request.signal, request })
