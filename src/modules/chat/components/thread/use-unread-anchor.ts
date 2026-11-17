/**
 * Okunmamış ayırıcının çapası (E-10-25, BE-082): sohbete GİRİŞTE liste özetinin sunucu
 * `first_unread_seq` değeri okunur ve çapa DONDURULUR (sohbet açık kaldıkça yeni gelen mesajla
 * kaymaz). Ayırıcı `unread_count`'tan ya da `read_seq`'ten TÜRETİLMEZ (üyelik başlangıcı ve
 * kendi mesajı kuralları sunucudadır); `unread_count` yalnız ayırıcı metnindeki sayıdır. Çapa
 * yüklü pencerede yoksa pencere `around=<first_unread_seq>` ile yeniden kurulur; pencere boş
 * kalırsa ayırıcı çizilmez. Bağlantıyla gelinen açık hedef (`?mesaj=<seq>`) varsayılan okunmamış
 * açılışından önceliklidir: pencere HEDEFE kurulur, çapa yalnız ayırıcı konumu olarak dondurulur
 * (çapa pencereye sonradan girerse ayırıcı çizilir); okunmamışa atlama yapılmaz. Özet henüz yoksa (derin bağlantı) çözüm beklenir.
 *
 * Sohbet liste özetinde yoksa (ilk sayfanın dışında eski sohbet / derin bağlantı) kaynak, HER
 * GİRİŞTE tek hafif geçmiş okumasının (`readFirstUnread`, `limit=1`) sayfadan bağımsız
 * `first_unread_seq` değeridir. Pencere önbelleği çapa taşımaz: önbellekteki pencere eski girişin
 * ayırıcısını yaşatamaz (önbellek ömrü ≠ giriş ömrü); çapa yalnız bu girişin dondurulmuş
 * yerel değeridir. Özet VARSA her zaman öncelikli (anchor + sayı); geçmiş kaynağında güvenilir
 * sayı yoktur (`count = null` → genel "Okunmamış mesajlar"; sayı seq'ten türetilmez). Çapa bir
 * kez dondurulunca özetin sonradan gelmesi onu değiştirmez.
 */
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { useChats } from '../../api/queries'
import { useChatPage } from '../../model/context'
import { linkTargetSeq } from './link-target'
import { useThread } from './use-thread'

interface Frozen {
  chatId: string
  seq: number | null
  /** `null` = güvenilir sayı yok (özet yok). */
  count: number | null
}

/** Çapa yüklü pencerede yoksa pencere `around=<seq>` ile kurulur; çapa pencerede mi döner. */
async function openAround(
  messages: ReturnType<typeof useChatPage>['messages'],
  seq: number,
): Promise<boolean> {
  const has = () => messages.window.value.items.some((m) => m.seq === seq)
  if (!has()) await messages.jumpTo(seq)
  return has()
}

interface AnchorSource {
  seq: number | null
  count: number | null
}

/** Çapa kaynağı: önce liste özeti; liste okundu ve sohbet yoksa ilk geçmiş sayfası (sayı yok). */
function anchorSource(
  summary: { first_unread_seq: number | null; unread_count: number } | null,
  historySeq: number | null | undefined,
  listFetched: boolean,
): AnchorSource | null {
  if (summary !== null) return { seq: summary.first_unread_seq, count: summary.unread_count }
  return listFetched && historySeq !== undefined ? { seq: historySeq, count: null } : null
}

/** Bu girişin taze geçmiş okuması: sohbet listede yoksa girişte bir kez okunur; yanıt girişe bağlıdır. */
function useEntryRead(listFetched: () => boolean, hasSummary: () => boolean) {
  const page = useChatPage()
  const thread = useThread()
  const entry = ref<{ chatId: string; seq: number | null } | null>(null)
  let generation = 0
  let loading: string | null = null

  async function load(): Promise<void> {
    const id = thread.chatId.value
    if (hasSummary() || !listFetched() || entry.value?.chatId === id || loading === id) return
    loading = id
    const mine = ++generation
    const seq = await page.messages.readFirstUnread()
    if (mine !== generation) return
    loading = null
    if (thread.chatId.value === id) entry.value = { chatId: id, seq: seq ?? null }
  }
  watch(
    () => thread.chatId.value,
    () => {
      entry.value = null
      loading = null
      generation += 1
    },
  )
  watch([listFetched, hasSummary, () => thread.chatId.value], () => void load(), {
    immediate: true,
  })
  return computed(() => (entry.value?.chatId === thread.chatId.value ? entry.value.seq : undefined))
}

function useAnchorSource() {
  const thread = useThread()
  const chats = useChats('')
  const summary = computed(
    () => chats.items.value.find((c) => c.chat_id === thread.chatId.value) ?? null,
  )
  const entrySeq = useEntryRead(
    () => chats.query.isFetched.value,
    () => summary.value !== null,
  )
  const source = computed(() =>
    anchorSource(summary.value, entrySeq.value, chats.query.isFetched.value),
  )
  return { summary, source }
}

export function useUnreadAnchor() {
  const page = useChatPage()
  const thread = useThread()
  const route = useRoute()
  const { summary, source } = useAnchorSource()
  const frozen = ref<Frozen | null>(null)
  let resolving: string | null = null

  async function resolve(): Promise<void> {
    const id = thread.chatId.value
    const current = source.value
    if (current === null || frozen.value?.chatId === id || resolving === id) return
    const seq = current.seq
    if (seq === null) {
      frozen.value = { chatId: id, seq: null, count: 0 }
      return
    }
    if (page.messages.query.isPending.value || page.messages.query.isError.value) return
    if (linkTargetSeq(route.query.mesaj) !== null) {
      frozen.value = { chatId: id, seq, count: current.count }
      return
    }
    resolving = id
    const found = await openAround(page.messages, seq)
    resolving = null
    if (thread.chatId.value === id) {
      frozen.value = { chatId: id, seq: found ? seq : null, count: current.count }
    }
  }

  watch(
    () => thread.chatId.value,
    () => {
      frozen.value = null
      resolving = null
    },
  )
  watch(
    [
      () => source.value?.seq,
      () => source.value === null,
      () => page.messages.query.isPending.value,
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
    /** Çapa çözüldü (bu girişin taze kaynağı okundu; pencere okunamadıysa da): ilk iniş karar verebilir. */
    ready: computed(
      () =>
        frozen.value?.chatId === thread.chatId.value ||
        (source.value !== null && page.messages.query.isError.value),
    ),
    /** Liste özetindeki canlı okunmamış sayı; özet yoksa `null`. */
    unread: computed(() => summary.value?.unread_count ?? null),
  }
}
