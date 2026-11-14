// W160 · O3: sahte sohbet sunucusu girişi — bütün sohbet uçları tek listede (özgül yollar önce:
// `/v1/chats/stream`, `/candidates`, `/read-all`, `/direct`, `/groups` `:chatId` yolundan ÖNCE).
import type { OrgDb } from './fake-org'
import { createChatState, type ChatState } from './fake-chat'
import { groupHandlers } from './fake-chat-groups'
import { readHandlers } from './fake-chat-read'
import { streamHandlers } from './fake-chat-stream'
import { writeHandlers } from './fake-chat-write'

export function chatHandlers(db: OrgDb, state: ChatState) {
  return [
    ...streamHandlers(db, state),
    ...groupHandlers(db, state),
    ...readHandlers(db, state),
    ...writeHandlers(db, state),
  ]
}

export { createChatState }
export type { ChatState }
