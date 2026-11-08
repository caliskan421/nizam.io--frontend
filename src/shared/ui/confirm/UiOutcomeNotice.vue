<script setup lang="ts">
import './confirm.css'

import { computed, ref } from 'vue'

import type { MutationOutcome } from '@/shared/http/mutation'

import UiButton from '../UiButton.vue'
import { confirmText, mutationText } from './messages'
import { outcomeText } from './notify'

/**
 * Yerinde yazma sonucu bildirimi (formun altında):
 *  - "sonuç bilinmiyor" (`unknown_outcome`): metin + süre içindeyse "Yeniden gönder" — aynı
 *    anahtar ve aynı gövdeyle (`outcome.retry`); yeni sonuç `resolved` ile çağırana döner.
 *  - çakışma (`edit_conflict`): metin + değişen alanların adları (`fields`, çağıran çevirir);
 *    alan alan seçim F1'de.
 * Diğer sonuçlarda hiçbir şey çizilmez.
 */
type Outcome = MutationOutcome<unknown, unknown, unknown>

const props = withDefaults(defineProps<{ outcome: Outcome | null; fields?: readonly string[] }>(), {
  fields: () => [],
})
const emit = defineEmits<{ resolved: [outcome: Outcome] }>()

const sending = ref(false)
const shown = computed(() =>
  props.outcome?.kind === 'unknown_outcome' || props.outcome?.kind === 'edit_conflict'
    ? props.outcome
    : null,
)
const retry = computed(() => (shown.value?.kind === 'unknown_outcome' ? shown.value.retry : null))

async function resend(): Promise<void> {
  const run = retry.value
  if (!run || sending.value) return
  sending.value = true
  try {
    emit('resolved', await run())
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div v-if="shown" class="ui-notice ui-notice--danger" role="alert" data-testid="outcome-notice">
    <p>{{ outcomeText(shown) }}</p>
    <template v-if="shown.kind === 'edit_conflict'">
      <template v-if="fields.length > 0">
        <p class="ui-notice__k">{{ confirmText('confirm.conflict.fields') }}</p>
        <ul class="ui-notice__list" data-testid="outcome-fields">
          <li v-for="field in fields" :key="field">{{ field }}</li>
        </ul>
      </template>
      <p class="ui-notice__hint">{{ confirmText('confirm.conflict.later') }}</p>
    </template>
    <div v-else-if="retry" class="ui-notice__actions">
      <UiButton size="sm" :disabled="sending" data-testid="outcome-retry" @click="resend">
        {{ mutationText('mutation.action.retry') }}
      </UiButton>
    </div>
  </div>
</template>
