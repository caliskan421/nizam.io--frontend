/**
 * Sohbet taslakları (10 `mekanizma.md` §9.6; K2): BELLEKTE tutulur, depolamaya YAZILMAZ (izinli
 * anahtar listesi yalnız kapsam + tema). Sohbet başına bir taslak; sohbet değişince korunur,
 * program/oturum değişince ve sayfa yenilenince kaybolur. Düzenleme kipinin taslağı ayrıdır
 * (düzenleme bitince önceki taslak geri gelir). Gönderim kimliği taslakla birlikte korunur
 * (ağ tekrarında aynı kimlik, K5); gövde değişince yeni kimlik.
 */
import { shallowReactive } from 'vue'

import { newClientMessageId } from './message-state'

export interface Draft {
  body: string
  /** Yanıtlanan mesaj kimliği (`reply_to_message_id`). */
  replyTo: string | null
  /** Bu taslağın gönderim kimliği; `body` değişince yenilenir. */
  clientMessageId: string
}

export interface EditDraft {
  messageId: string
  body: string
  /** Düzenleme başladığında okunan sürüm. */
  expectedRevision: number
}

export interface DraftStore {
  get: (chatId: string) => Draft | null
  /** Gövdeyi yazar; gövde DEĞİŞTİYSE yeni gönderim kimliği üretir. */
  setBody: (chatId: string, body: string) => Draft
  setReplyTo: (chatId: string, messageId: string | null) => void
  clear: (chatId: string) => void
  clearAll: () => void
  getEdit: (chatId: string) => EditDraft | null
  startEdit: (chatId: string, edit: EditDraft) => void
  setEditBody: (chatId: string, body: string) => void
  endEdit: (chatId: string) => void
}

export function createDraftStore(newId: () => string = newClientMessageId): DraftStore {
  const drafts = shallowReactive(new Map<string, Draft>())
  const edits = shallowReactive(new Map<string, EditDraft>())
  return {
    get: (chatId) => drafts.get(chatId) ?? null,
    setBody(chatId, body) {
      const prev = drafts.get(chatId)
      const next: Draft = {
        body,
        replyTo: prev?.replyTo ?? null,
        clientMessageId: prev && prev.body === body ? prev.clientMessageId : newId(),
      }
      drafts.set(chatId, next)
      return next
    },
    setReplyTo(chatId, messageId) {
      const prev = drafts.get(chatId)
      drafts.set(chatId, {
        body: prev?.body ?? '',
        replyTo: messageId,
        clientMessageId: prev?.clientMessageId ?? newId(),
      })
    },
    clear: (chatId) => void drafts.delete(chatId),
    clearAll() {
      drafts.clear()
      edits.clear()
    },
    getEdit: (chatId) => edits.get(chatId) ?? null,
    startEdit: (chatId, edit) => void edits.set(chatId, edit),
    setEditBody(chatId, body) {
      const prev = edits.get(chatId)
      if (prev) edits.set(chatId, { ...prev, body })
    },
    endEdit: (chatId) => void edits.delete(chatId),
  }
}
