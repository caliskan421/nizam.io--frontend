<script setup lang="ts">
/**
 * "Mesajdan görev oluştur" (E-10-48 → E-10-86…92; yalnız ŞY ve koordinatör, `capabilities`):
 * kaynak mesaj alıntısı, başlık (≤255; boşsa sunucu gövdenin ilk 100 karakterini kullanır), hedef
 * koordinatörlük (tek seçimli çipler, zorunlu), atanan (isteğe bağlı çoklu), başlangıç/bitiş.
 * `Idempotency-Key` form gönderimi başına bir kez (`useCreateTaskFromChatMessage`); mesajda
 * `task_ids` doluysa göndermeden onay (sunucu engellemez). Başarıda mesaj yereli güncellenir
 * (veri katmanı), pencere sonucu ve `/gorevler?gorev=` bağlantısını gösterir (P61).
 */
import './dialogs.css'

import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useDepartmentRoster } from '@/modules/organization/public'
import { TASKS_ROUTE } from '@/modules/work/public'
import { useProgramDepartments } from '@/shared/scope/program-departments'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiCheck, UiField, UiHint, UiModal, UiInput } from '@/shared/ui'
import { UiOutcomeNotice, useConfirm } from '@/shared/ui/confirm'

import { useCreateTaskFromChatMessage } from '../../api/writes'
import { chatText } from '../../messages'
import { canCreateTaskFromMessage, taskTargetDepartments } from '../../model/capabilities'
import { useChatPage } from '../../model/context'
import { findMessage } from '../../model/window'
import MessageTasks from '../thread/MessageTasks.vue'
import { TASK_TITLE_MAX, localDay, toTaskBody, validateTask, type TaskError } from './forms'
import { useChatActor } from './use-actor'
import { useDialogWrite } from './use-dialog-write'

const props = defineProps<{ chatId: string; messageId: string; seq: number }>()
const emit = defineEmits<{ close: [] }>()

const router = useRouter()
const store = useScopeStore()
const page = useChatPage()
const { actor } = useChatActor()
const { confirmWrite } = useConfirm()
const create = useCreateTaskFromChatMessage()
const write = useDialogWrite()

const message = computed(() => findMessage(page.messages.window.value, props.messageId))
const allowed = computed(() => canCreateTaskFromMessage(actor.value))

const departments = useProgramDepartments()
const targets = computed(() => {
  const all = departments.query.data.value?.departments ?? []
  const ids = new Set(
    taskTargetDepartments(
      actor.value,
      all.map((d) => d.department_id),
    ),
  )
  return all.filter((d) => ids.has(d.department_id))
})

const title = ref('')
const departmentId = ref('')
const assignees = ref<string[]>([])
const startOn = ref('')
const endOn = ref('')
const errors = ref<Partial<Record<string, TaskError>>>({})
const created = ref<string | null>(null)

// Tek hedef varsa seçili gelir (ör. tek birimin koordinatörü).
watch(
  targets,
  (list) => {
    if (departmentId.value === '' && list.length === 1) departmentId.value = list[0]!.department_id
  },
  { immediate: true },
)
watch(departmentId, () => {
  assignees.value = []
})

const roster = useDepartmentRoster(() => (departmentId.value === '' ? null : departmentId.value))
const pending = computed(() => create.isPending.value)

function toggleAssignee(accountId: string, on: boolean): void {
  const rest = assignees.value.filter((id) => id !== accountId)
  assignees.value = on ? [...rest, accountId] : rest
}

async function submit(): Promise<void> {
  const draft = {
    title: title.value,
    departmentId: departmentId.value,
    assigneeIds: assignees.value,
    startOn: startOn.value,
    endOn: endOn.value,
  }
  errors.value = validateTask(draft, localDay(new Date()))
  const programId = store.programId
  if (Object.keys(errors.value).length > 0 || pending.value || programId === null) return
  const vars = {
    programId,
    chatId: props.chatId,
    messageId: props.messageId,
    seq: props.seq,
    body: toTaskBody(draft),
  }
  const second = (message.value?.task_ids.length ?? 0) > 0
  const outcome = second
    ? await confirmWrite(
        {
          title: chatText('chat.dialogs.task.secondTitle'),
          body: [chatText('chat.dialogs.task.second')],
          confirmLabel: chatText('chat.dialogs.task.secondConfirm'),
          tone: 'primary',
        },
        (context) => create.submit(vars, { context }),
      )
    : await create.submit(vars)
  if (outcome === null) return
  write.settle(outcome, (data) => {
    created.value = data.work_item_id
  })
}

function resolved(outcome: unknown): void {
  write.settle(outcome as Parameters<typeof write.settle<{ work_item_id: string }>>[0], (data) => {
    created.value = data.work_item_id
  })
}

function openTask(): void {
  const id = created.value
  emit('close')
  if (id !== null) void router.push({ name: TASKS_ROUTE.name, query: { gorev: id } })
}

