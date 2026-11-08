<script setup lang="ts">
import './styles/ui.css'

import { onMounted, ref } from 'vue'

import { rovingTarget } from './roving'

/**
 * Açılır menü kutusu (`rp-pop`, `role="menu"`). Satırlar `UiMenuItem`. Açılınca seçili
 * (`aria-checked="true"`) ya da ilk satır odaklanır. Klavye: ↑/↓, Home/End gezinir; Esc ve Tab
 * `close` yayar (odağı tetiğe döndürmek çağıranın işi). Konum çağıranın sınıfıyla verilir.
 */
const props = withDefaults(defineProps<{ label: string; autofocus?: boolean }>(), {
  autofocus: true,
})
const emit = defineEmits<{ close: [reason: 'escape' | 'tab'] }>()
const root = ref<HTMLElement | null>(null)

function items(): HTMLElement[] {
  return [...(root.value?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])]
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close', 'escape')
  } else if (event.key === 'Tab') {
    emit('close', 'tab')
  } else {
    rovingTarget(event, items(), 'vertical')
  }
}

onMounted(() => {
  if (!props.autofocus) return
  const all = items().filter((el) => !(el as HTMLButtonElement).disabled)
  const target = all.find((el) => el.getAttribute('aria-checked') === 'true') ?? all[0]
  target?.focus()
})
</script>

<template>
  <div ref="root" class="rp-pop" role="menu" :aria-label="label" @keydown="onKeydown">
    <slot />
  </div>
</template>
