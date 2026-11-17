// W160 · O3: sahte sohbet sunucusu girişi — bütün sohbet uçları tek listede (özgül yollar önce:
// `/v1/chats/stream`, `/candidates`, `/read-all`, `/direct`, `/groups` `:chatId` yolundan ÖNCE).
import { http } from 'msw'

import { ORIGIN, type OrgDb } from './fake-org'
import { createChatState, type ChatState } from './fake-chat'
import { groupHandlers } from './fake-chat-groups'
import { sharedHandlers } from './fake-chat-shared'
import { readHandlers } from './fake-chat-read'
import { streamHandlers } from './fake-chat-stream'
import { writeHandlers } from './fake-chat-write'

/**
 * `method path` isteğini sunucuya ulaştığı anda bekletir (`arrived` gelince çözülür; `release()`
 * yanıtı serbest bırakır). Bir kez tüketilir.
 */
export function holdChat(state: ChatState, method: string, test: RegExp) {
  let release!: () => void
  let arrived!: () => void
  const gate = new Promise<void>((resolve) => (release = resolve))
  const reached = new Promise<void>((resolve) => (arrived = resolve))
  state.holds.push({ method, test, gate, arrived })
  return { release, arrived: reached }
}

/** Bekletme kapısı: eşleşen bir tutma varsa istek sunucuya ulaşınca durur, serbest kalınca geçer. */
async function passGate(state: ChatState, request: Request): Promise<undefined> {
  const path = new URL(request.url).pathname
  const at = state.holds.findIndex((h) => h.method === request.method && h.test.test(path))
  if (at < 0) return undefined
  const [hold] = state.holds.splice(at, 1)
  hold!.arrived()
  await hold!.gate
  return undefined
}

export function chatHandlers(db: OrgDb, state: ChatState) {
  return [
    http.all(`${ORIGIN}/v1/chats`, ({ request }) => passGate(state, request)),
    http.all(`${ORIGIN}/v1/chats/*`, ({ request }) => passGate(state, request)),
    ...streamHandlers(db, state),
    ...sharedHandlers(db, state),
    ...groupHandlers(db, state),
    ...readHandlers(db, state),
    ...writeHandlers(db, state),
  ]
}

export { createChatState }
export type { ChatState }
