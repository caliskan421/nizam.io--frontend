/**
 * Sohbet taslakları (10 `mekanizma.md` §9.6; K2): BELLEKTE tutulur, depolamaya YAZILMAZ (izinli
 * anahtar listesi yalnız kapsam + tema). Sohbet başına bir taslak; sohbet değişince korunur,
 * program/oturum değişince ve sayfa yenilenince kaybolur. Düzenleme kipinin taslağı ayrıdır
 * (düzenleme bitince önceki taslak geri gelir). Gönderim kimliği taslakla birlikte korunur
 * (ağ tekrarında aynı kimlik, K5); gönderim içeriği (gövde/yanıt/çip) değişince yeni kimlik.
 */
import { shallowReactive } from 'vue'

import { newClientMessageId } from './message-state'

export interface Draft {
  body: string
  /** Yanıtlanan mesaj kimliği (`reply_to_message_id`). */
  replyTo: string | null
  /** Bu taslağın gönderim kimliği; gönderim içeriği değişince yenilenir. */
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
  /**
   * Taslak nesli (CX-F7-Ö-04): her değişiklikte (gövde, yanıt bağlamı, temizlik) ARTAN sayaç. Eylem
   * başında yakalanır, sonuç yalnız AYNI sürüm için temizlik yapar (eski metne dönüş yeni sürümdür).
   */
  version: (chatId: string) => number
  /** Çip dizisi değişti (ekle/çıkar): sürümü ve gönderim kimliğini yeniler (Ö-04/Ö-06). */
  touch: (chatId: string) => void
  /** Düzenleme taslağının nesli (başlat / metin / bitir her seferinde artar). */
  editVersion: (chatId: string) => number
  getEdit: (chatId: string) => EditDraft | null
  startEdit: (chatId: string, edit: EditDraft) => void
  setEditBody: (chatId: string, body: string) => void
  endEdit: (chatId: string) => void
}

function withReply(prev: Draft | undefined, replyTo: string | null, newId: () => string): Draft {
  return {
    body: prev?.body ?? '',
    replyTo,
    clientMessageId: prev && prev.replyTo === replyTo ? prev.clientMessageId : newId(),
  }
}

export function createDraftStore(newId: () => string = newClientMessageId): DraftStore {
  const drafts = shallowReactive(new Map<string, Draft>())
  const edits = shallowReactive(new Map<string, EditDraft>())
  // Tek artan sayaç: silinip yeniden oluşan taslak eski sürüme DÖNMEZ.
  const versions = new Map<string, number>()
  const editVersions = new Map<string, number>()
  let counter = 0
  const bump = (map: Map<string, number>, chatId: string) => void map.set(chatId, ++counter)
  return {
    version: (chatId) => versions.get(chatId) ?? 0,
    touch(chatId) {
      const prev = drafts.get(chatId)
      if (prev) drafts.set(chatId, { ...prev, clientMessageId: newId() })
      bump(versions, chatId)
    },
    editVersion: (chatId) => editVersions.get(chatId) ?? 0,
    get: (chatId) => drafts.get(chatId) ?? null,
    setBody(chatId, body) {
      const prev = drafts.get(chatId)
      const next: Draft = {
        body,
        replyTo: prev?.replyTo ?? null,
        clientMessageId: prev && prev.body === body ? prev.clientMessageId : newId(),
      }
      drafts.set(chatId, next)
      if (!prev || prev.body !== body) bump(versions, chatId)
      return next
    },
    setReplyTo(chatId, messageId) {
      const prev = drafts.get(chatId)
      drafts.set(chatId, withReply(prev, messageId, newId))
      if ((prev?.replyTo ?? null) !== messageId) bump(versions, chatId)
    },
    clear(chatId) {
      drafts.delete(chatId)
      bump(versions, chatId)
    },
    clearAll() {
      drafts.clear()
      edits.clear()
      for (const id of [...versions.keys()]) bump(versions, id)
      for (const id of [...editVersions.keys()]) bump(editVersions, id)
    },
    getEdit: (chatId) => edits.get(chatId) ?? null,
    startEdit(chatId, edit) {
      edits.set(chatId, edit)
      bump(editVersions, chatId)
    },
    setEditBody(chatId, body) {
      const prev = edits.get(chatId)
      if (!prev) return
      edits.set(chatId, { ...prev, body })
      if (prev.body !== body) bump(editVersions, chatId)
    },
    endEdit(chatId) {
      edits.delete(chatId)
      bump(editVersions, chatId)
    },
  }
}
