<script setup lang="ts">
import '../styles/ui.css'
import './conflict.css'

import { computed, ref, watch } from 'vue'

import UiButton from '../UiButton.vue'
import UiModal from '../UiModal.vue'
import UiSegmented from '../UiSegmented.vue'
import {
  allChosen,
  type ConflictChoice,
  type ConflictChoices,
  type ConflictField,
} from './conflict'
import { conflictText } from './messages'

/**
 * Alan alan çakışma seçimi (409 `*.edit_conflict`; K5). `t-modal` (`UiModal`, `role="dialog"`):
 * her çakışan alan için etiket, "Benim değerim" / "Güncel değer" ve tek seçimli `rp-seg`
 * (ok tuşları / Home/End odağı taşır, Enter/Boşluk seçer). Varsayılan seçim YOK: her alan
 * bilinçli seçilmeden "Seçimle kaydet" kapalıdır. Esc, perde ve "Vazgeç" vazgeçer; istek
 * sürerken (`busy`) kapanmaz. Odak tuzağı ve odak iadesi `UiModal`'dadır; Tab sırası alan
 * seçimleri → "Vazgeç" → "Seçimle kaydet".
 */
const props = withDefaults(defineProps<{ fields: readonly ConflictField[]; busy?: boolean }>(), {
  busy: false,
})
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ resolve: [choices: ConflictChoices]; cancel: [] }>()

const choices = ref<Record<string, ConflictChoice | null>>({})
watch(
  () => [open.value, props.fields] as const,
  ([isOpen]) => {
    if (isOpen) choices.value = Object.fromEntries(props.fields.map((f) => [f.field, null]))
  },
  { immediate: true },
)

const options = computed(() => [
  { value: 'mine' as const, label: conflictText('conflict.mine') },
  { value: 'theirs' as const, label: conflictText('conflict.theirs') },
])
const chosen = computed(() => {
  const out: Record<string, ConflictChoice> = {}
  for (const [field, value] of Object.entries(choices.value)) if (value) out[field] = value
  return out
})
const ready = computed(() => allChosen(props.fields, chosen.value))
const shown = (value: string) => (value === '' ? conflictText('conflict.empty') : value)

function submit(): void {
  if (!ready.value || props.busy) return
  emit('resolve', { ...chosen.value })
}

function cancel(): void {
  if (props.busy) return
  open.value = false
  emit('cancel')
}
</script>

<template>
  <UiModal
    v-model:open="open"
    :title="conflictText('conflict.title')"
    :description="conflictText('conflict.description')"
    :dismissible="!busy"
    @close="emit('cancel')"
  >
    <ul class="ui-conflict__list" data-testid="conflict-fields">
      <li v-for="row in fields" :key="row.field" class="ui-conflict__row">
        <span class="ui-conflict__label">{{ row.label }}</span>
        <dl class="ui-conflict__values">
          <div class="ui-conflict__value">
            <dt>{{ conflictText('conflict.mine') }}</dt>
            <dd data-testid="conflict-mine">{{ shown(row.mine) }}</dd>
          </div>
          <div class="ui-conflict__value">
            <dt>{{ conflictText('conflict.theirs') }}</dt>
            <dd data-testid="conflict-theirs">{{ shown(row.theirs) }}</dd>
          </div>
        </dl>
        <UiSegmented
          v-model="choices[row.field]"
          :options="options"
          :label="conflictText('conflict.choice', { field: row.label })"
          :disabled="busy"
        />
      </li>
    </ul>
    <template #footer>
      <UiButton variant="ghost" :disabled="busy" @click="cancel">
        {{ conflictText('conflict.cancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        data-testid="conflict-submit"
        :disabled="!ready || busy"
        @click="submit"
      >
        {{ conflictText('conflict.submit') }}
      </UiButton>
    </template>
  </UiModal>
</template>
