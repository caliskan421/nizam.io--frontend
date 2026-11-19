<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

import { UiCheck, UiIcon } from '@/shared/ui'

const props = defineProps<{
  label: string
  options: readonly { value: string; label: string; count?: number }[]
  selected: readonly string[]
}>()
const emit = defineEmits<{ toggle: [value: string] }>()
const root = ref<HTMLDetailsElement | null>(null)
const options = computed(() => [
  ...props.options,
  ...props.selected
    .filter((value) => !props.options.some((entry) => entry.value === value))
    .map((value) => ({ value, label: 'Seçili değer', count: undefined })),
])
async function dismiss(): Promise<void> {
  if (!root.value?.open) return
  root.value.open = false
  await nextTick()
  root.value?.querySelector('summary')?.focus()
}
</script>

<template>
  <details ref="root" class="audit-facet" @keydown.esc.stop.prevent="dismiss">
    <summary class="t-btn t-btn--secondary t-btn--sm">
      {{ label }}
      <span v-if="selected.length" class="t-badge">{{ selected.length }}</span>
      <UiIcon name="chevron-down" size="sm" />
    </summary>
    <div class="t-card audit-facet__options" :aria-label="label">
      <p v-if="!options.length" class="rp-cap">Gösterilecek seçenek yok.</p>
      <label v-for="option in options" :key="option.value">
        <UiCheck
          :model-value="selected.includes(option.value)"
          :disabled="!selected.includes(option.value) && selected.length >= 10"
          @update:model-value="emit('toggle', option.value)"
        />
        <span>{{ option.label }}</span>
        <span v-if="option.count !== undefined" class="rp-cap">{{ option.count }}</span>
      </label>
    </div>
  </details>
</template>
