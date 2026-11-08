<script setup lang="ts">
import './styles/ui.css'

import { computed } from 'vue'

import { useFieldContext } from './field-context'

/**
 * Onay kutusu (`t-check`). Görünür etiket yoksa `label` erişim adı olur (ör. "‹kod› seç").
 * İşaret simgesi token rengindedir (tasarımdaki gömülü ham renk yerine).
 */
const props = withDefaults(defineProps<{ label?: string; disabled?: boolean; id?: string }>(), {
  label: undefined,
  disabled: false,
  id: undefined,
})
const model = defineModel<boolean>({ default: false })
defineOptions({ inheritAttrs: false })

const field = useFieldContext()
const checkId = computed(() => props.id ?? field?.id)
</script>

<template>
  <span class="t-checkwrap">
    <input
      v-bind="$attrs"
      :id="checkId"
      v-model="model"
      class="t-check"
      type="checkbox"
      :aria-label="label"
      :disabled="disabled"
      :aria-describedby="field?.describedBy.value"
    />
    <svg class="t-check__mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 12.5 4 4 8-9" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </span>
</template>
