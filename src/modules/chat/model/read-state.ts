/**
 * Okundu durumu yenileme (BE-028): `read.updated` açık sohbette birebirde `peer_read_seq`'i,
 * grupta çağıranın kendi mesajlarındaki `read_by_all` tikini (`true`/`false`/`null`) geçmiş
 * cevabından tazeler. Yalnız bu iki alan yereli günceller (gövde/tepki/oy yerelde kalır; onlar
 * `message.updated` yolundadır); olay içeriği önbelleğe yazılmaz (KESİN 34).
 */
import { highSeq } from './window'
import type { MessageReader, WindowStore } from './window-io'

export async function refreshReadState(read: MessageReader, store: WindowStore): Promise<void> {
  const high = highSeq(store.get())
  const page = await read(high === null ? {} : { around: high })
  store.set((w) => ({
    ...w,
    peerReadSeq: page.peer_read_seq,
    items: w.items.map((m) => {
      const fresh = page.items.find((p) => p.message_id === m.message_id)
      if (fresh === undefined || !('read_by_all' in fresh)) return m
      return { ...m, read_by_all: fresh.read_by_all }
    }),
  }))
}
