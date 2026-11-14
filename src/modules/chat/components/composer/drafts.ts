/**
 * Sohbet taslakları (K2, mekanizma §9.6): modül düzeyi TEK depo, yalnız bellekte. Anahtar
 * `<hesap>:<program>:<sohbet>`; program ya da oturum değişince eski anahtarlara erişilmez ve depo
 * BOŞALIR. Boşaltma yazma çubuğuna değil modül yaşamına bağlıdır (`bindDraftLifetime`): kapsam
 * değişince sayfa/yazma çubuğu yeniden kurulur, o örneğin izleyicisi çalışmadan sökülürdü
 * (KUSUR 8: program p1 → p2 → p1 sonrası eski taslak geri geliyordu).
 */
import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'

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

/**
 * Gönderim sonucu: YALNIZ gönderilen sürümün anahtarını temizler. Gönderim sürerken aynı alanda
 * metin değiştiyse (gövde artık gönderilenden farklı) yeni taslak ve çipleri korunur.
 */
export function settleSent(key: string, sentBody: string): void {
  const now = chatDrafts.get(key)
  if (now !== null && now.body !== sentBody) return
  chatDrafts.clear(key)
  clearChips(key)
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

let stopLifetime: (() => void) | null = null

/**
 * Depoyu program ve oturum (hesap/nesil) değişimine bağlar; tek sefer, sayfa sökülse de sürer.
 * Sayfa kurulumunda çağrılır (`ChatPage`).
 */
export function bindDraftLifetime(): void {
  if (stopLifetime !== null) return
  const scope = useScopeStore()
  const account = { id: authSession.snapshot.accountId, generation: authSession.generation }
  const offScope = scope.onChange((next, previous) => {
    if (next.programId !== previous.programId) resetDrafts()
  })
  const offSession = authSession.subscribe((snapshot) => {
    const changed =
      authSession.generation !== account.generation ||
      (snapshot.accountId !== null && snapshot.accountId !== account.id)
    account.id = snapshot.accountId
    account.generation = authSession.generation
    if (changed) resetDrafts()
  })
  stopLifetime = () => {
    offScope()
    void offSession()
  }
}

/** Testler: bağlantıyı söker (modül grafiği yeniden kurulmadan yeni Pinia ile bağlanabilsin). */
export function unbindDraftLifetime(): void {
  stopLifetime?.()
  stopLifetime = null
}
