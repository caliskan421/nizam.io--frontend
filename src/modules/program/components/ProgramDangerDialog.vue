<script setup lang="ts">
import './program.css'

import { computed } from 'vue'

import { UiButton, UiField, UiInput, UiModal } from '@/shared/ui'

import { programText } from '../model/messages'
import { type DangerMode, type DangerTarget, useProgramDanger } from './use-program-danger'

/**
 * Program sil / sıfırla penceresi (E-00-25; P3). Parola yeniden doğrulanır (PROGRAM-K12); "Sil" /
 * "Sıfırla" ortak tehlike onayını açar, istek yalnız onaydan sonra gider. Parola alanı
 * `autocomplete="current-password"`; değer yalnız bileşen belleğinde.
 */
const props = defineProps<{ open: boolean; mode: DangerMode; target: DangerTarget | null }>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  done: [mode: DangerMode, programId: string]
}>()

const ctl = useProgramDanger({
  open: () => props.open,
  mode: () => props.mode,
  target: () => props.target,
  close: () => emit('update:open', false),
  done: (mode, id) => {
    emit('done', mode, id)
    emit('update:open', false)
  },
})
const password = ctl.password

const key = computed<'danger.delete' | 'danger.reset'>(() =>
  props.mode === 'delete' ? 'danger.delete' : 'danger.reset',
)
const name = computed(() => props.target?.name ?? '')
</script>

<template>
  <UiModal
    :open="open && target !== null"
    :title="programText(`${key}.title`)"
    :description="programText(`${key}.sub`, { name })"
    :dismissible="!ctl.busy.value"
    @update:open="emit('update:open', $event)"
  >
    <form
      id="pg-danger-form"
      class="pg-form"
      novalidate
      :data-mode="mode"
      @submit.prevent="ctl.submit()"
    >
      <p class="pg-danger__body">{{ programText(`${key}.body`) }}</p>
      <UiField
        :label="programText('danger.password')"
        :hint="programText('danger.passwordHint')"
        :error="ctl.error.value || undefined"
      >
        <UiInput
          v-model="password"
          type="password"
          name="password"
          autocomplete="current-password"
        />
      </UiField>
    </form>
    <template #footer>
      <UiButton :disabled="ctl.busy.value" @click="emit('update:open', false)">
        {{ programText('danger.cancel') }}
      </UiButton>
      <UiButton
        variant="danger"
        type="submit"
        form="pg-danger-form"
        :disabled="ctl.busy.value"
        data-testid="pg-danger-submit"
      >
        {{ programText(`${key}.submit`) }}
      </UiButton>
    </template>
  </UiModal>
</template>
