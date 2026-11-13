<script setup lang="ts">
import { computed, ref, shallowRef, useId, watch } from 'vue'

import { targetOf, useAddNote, type WorkItem } from '@/modules/work/public'
import type { MutationOutcome } from '@/shared/http/mutation'
import { UiButton, UiField, UiModal, UiSelect, useToast } from '@/shared/ui'
import { outcomeText, UiOutcomeNotice } from '@/shared/ui/confirm'

import { homeText } from '../../model/messages'

/**
 * "Not yaz" penceresi (E-Ü1-20; P3): görev seçici (bana atananlar) + not. `addWorkItemNote`
 * (s.144: şirket yöneticisi reddedilir — pencere yalnız yazabilenlere açılır); `Idempotency-Key`
 * "Kaydet" başına; "sonuç bilinmiyor"da taslak korunur, yeniden gönderme aynı anahtarla.
 * Uzunluk sınırı uydurulmaz (şemada yok); boş içerik gönderilmez.
 */
const props = defineProps<{ items: readonly WorkItem[] }>()
const open = defineModel<boolean>('open', { default: false })

type Outcome = MutationOutcome<unknown, unknown, unknown>

const add = useAddNote()
const toast = useToast()
const formId = `u1-note-${useId()}`
const taskId = ref('')
const content = ref('')
const tried = ref(false)
const outcome = shallowRef<Outcome | null>(null)
const pending = add.isPending

const taskOptions = computed(() =>
  props.items.map((i) => ({ value: i.work_item_id, label: i.title })),
)
const selected = computed(() => props.items.find((i) => i.work_item_id === taskId.value) ?? null)
const taskError = computed(() =>
  tried.value && !selected.value ? homeText('home.u1.dialog.required') : undefined,
)
const noteError = computed(() =>
  tried.value && content.value.trim() === '' ? homeText('home.u1.dialog.required') : undefined,
)
const inlineError = computed(() => {
  const o = outcome.value
  if (!o || o.kind === 'success' || o.kind === 'unknown_outcome' || o.kind === 'edit_conflict') {
    return null
  }
  return outcomeText(o)
})

watch(open, (isOpen) => {
  if (!isOpen) return
  taskId.value = props.items.length === 1 ? (props.items[0]?.work_item_id ?? '') : ''
  content.value = ''
  tried.value = false
  outcome.value = null
  add.reset()
})

function finish(result: Outcome): void {
  if (result.kind === 'success') {
    toast.push({ message: homeText('home.u1.dialog.noted') })
    open.value = false
    return
  }
  outcome.value = result
}

async function submit(): Promise<void> {
  tried.value = true
  const item = selected.value
  const text = content.value.trim()
  if (!item || text === '' || pending.value) return
  outcome.value = null
  finish(
    await add.submit({
      target: targetOf(item),
      workItemId: item.work_item_id,
      content: text,
    }),
  )
}
</script>

<template>
  <UiModal
    v-model:open="open"
    :title="homeText('home.u1.dialog.noteTitle')"
    :dismissible="!pending"
  >
    <div class="role-home-dialog">
      <p v-if="items.length === 0" class="rh-region-empty" data-empty>
        {{ homeText('home.u1.dialog.noTasks') }}
      </p>
      <form v-else :id="formId" class="rh-form" novalidate @submit.prevent="submit">
        <UiField :label="homeText('home.u1.dialog.task')" :error="taskError">
          <UiSelect
            v-model="taskId"
            data-testid="u1-note-task"
            :options="taskOptions"
            :placeholder="homeText('home.u1.dialog.taskPlaceholder')"
            :disabled="pending"
          />
        </UiField>
        <UiField :label="homeText('home.u1.dialog.noteLabel')" :error="noteError">
          <template #default="{ id, describedBy, invalid }">
            <textarea
              :id="id"
              v-model="content"
              class="rh-textarea"
              data-testid="u1-note-input"
              :aria-describedby="describedBy"
              :aria-invalid="invalid ? 'true' : undefined"
              :disabled="pending"
            />
          </template>
        </UiField>
        <p v-if="inlineError" class="rh-error" role="alert" data-testid="u1-note-error">
          {{ inlineError }}
        </p>
        <UiOutcomeNotice :outcome="outcome" @resolved="(o) => finish(o as Outcome)" />
      </form>
    </div>
    <template #footer>
      <UiButton :disabled="pending" data-testid="u1-note-cancel" @click="open = false">
        {{ homeText('home.u1.dialog.cancel') }}
      </UiButton>
      <UiButton
        v-if="items.length > 0"
        variant="primary"
        type="submit"
        :form="formId"
        :disabled="pending"
        data-testid="u1-note-submit"
      >
        {{ homeText('home.u1.dialog.noteSubmit') }}
      </UiButton>
    </template>
  </UiModal>
</template>