function setOpen(): void {
  if (!pending.value) emit('close')
}

const errorOf = (field: string): string | undefined => {
  const e = errors.value[field]
  return e ? chatText(`chat.dialogs.task.error.${e}`) : write.fieldErrors.value[field]
}
const sender = computed(() => message.value?.sender_name ?? '')
</script>

<template>
  <UiModal
    :open="true"
    :title="chatText('chat.dialogs.taskFromMessage')"
    :dismissible="!pending"
    @update:open="setOpen"
  >
    <div v-if="created !== null" class="chat-dlg" data-testid="dlg-task-done">
      <p role="status">{{ chatText('chat.dialogs.task.done') }}</p>
    </div>
    <form v-else id="chat-task" class="chat-dlg chat-dlg__form" novalidate @submit.prevent="submit">
      <UiHint v-if="!allowed" error role="alert" data-testid="dlg-task-denied">
        {{ chatText('chat.dialogs.task.denied') }}
      </UiHint>
      <blockquote v-if="message" class="chat-dlg__quote" data-testid="dlg-task-quote">
        <strong v-if="sender">{{ sender }}</strong>
        <span class="rp-trunc">{{ message.body }}</span>
      </blockquote>
      <MessageTasks
        v-if="message && message.task_ids.length > 0"
        :chat-id="chatId"
        :message-id="messageId"
      />
      <UiField :label="chatText('chat.dialogs.task.title')" :error="errorOf('title')">
        <UiInput v-model="title" name="title" data-autofocus />
      </UiField>
      <UiHint>
        {{ chatText('chat.dialogs.common.count', { n: title.trim().length, max: TASK_TITLE_MAX }) }}
        · {{ chatText('chat.dialogs.task.titleHint') }}
      </UiHint>
      <fieldset class="chat-dlg__group">
        <legend class="chat-dlg__label">{{ chatText('chat.dialogs.task.department') }}</legend>
        <div class="chat-dlg__chips" data-testid="dlg-task-departments">
          <button
            v-for="d in targets"
            :key="d.department_id"
            type="button"
            class="chat-dlg__chip"
            :aria-pressed="departmentId === d.department_id"
            @click="departmentId = d.department_id"
          >
            {{ d.display_name }}
          </button>
        </div>
        <UiHint v-if="errorOf('departmentId')" error>{{ errorOf('departmentId') }}</UiHint>
        <UiHint>{{ chatText('chat.dialogs.task.departmentHint') }}</UiHint>
      </fieldset>
      <fieldset v-if="departmentId !== ''" class="chat-dlg__group">
        <legend class="chat-dlg__label">{{ chatText('chat.dialogs.task.assignee') }}</legend>
        <p v-if="roster.query.isPending.value" role="status">
          {{ chatText('chat.states.loading') }}
        </p>
        <label v-for="m in roster.active.value" :key="m.account_id" class="chat-dlg__check">
          <UiCheck
            :model-value="assignees.includes(m.account_id)"
            @update:model-value="toggleAssignee(m.account_id, $event)"
          />
          <span class="rp-trunc">{{ m.full_name }}</span>
        </label>
        <UiHint v-if="write.fieldErrors.value.assignee_account_ids" error>
          {{ write.fieldErrors.value.assignee_account_ids }}
        </UiHint>
      </fieldset>
      <div class="chat-dlg__row2">
        <UiField :label="chatText('chat.dialogs.task.startOn')" :error="errorOf('startOn')">
          <input v-model="startOn" class="t-input" type="date" name="startOn" />
        </UiField>
        <UiField :label="chatText('chat.dialogs.task.endOn')" :error="errorOf('endOn')">
          <input v-model="endOn" class="t-input" type="date" name="endOn" />
        </UiField>
      </div>
      <UiHint>{{ chatText('chat.dialogs.task.linkNote') }}</UiHint>
      <UiHint v-if="write.message.value" error role="alert" data-testid="dlg-error">
        {{ write.message.value }}
      </UiHint>
      <UiOutcomeNotice :outcome="write.notice.value" @resolved="resolved" />
    </form>
    <template #footer>
      <template v-if="created !== null">
        <UiButton variant="ghost" @click="emit('close')">
          {{ chatText('chat.dialogs.common.close') }}
        </UiButton>
        <UiButton variant="primary" data-testid="dlg-open-task" @click="openTask">
          {{ chatText('chat.dialogs.task.open') }}
        </UiButton>
      </template>
      <template v-else>
        <UiButton variant="ghost" :disabled="pending" @click="setOpen">
          {{ chatText('chat.dialogs.common.cancel') }}
        </UiButton>
        <UiButton
          variant="primary"
          type="submit"
          form="chat-task"
          :disabled="pending || !allowed"
          data-testid="dlg-submit"
        >
          {{ chatText('chat.dialogs.task.create') }}
        </UiButton>
      </template>
    </template>
  </UiModal>
</template>
