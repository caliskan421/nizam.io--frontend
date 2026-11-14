<script setup lang="ts">
/**
 * Konuşma listesi (10 / 10b: E-10-03…E-10-15; P54, P59, P62, P64). Veri `useChats(q)` (imleçli,
 * SUNUCU sırası; istemci yeniden sıralamaz, yetki süzmez — P64). Arama sunucuda (`q`, 300 ms),
 * süzgeç sekmeleri yüklenen sayfalarda istemcide (BE-081) ve URL `?filtre=` ile taşınır; sekme
 * sayacı kesin `unread_chats` değeridir (E-10-07). `select`: satır → `/mesajlar/:chatId`;
 * `create`: "Yeni konuşma" → Yeni grup penceresi (sahibi `ChatPage`; kapanınca odak düğmeye döner).
 */
import { computed, ref, useId } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { toApiError } from '@/shared/errors/api-error'
import { useInstanceStore } from '@/shared/instance/store'
import { useProgramDepartments } from '@/shared/scope/program-departments'
import { useSessionStore } from '@/shared/session/store'
import { UiButton, UiEmptyState, UiErrorState, UiIconButton, UiInput } from '@/shared/ui'

import { useChats, useChatUnreadOverview } from '../api/queries'
import { chatText } from '../messages'
import ChatFilterTabs from './list/ChatFilterTabs.vue'
import type { ChatListHandle } from './list/handle'
import ChatRow from './list/ChatRow.vue'
import { applyFilter, FILTER_QUERY, parseFilter, type ChatFilter } from './list/chat-view'
import { useChatSearch } from './list/use-chat-search'

import './list/chat-list.css'

defineProps<{
  /** Seçili sohbet (`aria-current` yalnız onda). */
  selectedId?: string
}>()

defineEmits<{
  select: [chatId: string]
  create: [mode: 'group' | 'direct']
}>()

const route = useRoute()
const router = useRouter()
const root = ref<HTMLElement | null>(null)
const listId = `chat-list-${useId()}`

const filter = computed<ChatFilter>({
  get: () => parseFilter(route.query.filtre),
  set: (next) => {
    const query = { ...route.query }
    if (next === 'all') delete query.filtre
    else query.filtre = FILTER_QUERY[next]
    void router.replace({ query })
  },
})

const search = useChatSearch()
const chats = useChats(search.term)
const overview = useChatUnreadOverview()
const unreadChats = computed(() => overview.selected.value?.unread_chats ?? null)

const visible = computed(() => applyFilter(chats.items.value, filter.value))
const hasMore = computed(() => chats.query.hasNextPage.value === true)
const loadingMore = computed(() => chats.query.isFetchingNextPage.value)
const failed = computed(() => chats.query.isError.value)
const loading = computed(() => chats.query.isPending.value && !failed.value)
const failure = computed(() => toApiError(chats.query.error.value))
const searching = computed(() => search.term.value !== '')
const showList = computed(() => !loading.value && visible.value.length > 0)
const showEmpty = computed(
  () => !loading.value && !failed.value && visible.value.length === 0 && !hasMore.value,
)
const trulyEmpty = computed(() => !searching.value && filter.value === 'all')

const session = useSessionStore()
const instance = useInstanceStore()
const timeZone = computed(() => instance.profile?.timezone ?? 'Europe/Istanbul')
// Satırlar yeniden okununca "bugün/dün" tazelenir.
const now = computed(() => {
  void chats.items.value
  return new Date()
})
const departments = useProgramDepartments(() =>
  chats.items.value.some((chat) => chat.auto_kind === 'department' || chat.source === 'department'),
)
const codeOf = (departmentId: string | null): string | undefined =>
  departmentId === null ? undefined : departments.byId.value.get(departmentId)?.code

function retry(): void {
  void chats.query.refetch()
}

function rowOf(chatId: string): HTMLElement | null {
  const rows = root.value?.querySelectorAll<HTMLElement>('[data-chat-id]') ?? []
  return [...rows].find((row) => row.dataset.chatId === chatId) ?? null
}

const handle: ChatListHandle = {
  /** Geri/kapanış sonrası odak o konuşma satırına döner; satır yoksa `false`. */
  focusRow(chatId: string): boolean {
    const row = rowOf(chatId)
    row?.focus()
    return row !== null
  },
  focusCreate(): boolean {
    const button = root.value?.querySelector<HTMLElement>('[data-testid="chat-new"]') ?? null
    button?.focus()
    return button !== null
  },
  focusSearch(): boolean {
    const input = root.value?.querySelector<HTMLElement>('[data-testid="chat-search"]') ?? null
    input?.focus()
    return input !== null
  },
}
defineExpose(handle)
</script>

<template>
  <section
    ref="root"
    class="chat-list"
    :aria-label="chatText('chat.list.listLabel')"
    data-testid="chat-list-pane"
  >
    <div class="chat-list__head">
      <div class="chat-list__title">
        <h1 class="chat-list__h1">{{ chatText('chat.list.title') }}</h1>
        <UiIconButton
          icon="edit"
          :label="chatText('chat.list.newChatLabel')"
          data-testid="chat-new"
          @click="$emit('create', 'group')"
        />
      </div>
      <UiInput
        v-model="search.text.value"
        icon="search"
        :placeholder="chatText('chat.list.search')"
        :aria-label="chatText('chat.list.searchLabel')"
        :maxlength="100"
        data-testid="chat-search"
        @keydown.enter.prevent="search.flush()"
      />
      <ChatFilterTabs
        v-model="filter"
        :unread-count="unreadChats"
        :controls="showList ? listId : undefined"
      />
    </div>
    <div class="chat-list__scroll">
      <p v-if="filter !== 'all' && hasMore && !loading" class="chat-list__hint">
        {{ chatText('chat.list.loadedHint') }}
      </p>
      <p v-if="loading" class="chat-list__status" role="status" data-testid="chat-list-loading">
        {{ chatText('chat.states.loading') }}
      </p>
      <ul
        v-if="showList"
        :id="listId"
        class="chat-list__items"
        role="list"
        :aria-label="chatText('chat.list.listLabel')"
      >
        <li v-for="chat in visible" :key="chat.chat_id">
          <ChatRow
            :chat="chat"
            :selected="chat.chat_id === selectedId"
            :department-code="codeOf(chat.source_department_id)"
            :me-account-id="session.accountId"
            :now="now"
            :time-zone="timeZone"
            @select="$emit('select', $event)"
          />
        </li>
      </ul>
      <UiEmptyState
        v-if="showEmpty"
        :title="chatText(trulyEmpty ? 'chat.states.empty' : 'chat.states.noMatch')"
        data-testid="chat-list-empty"
      >
        <template v-if="trulyEmpty" #action>
          <UiButton size="sm" variant="primary" @click="$emit('create', 'group')">
            {{ chatText('chat.list.newChat') }}
          </UiButton>
        </template>
      </UiEmptyState>
      <UiErrorState
        v-if="failed"
        :error="failure"
        :title="chatText('chat.states.error')"
        retryable
        :retrying="chats.query.isFetching.value"
        data-testid="chat-list-error"
        @retry="retry"
      />
      <div v-if="hasMore && !loading && !failed" class="chat-list__more">
        <UiButton size="sm" :disabled="loadingMore" @click="chats.loadMore()">
          {{ chatText(loadingMore ? 'chat.states.loadingMore' : 'chat.list.more') }}
        </UiButton>
      </div>
    </div>
  </section>
</template>
