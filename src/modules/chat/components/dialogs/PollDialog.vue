<script setup lang="ts">
/**
 * "Anket oluştur" (E-10-58 → E-10-93…100): yalnız grupta (birebirde sunucu 422 `poll`; pencere
 * açılsa da gönderim reddedilir). Soru = mesaj gövdesi (≤200), 2–10 seçenek (tek satır, ≤100,
 * tekrarsız), tek/çoklu seçim, isteğe bağlı son tarih; "Anonim" devre dışı + BE-161. Gönderim
 * `sendChatMessage` + `poll`: istemci mesaj kimliği gönderim başına BİR kez üretilir, ağ
 * tekrarı aynı kimlik + aynı gövdeyle (K5; "Yeniden gönder").
 */
import './dialogs.css'

import { computed, ref } from 'vue'

import { useScopeStore } from '@/shared/scope/store'
import {
  DesignStub,
  UiButton,
  UiField,
  UiHint,
  UiIconButton,
  UiInput,
  UiModal,
  UiSegmented,
} from '@/shared/ui'
import { UiOutcomeNotice } from '@/shared/ui/confirm'
import type { UiChoiceOption } from '@/shared/ui'

import { useChat } from '../../api/queries'
import { useSendChatMessage } from '../../api/writes'
import { chatText } from '../../messages'
import { newClientMessageId } from '../../model/message-state'
import { CHAT_STUBS } from '../../model/stubs'
import {
  POLL_OPTION_MAX,
  POLL_OPTIONS_MAX,
  POLL_OPTIONS_MIN,
  POLL_QUESTION_MAX,
  toPollBody,
  validatePoll,
  type PollError,
} from './forms'
import { useDialogWrite } from './use-dialog-write'

const props = defineProps<{ chatId: string }>()
const emit = defineEmits<{ close: [] }>()

const store = useScopeStore()
const chat = useChat(() => props.chatId)
const send = useSendChatMessage()
const write = useDialogWrite()

const question = ref('')
const options = ref<string[]>(['', ''])
const multi = ref<'single' | 'multi'>('single')
const closesLocal = ref('')
const invalid = ref<PollError | null>(null)

const anonymousEnabled = CHAT_STUBS.anonymousPoll.enabled
const pending = computed(() => send.isPending.value)
const chatName = computed(() => chat.data.value?.name ?? '')

const kinds = computed<UiChoiceOption<'single' | 'multi'>[]>(() => [
  { value: 'single', label: chatText('chat.dialogs.pollForm.single') },
  { value: 'multi', label: chatText('chat.dialogs.pollForm.multi') },
])

function addOption(): void {
  if (options.value.length < POLL_OPTIONS_MAX) options.value = [...options.value, '']
}
function removeOption(index: number): void {
  if (options.value.length > POLL_OPTIONS_MIN) {
    options.value = options.value.filter((_, i) => i !== index)
  }
}
function setOption(index: number, value: string): void {
  options.value = options.value.map((o, i) => (i === index ? value : o))
}
function setMulti(value: 'single' | 'multi' | null): void {
  if (value !== null) multi.value = value
}

function sentOk(): void {
  emit('close')
}

async function submit(): Promise<void> {
  const draft = {
    question: question.value,
    options: options.value,
    multi: multi.value === 'multi',
    closesLocal: closesLocal.value,
  }
  invalid.value = validatePoll(draft, Date.now())
  const programId = store.programId
  if (invalid.value !== null || pending.value || programId === null) return
  const outcome = await send.submit({
    programId,
    chatId: props.chatId,
    body: toPollBody(draft, newClientMessageId()),
  })
  write.settle(outcome, sentOk)
}

function resolved(outcome: unknown): void {
  write.settle(outcome as Parameters<typeof write.settle<never>>[0], sentOk)
}

function setOpen(): void {
  if (!pending.value) emit('close')
}
const errorText = (e: PollError | null) => (e ? chatText(`chat.dialogs.pollForm.error.${e}`) : '')
</script>

