<script setup lang="ts">
import { computed, ref } from 'vue'

import type { MutationOutcome } from '@/shared/http/mutation'
import { UiButton, UiIcon } from '@/shared/ui'
import { UiOutcomeNotice } from '@/shared/ui/confirm'

import { targetOf } from '../../model/target'
import type { CreateSubtaskInput, WorkItem, WorkItemSubtask } from '../../model/types'
import { subtaskText } from './messages'
import { useSubtaskAdd } from './use-subtask-add'

/**
 * Alt görev ekle satırı (E-03-37; `rp-stask--add` / `rp-dsub--add`): kesikli alt çizgili giriş +
 * yalnız taslak doluyken "Ekle". Enter / "Ekle" = bir kullanıcı eylemi (bir `Idempotency-Key`).
 * Başarıda taslak temizlenir, odak girişte kalır; sonuç bilinmiyorsa taslak korunur ve yerinde
 * "Yeniden gönder" (aynı anahtar). Yalnız s.146 yetkisinde görünür (çağıran).
 */
const props = defineProps<{ item: WorkItem; variant: 'block' | 'panel' }>()

const add = useSubtaskAdd(
  () => props.item,
  () => targetOf(props.item),
)
const input = ref<HTMLInputElement | null>(null)
const filled = computed(() => add.draft.value.trim() !== '')

async function submit(): Promise<void> {
  if (await add.submit()) input.value?.focus()
}

function onResolved(outcome: MutationOutcome<unknown, unknown, unknown>): void {
  if (add.settle(outcome as MutationOutcome<CreateSubtaskInput, WorkItemSubtask>)) {
    input.value?.focus()
  }
}
</script>

<template>
  <div :class="variant === 'block' ? 'rp-stask rp-stask--add' : 'rp-dsub rp-dsub--add'">
    <UiIcon class="sub-add-icon" name="plus" size="sm" />
    <input
      ref="input"
      v-model="add.draft.value"
      class="rp-stask__input"
      type="text"
      maxlength="300"
      :placeholder="subtaskText('subtasks.add.placeholder')"
      :aria-label="subtaskText('subtasks.add.label', { title: item.title })"
      :aria-busy="add.busy.value ? 'true' : undefined"
      data-testid="subtask-add-input"
      @keydown.enter.prevent="submit"
    />
    <UiButton
      v-if="filled"
      size="sm"
      :disabled="add.busy.value"
      data-testid="subtask-add-submit"
      @click="submit"
    >
      {{ subtaskText('subtasks.add.submit') }}
    </UiButton>
  </div>
  <UiOutcomeNotice :outcome="add.notice.value" @resolved="onResolved" />
</template>
