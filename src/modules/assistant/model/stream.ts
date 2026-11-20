import { ApiError, clientError } from '@/shared/errors/api-error'
import { createSseParser, type SseFrame } from '@/shared/sse/parser'

import type { Answer, SuggestedView } from './types'

const VALID_ID = /^[A-Za-z0-9_-]{1,128}$/
const MAX_BYTES = 2 * 1024 * 1024
const STREAM_ERRORS = new Set([
  'assistant.limit_exceeded',
  'assistant.refused',
  'assistant.provider_unavailable',
  'platform.internal',
])

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function frameData(frame: SseFrame) {
  try {
    const decoded: unknown = JSON.parse(frame.data)
    if (object(decoded)) return decoded
  } catch {
    // An invalid frame never becomes a visible result.
  }
  throw clientError('client.network_error')
}

function readView(data: Record<string, unknown>): SuggestedView | null {
  return typeof data.gorunum === 'string' && object(data.filtre)
    ? { gorunum: data.gorunum, filtre: data.filtre }
    : null
}

function addView(views: SuggestedView[], data: Record<string, unknown>) {
  const view = readView(data)
  if (view) views.push(view)
}

function sourceNames(value: unknown) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((item): item is string => typeof item === 'string'))]
}

function streamFailure(code: unknown) {
  return new ApiError({
    code: typeof code === 'string' && STREAM_ERRORS.has(code) ? code : 'platform.internal',
  })
}

function completionId(value: unknown) {
  return typeof value === 'string' && VALID_ID.test(value) ? value : ''
}

function reduceStream(onTool: (label: string) => void) {
  const answer: Answer = { conversationId: '', text: '', sources: [], views: [] }
  let names: Record<string, unknown> = {}
  function onFrame(frame: SseFrame) {
    if (answer.conversationId) return
    const data = frameData(frame)
    switch (frame.event) {
      case 'metin':
        answer.text += typeof data.metin === 'string' ? data.metin : ''
        break
      case 'arac':
        if (typeof data.etiket === 'string') onTool(data.etiket)
        break
      case 'gorunum':
        addView(answer.views, data)
        break
      case 'kaynaklar':
        answer.sources = sourceNames(data.kaynaklar)
        break
      case 'adlar':
        if (object(data.adlar)) names = data.adlar
        break
      case 'hata':
        throw streamFailure(data.kod)
      case 'bitti':
        answer.conversationId = completionId(data.sohbet_id)
    }
  }
  return {
    onFrame,
    done: () => !!answer.conversationId,
    result() {
      if (!answer.conversationId) throw clientError('client.network_error')
      answer.text = answer.text.replace(/Üye-\d+\b/g, (alias) => {
        const name = names[alias]
        return typeof name === 'string' && name ? name : alias
      })
      return answer
    },
  }
}

/** One POST reply, with no reconnect or implicit resend. Only a terminal success commits text. */
export async function readAnswer(
  stream: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  onTool: (label: string) => void,
) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  const result = reduceStream(onTool)
  const parser = createSseParser({ onFrame: result.onFrame })
  const abort = () => {
    void reader.cancel().catch(() => undefined)
  }
  signal.addEventListener('abort', abort, { once: true })
  let received = 0
  try {
    while (!result.done()) {
      signal.throwIfAborted()
      const part = await reader.read()
      if (part.done) break
      received += part.value.byteLength
      if (received > MAX_BYTES) throw clientError('client.network_error')
      parser.feed(decoder.decode(part.value, { stream: true }))
    }
    signal.throwIfAborted()
    return result.result()
  } finally {
    signal.removeEventListener('abort', abort)
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}
