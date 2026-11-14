<script setup lang="ts">
import './composer/composer.css'

import { ConflictDialog } from '@/shared/ui/conflict'
import { UiButton, UiIcon } from '@/shared/ui'

import { chatText } from '../messages'
import type { ChatMessage } from '../model/types'
import AttachMenu from './composer/AttachMenu.vue'
import ComposerBand from './composer/ComposerBand.vue'
import { COUNTER_FROM, MAX_MESSAGE_LENGTH } from './composer/send-body'
import SuggestList from './composer/SuggestList.vue'
import { useComposer } from './composer/use-composer'
import { useThread } from './thread/use-thread'

/**
 * Yazma çubuğu (E-10-50..61): çok satırlı alan, Enter gönderir / Shift+Enter yeni satır
 * (bileşim sürerken ve dokunmatik girişte Enter yeni satır), sohbet başına bellek taslağı (K2),
 * yanıt ve düzenleme şeridi, `@` ve `#` önerileri, Ekle menüsü, tek dosya yükleme, "yazıyor"
 * sinyali (en çok 3 sn'de bir). Optimistik balon yok; gönderim durumu `message-state`'tedir.
 */
const props = defineProps<{
  chatId: string
  /** Yanıtlanan mesaj kimliği (`reply_to_message_id`); yazma çubuğu taslakla eşler. */
  replyTo?: string
}>()
const emit = defineEmits<{ sent: [message: ChatMessage] }>()

const thread = useThread()
const {
  field,
  fileInput,
  plusBtn,
  menuOpen,
  draft,
  edit,
  text,
  sender,
  editor,
  uploader,
  suggest,
  showSuggest,
  notice,
  busy,
  canSend,
  replied,
  bandTitle,
  onInput,
  syncCaret,
  submit,
  pick,
  onKeydown,
  closeMenu,
  onAttach,
  onFile,
  cancelReply,
} = useComposer(thread, props, (m) => emit('sent', m))
</script>

<template>
  <form
    class="chat-composer"
    :class="{ 'chat-composer--edit': edit !== null }"
    :data-chat-id="chatId"
    data-testid="chat-composer"
    @submit.prevent="void submit()"
  >
    <p v-if="sender.peerLeft.value" class="chat-composer__closed" role="status">
      {{ chatText('chat.composer.peerLeft') }}
    </p>
    <template v-else>
      <AttachMenu
        v-if="menuOpen"
        :poll="thread.caps.value?.createPoll === true"
        @pick="onAttach"
        @close="(r) => closeMenu(r === 'escape')"
      />
      <SuggestList
        v-if="showSuggest && suggest.sign.value"
        :options="suggest.options.value"
        :active="suggest.index.value"
        :kind="suggest.sign.value"
        :id-prefix="`chat-sg-${chatId}`"
        :has-more="suggest.hasMore.value"
        :loading="suggest.loading.value"
        @pick="pick"
        @more="suggest.loadMore"
      />
      <ComposerBand
        v-if="edit || draft?.replyTo"
        :title="bandTitle"
        :text="edit ? '' : (replied?.body ?? '')"
        @cancel="edit ? editor.cancel() : cancelReply()"
      />
      <div class="chat-composer__row">
        <button
          ref="plusBtn"
          type="button"
          class="chat-composer__btn"
          :aria-label="chatText('chat.composer.attach')"
          aria-haspopup="menu"
          :aria-expanded="menuOpen"
          :disabled="edit !== null"
          @click="menuOpen = !menuOpen"
        >
          <UiIcon name="plus" size="sm" />
        </button>
        <textarea
          ref="field"
          class="chat-composer__field"
          rows="1"
          :value="text"
          :maxlength="MAX_MESSAGE_LENGTH"
          :placeholder="chatText('chat.composer.placeholder')"
          :aria-label="chatText('chat.composer.label')"
          :aria-controls="showSuggest ? `chat-sg-${chatId}-list` : undefined"
          :aria-expanded="showSuggest"
          :aria-activedescendant="
            showSuggest && suggest.options.value.length > 0
              ? `chat-sg-${chatId}-${suggest.index.value}`
              : undefined
          "
          @input="onInput"
          @keydown="onKeydown"
          @keyup="syncCaret"
          @click="syncCaret"
        />
        <button
          type="submit"
          class="chat-composer__btn chat-composer__btn--send"
          :aria-label="
            busy
              ? chatText('chat.composer.sending')
              : edit
                ? chatText('chat.composer.save')
                : chatText('chat.composer.send')
          "
          :disabled="!canSend"
        >
          <UiIcon name="chat-send" size="sm" />
        </button>
      </div>
      <input ref="fileInput" type="file" hidden data-testid="chat-file" @change="onFile" />
      <div
        v-if="uploader.uploading.value"
        class="chat-composer__progress"
        role="progressbar"
        :aria-label="chatText('chat.composer.uploading')"
      />
      <p v-if="text.length >= COUNTER_FROM" class="chat-composer__meta">
        {{ chatText('chat.composer.counter', { n: text.length, max: MAX_MESSAGE_LENGTH }) }}
      </p>
      <div v-if="notice" class="chat-composer__notice" role="alert">
        <template v-if="notice.kind === 'unverified'">
          <span>{{ chatText('chat.composer.unverified') }}</span>
          <UiButton size="sm" @click="void sender.retry()">{{
            chatText('chat.composer.retry')
          }}</UiButton>
        </template>
        <span v-else-if="notice.kind === 'error'">{{ notice.text }}</span>
        <span v-else-if="notice.kind === 'rate'">{{ chatText('chat.composer.rateLimited') }}</span>
        <span v-else-if="notice.kind === 'mention'">{{
          chatText('chat.composer.mentionRejected')
        }}</span>
        <span v-else-if="notice.kind === 'replyGone'">{{
          chatText('chat.composer.replyGone')
        }}</span>
        <span v-else>{{ chatText('chat.composer.messageDeleted') }}</span>
      </div>
    </template>
    <ConflictDialog
      v-model:open="editor.conflict.open.value"
      :fields="editor.conflict.fields.value"
      @resolve="editor.conflict.choose"
      @cancel="editor.conflict.dismiss"
    />
  </form>
</template>
