/**
 * Okundu durumu yenileme (BE-028; TEK yol): `read.updated` açık sohbette birebirde `peer_read_seq`'i,
 * grupta çağıranın kendi mesajlarındaki `read_by_all` tikini (`true`/`false`/`null`) YÜKLÜ pencerenin
 * tamamı için geçmiş cevabından tazeler. Okuma `reconcile` ile aynı kalıptır: pencerenin üst
 * sınırından `before` sayfaları, alt sınıra ulaşınca durur; sayfa sayısı pencere boyuna bağlıdır
 * (`MAX_RECONCILE_PAGES` tavanı; tüm geçmiş taranmaz). Yalnız bu iki alan yereli günceller (gövde,
 * tepki, oy, pencere sınırları ve yerel yamalar korunur; mesaj ekleme/kaldırma yok). Olay içeriği
 * önbelleğe yazılmaz (KESİN 34); iptal/söküm/kapsam denetimi çağıran `run`/`windowStore` kapısındadır.
 */
import { MESSAGE_PAGE_LIMIT, coverageDone, highSeq, lowSeq, nextCursor } from './window'
import { MAX_RECONCILE_PAGES, type MessageReader, type WindowStore } from './window-io'
import type { ChatHistory } from './types'

function merge(page: ChatHistory, first: boolean) {
  return (w: ReturnType<WindowStore['get']>) => ({
    ...w,
    peerReadSeq: first ? page.peer_read_seq : w.peerReadSeq,
    items: w.items.map((m) => {
      const fresh = page.items.find((p) => p.message_id === m.message_id)
      if (fresh === undefined || !('read_by_all' in fresh)) return m
      return { ...m, read_by_all: fresh.read_by_all }
    }),
  })
}

export async function refreshReadState(read: MessageReader, store: WindowStore): Promise<void> {
  const low = lowSeq(store.get())
  const high = highSeq(store.get())
  if (low === null || high === null) {
    store.set(merge(await read({ limit: MESSAGE_PAGE_LIMIT }), true))
    return
  }
  let cursor = high + 1
  for (let pages = 0; pages < MAX_RECONCILE_PAGES; pages += 1) {
    const page = await read({ limit: MESSAGE_PAGE_LIMIT, before: cursor })
    store.set(merge(page, pages === 0))
    if (page.items.length === 0 || coverageDone(page.items, low)) return
    cursor = nextCursor(page.items)
  }
}
