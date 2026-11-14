/**
 * Okunmamış ayırıcının çapası (E-10-25): sohbete GİRİŞTE liste özetinin `unread_count`'u okunur ve
 * çapa DONDURULUR (sohbet açık kaldıkça yeni gelen mesajla kaymaz, ayırıcıyı büyütmez). Çapa
 * yüklü pencerede bulunamazsa en çok 3 ek `before` sayfası okunur; yine bulunamazsa ayırıcı
 * çizilmez. Özet henüz yoksa (derin bağlantı) çözüm beklenir.
 */
import { computed, ref, watch } from 'vue'

import { useChats } from '../../api/queries'
import { useChatPage } from '../../model/context'
import { unreadAnchorSeq } from './grouping'
import { useThread } from './use-thread'

export const ANCHOR_LOOKUP_PAGES = 3

interface Frozen {
  chatId: string
  seq: number | null
  count: number
}

export function useUnreadAnchor() {
  const page = useChatPage()
  const thread = useThread()
  const chats = useChats('')
  const summary = computed(
    () => chats.items.value.find((c) => c.chat_id === thread.chatId.value) ?? null,
  )
  const frozen = ref<Frozen | null>(null)
  let lookups = 0

  async function resolve(): Promise<void> {
    const id = thread.chatId.value
    const current = summary.value
    const items = page.messages.window.value.items
    if (frozen.value?.chatId === id || current === null || items.length === 0) return
    const count = current.unread_count
    if (count <= 0) {
      frozen.value = { chatId: id, seq: null, count: 0 }
      return
    }
    const seq = unreadAnchorSeq(items, count, thread.meId.value)
    if (seq !== null || lookups >= ANCHOR_LOOKUP_PAGES || !page.messages.window.value.hasOlder) {
      frozen.value = { chatId: id, seq, count }
      return
    }
    lookups += 1
    await page.messages.loadOlder()
    await resolve()
  }

  watch(
    () => thread.chatId.value,
    () => {
      frozen.value = null
      lookups = 0
    },
  )
  watch(
    [
      () => summary.value?.unread_count,
      () => page.messages.window.value.items.length,
      () => thread.chatId.value,
    ],
    () => void resolve(),
    { immediate: true },
  )

  return {
    anchor: computed(() =>
      frozen.value?.chatId === thread.chatId.value ? frozen.value.seq : null,
    ),
    count: computed(() => (frozen.value?.chatId === thread.chatId.value ? frozen.value.count : 0)),
    /** Çapa çözüldü (ya da sohbet listede yok / liste okunamadı): ilk iniş karar verebilir. */
    ready: computed(
      () =>
        frozen.value?.chatId === thread.chatId.value ||
        (chats.query.isFetched.value && summary.value === null),
    ),
    /** Liste özetindeki canlı okunmamış sayı; özet yoksa `null`. */
    unread: computed(() => summary.value?.unread_count ?? null),
  }
}
