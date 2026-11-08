<script setup lang="ts" generic="V extends string">
import './styles/ui.css'

import { ref, useId } from 'vue'

import { rovingTarget } from './roving'
import type { UiChoiceOption } from './types'
import UiCount from './UiCount.vue'

/**
 * Sekmeler (`rp-tabs`, `role="tablist"`) + etkin sekmenin paneli (`role="tabpanel"`, varsayılan
 * yuva `{ value }` alır). Gezici `tabindex`; ←/→, Home/End odağı taşır ve sekmeyi seçer.
 */
const props = withDefaults(
  defineProps<{ options: readonly UiChoiceOption<V>[]; label: string; disabled?: boolean }>(),
  { disabled: false },
)
const model = defineModel<V>({ required: true })
const base = `ui-tabs-${useId()}`
const list = ref<HTMLElement | null>(null)

function onKeydown(event: KeyboardEvent): void {
  const tabs = [...(list.value?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])]
  const target = rovingTarget(event, tabs, 'horizontal')
  const option = props.options.find((o) => o.value === target?.dataset.value)
  if (option) model.value = option.value
}
</script>

<template>
  <div>
    <div ref="list" class="rp-tabs" role="tablist" :aria-label="label" @keydown="onKeydown">
      <button
        v-for="option in options"
        :id="`${base}-tab-${option.value}`"
        :key="option.value"
        type="button"
        role="tab"
        :data-value="option.value"
        :aria-selected="model === option.value ? 'true' : 'false'"
        :aria-controls="`${base}-panel`"
        :tabindex="model === option.value ? 0 : -1"
        :disabled="disabled || option.disabled"
        @click="model = option.value"
      >
        {{ option.label }}
        <UiCount v-if="option.count !== undefined" :value="option.count" />
      </button>
    </div>
    <div
      :id="`${base}-panel`"
      role="tabpanel"
      :aria-labelledby="`${base}-tab-${model}`"
      tabindex="0"
    >
      <slot :value="model" />
    </div>
  </div>
</template>
