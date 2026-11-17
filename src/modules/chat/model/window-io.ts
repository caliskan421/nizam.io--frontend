/**
 * Pencere okuma düzenleyicisi (istemci-akislari §10.3, §10.5): `MessageReader` ile sayfaları okur,
 * her adımı `WindowStore` üzerinden GÜNCEL pencereye uygular (yerel yazma yamaları — gönderim,
 * düzenleme, silme — araya girse de kaybolmaz). Saf pencere işlemleri `window.ts`'tedir.
 */
import {
  MESSAGE_PAGE_LIMIT,
  appendNewer,
  applyCoverage,
  coverageDone,
  highSeq,
  lowSeq,
  nextCursor,
  prependOlder,
  windowFromAround,
  windowFromLatest,
  type MessageWindow,
} from './window'
import type { ChatHistory, MessageQuery } from './types'

export type MessageReader = (query: MessageQuery) => Promise<ChatHistory>

export interface WindowStore {
  get: () => MessageWindow
  set: (update: (current: MessageWindow) => MessageWindow) => void
}

/** Sayfa döngülerinde sonsuz okumaya karşı tavan (sayfa sayısı; süre değil). */
export const MAX_NEWER_PAGES = 20
export const MAX_RECONCILE_PAGES = 20

const query = (extra: MessageQuery): MessageQuery => ({ limit: MESSAGE_PAGE_LIMIT, ...extra })

/** İlk açılış: son sayfa (imleçsiz). */
export async function loadLatest(read: MessageReader, store: WindowStore): Promise<void> {
  const page = await read(query({}))
  store.set(() => windowFromLatest(page.items, page.peer_read_seq))
}

/** `around=<seq>`: alıntı/sabit/bağlantı hedefi; pencere YENİDEN kurulur. */
export async function loadAround(
  read: MessageReader,
  store: WindowStore,
  seq: number,
): Promise<void> {
  const page = await read(query({ around: seq }))
  store.set(() => windowFromAround(page.items, page.peer_read_seq, seq))
}

/** Yukarı kaydırma: `before=<alt seq>`. Pencere boşsa son sayfa okunur. */
export async function loadOlder(read: MessageReader, store: WindowStore): Promise<void> {
  const low = lowSeq(store.get())
  if (low === null) return loadLatest(read, store)
  const page = await read(query({ before: low }))
  store.set((w) => prependOlder(w, page.items))
}

/**
 * Yeni mesajlar: `after=<üst seq>`; sayfa dolu döndükçe son dönen `seq` ile tekrar (§10.5).
 * Pencerenin üstü sohbetin sonuna ulaşınca `hasNewer` kapanır.
 */
export async function loadNewer(read: MessageReader, store: WindowStore): Promise<void> {
  for (let pages = 0; pages < MAX_NEWER_PAGES; pages += 1) {
    const high = highSeq(store.get())
    if (high === null) return loadLatest(read, store)
    const page = await read(query({ after: high }))
    store.set((w) => appendNewer(w, page.items, page.peer_read_seq))
    if (page.items.length < MESSAGE_PAGE_LIMIT) return
  }
}

/**
 * `message.updated`: tek mesaj okuma ucu yoktur; yerel `seq` çevresi `around` ile okunur ve dönen
 * kayıt (gövde, `edited_at`, tepki, oy, sabit, görev) yereli günceller. Pencere GENİŞLEMEZ.
 */
export async function refreshAround(
  read: MessageReader,
  store: WindowStore,
  seq: number,
): Promise<void> {
  const page = await read(query({ around: seq }))
  store.set((w) => {
    const items = w.items.map((m) => page.items.find((p) => p.message_id === m.message_id) ?? m)
    return { ...w, items, peerReadSeq: page.peer_read_seq ?? w.peerReadSeq }
  })
}

/**
 * Yeniden bağlanma uzlaştırması (§10.5): (1) yeni mesajlar `after=<Ü>`; (2) görünür pencere
 * `before=<Ü+1>` ile sayfa sayfa yeniden okunur — kapsanan aralıkta dönmeyen yerel kayıt
 * silinmiş sayılır. Pencere boşsa ilk açılış gibi son sayfa okunur.
 */
export async function reconcile(read: MessageReader, store: WindowStore): Promise<void> {
  const before = store.get()
  const low = lowSeq(before)
  const high = highSeq(before)
  if (low === null || high === null) return loadLatest(read, store)
  await loadNewer(read, store)
  let cursor = high + 1
  for (let pages = 0; pages < MAX_RECONCILE_PAGES; pages += 1) {
    const page = await read(query({ before: cursor }))
    store.set((w) => applyCoverage(w, page.items, cursor))
    if (coverageDone(page.items, low)) return
    cursor = nextCursor(page.items)
  }
}
