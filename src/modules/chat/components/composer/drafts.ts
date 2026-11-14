/**
 * Sohbet taslakları (K2, mekanizma §9.6): modül düzeyi TEK depo, yalnız bellekte. Anahtar
 * `<hesap>:<program>:<sohbet>`; program ya da oturum değişince eski anahtarlara erişilmez,
 * ayrıca yazma çubuğu bu değişimlerde depoyu boşaltır (`Composer`).
 */
import { createDraftStore } from '../../model/draft'
import type { ChatMention } from '../../model/types'

export const chatDrafts = createDraftStore()

export function draftKey(
  accountId: string | null,
  programId: string | null,
  chatId: string,
): string {
  return `${accountId ?? '-'}:${programId ?? '-'}:${chatId}`
}

/** Metne eklenen bahsetme/görev çipleri: gönderimde yalnız gövdede hâlâ geçenler gider. */
export interface DraftChips {
  mentions: { token: string; mention: ChatMention }[]
  refs: { token: string; kind: 'task'; targetId: string }[]
}

const chips = new Map<string, DraftChips>()

export function chipsOf(key: string): DraftChips {
  let value = chips.get(key)
  if (!value) {
    value = { mentions: [], refs: [] }
    chips.set(key, value)
  }
  return value
}

export function clearChips(key: string): void {
  chips.delete(key)
}

/** Düzenleme başladığındaki gövde: çakışmada "ilk okunan taban" (K5 alan alan seçim). */
const editBases = new Map<string, string>()
export const editBase = {
  set: (key: string, body: string) => void editBases.set(key, body),
  get: (key: string) => editBases.get(key) ?? '',
  clear: (key: string) => void editBases.delete(key),
}

/** Testler ve oturum/kapsam değişimi: bütün taslaklar, çipler ve tabanlar silinir. */
export function resetDrafts(): void {
  chatDrafts.clearAll()
  chips.clear()
  editBases.clear()
}
