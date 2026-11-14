<script setup lang="ts">
import './thread.css'

import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { UiButton } from '@/shared/ui'

import { useChatPage } from '../../model/context'
import { chatText } from '../../messages'
import { buildEntries } from './grouping'
import { dayName, fullDay } from './format'
import MessageRow from './MessageRow.vue'
import { useReadMarker } from './use-read-marker'
import { useScrollFollow } from './use-scroll-follow'
import { useThread } from './use-thread'
import { useUnreadAnchor } from './use-unread-anchor'

/**
 * Mesaj akışı (E-10-24..49): gün ayırıcıları, okunmamış ayırıcı, ardışık gruplama, balonlar.
 * Pencere sahibi `ChatPage`'dir (`useChatPage`); burada yalnız çizilir, kaydırma ve okundu
 * işaretlenir. Tek menü tek seferde açıktır; dışarı tık ve Esc kapatır; satır sökülürse odak
 * listeye düşer (gövdeye değil). Durumlar: yükleniyor / hata / boş (K7).
 */
defineProps<{ loading: boolean; failed: boolean }>()
const emit = defineEmits<{ retry: [] }>()

const page = useChatPage()
const thread = useThread()
const route = useRoute()
const list = ref<HTMLElement | null>(null)
const open = ref<{ id: string; kind: 'react' | 'more' } | null>(null)
const toolsId = ref<string | null>(null)

watch(list, (el) => void (thread.listEl.value = el), { immediate: true })
const win = computed(() => page.messages.window.value)
const unread = useUnreadAnchor()
const entries = computed(() =>
  buildEntries(win.value.items, {
    meId: thread.meId.value,
    unreadAnchor: unread.anchor.value,
    unreadCount: unread.count.value,
  }),
)

const follow = useScrollFollow({
  list,
  items: () => win.value.items,
  chatId: () => thread.chatId.value,
  ready: () => unread.ready.value,
  initialTarget: () => (unread.anchor.value === null ? null : '[data-testid="chat-unread"]'),
  hasOlder: () => win.value.hasOlder,
  hasNewer: () => win.value.hasNewer,
  loadOlder: () => page.messages.loadOlder(),
  loadNewer: () => page.messages.loadNewer(),
})
const marker = useReadMarker({
  list,
  items: () => win.value.items,
  chatId: () => thread.chatId.value,
  programId: () => thread.programId.value,
  meId: () => thread.meId.value,
  hasNewer: () => win.value.hasNewer,
  unread: () => unread.unread.value,
})
watch(
  () => thread.stickBottom.value,
  async () => {
    await nextTick()
    follow.toBottom()
  },
)
function onScroll(): void {
  follow.onScroll()
  marker.touch()
}
watch(() => win.value.items, marker.touch)
watch(
  () => thread.highlightSeq.value,
  async (seq) => {
    if (seq === null) return
    await nextTick()
    const row = list.value?.querySelector<HTMLElement>(`[data-seq="${seq}"]`)
    row?.scrollIntoView?.({ block: 'center' })
  },
)
// Bağlantıyla gelişte (`?mesaj=<seq>`) hedef mesajın çevresi yüklenir ve vurgulanır.
watch(
  () => [route.query.mesaj, thread.chatId.value] as const,
  ([raw]) => {
    const seq = Number(typeof raw === 'string' ? raw : '')
    if (Number.isInteger(seq) && seq > 0) void thread.goTo(seq)
  },
  { immediate: true },
)

function dayLabel(iso: string): string {
  const name = dayName(iso, new Date())
  return name === null
    ? fullDay(iso)
    : chatText(`chat.thread.${name === 'today' ? 'today' : 'yesterday'}`)
}
function setMenu(id: string, kind: 'react' | 'more' | null): void {
  open.value = kind === null ? null : { id, kind }
}
function onFocusLost(): void {
  void nextTick(() => list.value?.focus())
}
// Satır kalkınca (silme) odak gövdeye düşmesin.
watch(
  () => entries.value.map((e) => e.key).join('|'),
  (now, was) => {
    if (was !== undefined && now.length < was.length && document.activeElement === document.body) {
      void nextTick(() => list.value?.focus())
    }
  },
)
function onDocumentPointer(event: PointerEvent): void {
  if (open.value && !(event.target as HTMLElement).closest('.msg-row')) open.value = null
}
watch(open, (now, was) => {
  if (now && !was) document.addEventListener('pointerdown', onDocumentPointer)
  if (!now && was) document.removeEventListener('pointerdown', onDocumentPointer)
})
</script>

<template>
  <div
    ref="list"
    class="msg-list"
    tabindex="-1"
    role="log"
    :aria-label="chatText('chat.thread.region')"
    :aria-busy="loading"
    data-testid="msg-list"
    @scroll.passive="onScroll"
  >
    <div v-if="loading && entries.length === 0" class="msg-list__state" role="status">
      <span class="chat-skeleton" />
      <span class="chat-skeleton chat-skeleton--me" />
      <span class="chat-skeleton" />
      <span>{{ chatText('chat.thread.loading') }}</span>
    </div>
    <div v-else-if="failed && entries.length === 0" class="msg-list__state" role="alert">
      <span>{{ chatText('chat.thread.error') }}</span>
      <UiButton @click="emit('retry')">{{ chatText('chat.thread.retry') }}</UiButton>
    </div>
    <div v-else-if="entries.length === 0" class="msg-list__state" data-testid="chat-empty">
      <span>{{ chatText('chat.thread.empty') }}</span>
    </div>
    <template v-else>
      <UiButton
        v-if="win.hasOlder"
        class="msg-list__more"
        :disabled="follow.loadingOlder.value"
        @click="void follow.older()"
      >
        {{
          follow.loadingOlder.value
            ? chatText('chat.thread.olderLoading')
            : chatText('chat.thread.older')
        }}
      </UiButton>
      <template v-for="entry in entries" :key="entry.key">
        <div v-if="entry.type === 'day'" class="chat-sep">
          <span>{{ dayLabel(entry.iso) }}</span>
        </div>
        <div
          v-else-if="entry.type === 'unread'"
          class="chat-sep chat-sep--new"
          data-testid="chat-unread"
        >
          <span>{{ chatText('chat.thread.unreadDivider', { n: entry.count }) }}</span>
        </div>
        <MessageRow
          v-else
          :message="entry.message"
          :mine="entry.mine"
          :first="entry.first"
          :last="entry.last"
          :menu="open?.id === entry.message.message_id ? open.kind : null"
          :tools="toolsId === entry.message.message_id"
          @menu="(kind) => setMenu(entry.message.message_id, kind)"
          @tools="(on) => (toolsId = on ? entry.message.message_id : null)"
          @focus-lost="onFocusLost"
        />
      </template>
      <UiButton
        v-if="win.hasNewer"
        class="msg-list__more"
        :disabled="follow.loadingNewer.value"
        @click="void follow.newer()"
      >
        {{ chatText('chat.thread.newer') }}
      </UiButton>
    </template>
  </div>
</template>
