<script setup lang="ts">
import './styles/ui.css'

import { computed } from 'vue'

import { useFieldContext } from './field-context'
import type { UiSelectOption } from './types'
import UiIcon from './UiIcon.vue'

/** Yerel seçim (`t-select` + `t-field__chevron`). Boş seçenek `placeholder` ile. */
const props = withDefaults(
  defineProps<{
    options: readonly UiSelectOption[]
    placeholder?: string
    invalid?: boolean
    disabled?: boolean
    id?: string
  }>(),
  { placeholder: undefined, invalid: false, disabled: false, id: undefined },
)
const model = defineModel<string>({ default: '' })
defineOptions({ inheritAttrs: false })

const field = useFieldContext()
const selectId = computed(() => props.id ?? field?.id)
const isInvalid = computed(() => props.invalid || field?.invalid.value === true)
</script>

<template>
  <div class="t-field">
    <select
      v-bind="$attrs"
      :id="selectId"
      v-model="model"
      class="t-select"
      :disabled="disabled"
      :aria-invalid="isInvalid ? 'true' : undefined"
      :aria-describedby="field?.describedBy.value"
    >
      <option v-if="placeholder !== undefined" value="" disabled>{{ placeholder }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value" :disabled="o.disabled">
        {{ o.label }}
      </option>
    </select>
    <UiIcon class="t-field__chevron" name="chevron-down" size="sm" />
  </div>
</template>
