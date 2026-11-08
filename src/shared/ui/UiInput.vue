<script setup lang="ts">
import './styles/ui.css'

import { computed } from 'vue'

import { useFieldContext } from './field-context'
import UiIcon from './UiIcon.vue'
import type { IconName } from './icons'

/** Metin girişi (`t-input`, simgeli `t-field` + `t-input--icon`). `UiField` içinde bağ kendiliğinden. */
const props = withDefaults(
  defineProps<{
    type?: 'text' | 'search' | 'email' | 'password' | 'number' | 'tel' | 'url'
    icon?: IconName
    size?: 'sm' | 'md'
    invalid?: boolean
    disabled?: boolean
    id?: string
  }>(),
  { type: 'text', icon: undefined, size: 'md', invalid: false, disabled: false, id: undefined },
)
const model = defineModel<string>({ default: '' })
defineOptions({ inheritAttrs: false })

const field = useFieldContext()
const inputId = computed(() => props.id ?? field?.id)
const isInvalid = computed(() => props.invalid || field?.invalid.value === true)
</script>

<template>
  <div class="t-field">
    <UiIcon v-if="icon" class="t-field__icon" :name="icon" size="sm" />
    <input
      v-bind="$attrs"
      :id="inputId"
      v-model="model"
      class="t-input"
      :class="{ 't-input--icon': icon, 't-input--sm': size === 'sm' }"
      :type="type"
      :disabled="disabled"
      :aria-invalid="isInvalid ? 'true' : undefined"
      :aria-describedby="field?.describedBy.value"
    />
  </div>
</template>
