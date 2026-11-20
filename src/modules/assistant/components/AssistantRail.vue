<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import { UiIconButton } from '@/shared/ui'

defineProps<{ title: string; description: string }>()
const open = defineModel<boolean>('open', { required: true })
const rail = ref<HTMLElement | null>(null)
const launcher = document.activeElement instanceof HTMLElement ? document.activeElement : null
onMounted(async () => {
  await nextTick()
  if (document.activeElement === launcher) rail.value?.focus()
})
onBeforeUnmount(() => {
  if (rail.value?.contains(document.activeElement) && launcher?.isConnected) launcher.focus()
})
</script>

<template>
  <aside
    v-if="open"
    ref="rail"
    class="assistant-rail"
    aria-label="Asistan"
    tabindex="-1"
    @keydown.esc.stop="open = false"
  >
    <header class="assistant-rail__head">
      <div>
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
      </div>
      <UiIconButton icon="close" label="Asistanı kapat" @click="open = false" />
    </header>
    <slot />
  </aside>
</template>
