import { clientError } from '@/shared/errors/api-error'
import { api, unwrap } from '@/shared/http'
import { unwrapList } from '@/shared/http/truncation'

import { readAnswer } from '../model/stream'
import type { Question } from '../model/types'

const header = (program: string) => ({ 'X-Nizamio-Program': program })
const entity = (program: string, id: string) => ({ header: header(program), path: { id } })

export function listConversations(program: string, signal: AbortSignal) {
  return unwrapList(
    api.GET('/v1/assistant/conversations', {
      params: { header: header(program) },
      signal,
      cache: 'no-store',
    }),
  )
}

export function readConversation(program: string, id: string, signal: AbortSignal) {
  return unwrap(
    api.GET('/v1/assistant/conversations/{id}', {
      params: entity(program, id),
      signal,
      cache: 'no-store',
    }),
  )
}

export function deleteConversation(program: string, id: string, signal: AbortSignal) {
  return unwrap(
    api.DELETE('/v1/assistant/conversations/{id}', {
      params: entity(program, id),
      signal,
    }),
  )
}

export async function askAssistant(
  program: string,
  body: Question,
  signal: AbortSignal,
  onTool: (label: string) => void,
) {
  const pending = api.POST('/v1/assistant/chat', {
    params: { header: header(program) },
    headers: { Accept: 'text/event-stream' },
    body,
    parseAs: 'stream',
    cache: 'no-store',
    signal,
  })
  const response = await pending
  const stream = await unwrap(pending)
  if (
    !response.response.headers.get('content-type')?.toLowerCase().startsWith('text/event-stream') ||
    !stream
  ) {
    throw clientError('client.network_error')
  }
  return readAnswer(stream, signal, onTool)
}