<template>
  <UiModal
    :open="true"
    :title="chatText('chat.dialogs.poll')"
    :description="chatText('chat.dialogs.pollForm.description', { name: chatName })"
    :dismissible="!pending"
    @update:open="setOpen"
  >
    <form id="chat-poll" class="chat-dlg chat-dlg__form" novalidate @submit.prevent="submit">
      <UiField
        :label="chatText('chat.dialogs.pollForm.question')"
        :error="
          invalid === 'questionRequired' || invalid === 'questionTooLong'
            ? errorText(invalid)
            : write.fieldErrors.value.poll
        "
      >
        <UiInput v-model="question" name="question" data-autofocus />
      </UiField>
      <UiHint data-testid="dlg-question-count">
        {{
          chatText('chat.dialogs.common.count', {
            n: question.trim().length,
            max: POLL_QUESTION_MAX,
          })
        }}
      </UiHint>
      <fieldset class="chat-dlg__group">
        <legend class="chat-dlg__label">
          {{ chatText('chat.dialogs.pollForm.options') }}
          <span data-testid="dlg-option-count">
            {{
              chatText('chat.dialogs.common.count', { n: options.length, max: POLL_OPTIONS_MAX })
            }}
          </span>
        </legend>
        <div v-for="(option, index) in options" :key="index" class="chat-dlg__option">
          <UiInput
            :model-value="option"
            :aria-label="chatText('chat.dialogs.pollForm.optionN', { n: index + 1 })"
            :placeholder="chatText('chat.dialogs.pollForm.optionN', { n: index + 1 })"
            :maxlength="POLL_OPTION_MAX"
            @update:model-value="setOption(index, $event)"
          />
          <UiIconButton
            icon="trash"
            :label="chatText('chat.dialogs.pollForm.removeOption')"
            :disabled="options.length <= POLL_OPTIONS_MIN"
            @click="removeOption(index)"
          />
        </div>
        <UiButton
          variant="ghost"
          size="sm"
          icon="plus"
          :disabled="options.length >= POLL_OPTIONS_MAX"
          data-testid="dlg-add-option"
          @click="addOption"
        >
          {{ chatText('chat.dialogs.pollForm.addOption') }}
        </UiButton>
        <UiHint
          v-if="
            invalid === 'optionsMin' ||
            invalid === 'optionTooLong' ||
            invalid === 'optionsDuplicate'
          "
          error
        >
          {{ errorText(invalid) }}
        </UiHint>
      </fieldset>
      <UiSegmented
        :model-value="multi"
        :options="kinds"
        :label="chatText('chat.dialogs.pollForm.choice')"
        @update:model-value="setMulti"
      />
      <div class="chat-dlg__seg-row">
        <span class="chat-dlg__label">{{ chatText('chat.dialogs.pollForm.visibility') }}</span>
        <span class="chat-dlg__stub" data-testid="dlg-visibility">
          <UiButton variant="secondary" size="sm" disabled aria-pressed="true">
            {{ chatText('chat.dialogs.pollForm.named') }}
          </UiButton>
          <DesignStub id="BE-161">
            <UiButton
              variant="secondary"
              size="sm"
              :disabled="!anonymousEnabled"
              data-testid="dlg-anonymous"
            >
              {{ chatText('chat.dialogs.pollForm.secret') }}
            </UiButton>
          </DesignStub>
        </span>
      </div>
      <UiField
        :label="chatText('chat.dialogs.pollForm.closes')"
        :hint="chatText('chat.dialogs.pollForm.closesHint')"
        :error="
          invalid === 'closesInvalid' || invalid === 'closesPast' ? errorText(invalid) : undefined
        "
      >
        <input v-model="closesLocal" class="t-input" type="datetime-local" name="closes" />
      </UiField>
      <UiHint v-if="write.message.value" error role="alert" data-testid="dlg-error">
        {{ write.message.value }}
      </UiHint>
      <UiOutcomeNotice :outcome="write.notice.value" @resolved="resolved" />
    </form>
    <template #footer>
      <UiButton variant="ghost" :disabled="pending" @click="setOpen">
        {{ chatText('chat.dialogs.common.cancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        type="submit"
        form="chat-poll"
        :disabled="pending"
        data-testid="dlg-submit"
      >
        {{ chatText('chat.dialogs.pollForm.send') }}
      </UiButton>
    </template>
  </UiModal>
</template>
