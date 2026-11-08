<script setup lang="ts">
import { ref } from 'vue'

import type { ScopeLens } from '@/shared/scope/scope'
import { UiIcon } from '@/shared/ui'

/**
 * Kapsam kartı (`sb-card`; E-00-04/05/06). Menü düğmesi: `aria-haspopup="menu"` +
 * `aria-expanded`, erişim adı tam ad ("Program: <tam ad>"). `fixed`: salt gösterim (P11 —
 * tek mercekte Rol kartı): düğme değil, menü açmaz, ok yok. `tone`: rol rengi çerçevesi
 * (token `--role-*`). ↓ tuşu menüyü açar.
 */
const props = withDefaults(
  defineProps<{
    label: string
    accessibleName: string
    expanded?: boolean
    fixed?: boolean
    tone?: ScopeLens | null
  }>(),
  { expanded: false, fixed: false, tone: null },
)
const emit = defineEmits<{ toggle: []; open: [] }>()
const el = ref<HTMLElement | null>(null)

function toneClass(): string | undefined {
  return props.tone && props.tone !== 'admin' ? `side-card--${props.tone}` : undefined
}

defineExpose({ focus: () => el.value?.focus() })
</script>

<template>
  <div v-if="fixed" ref="el" class="side-card side-card--static" :class="toneClass()">
    <span class="side-card__l">{{ label }}</span>
    <span class="side-card__v"><slot /></span>
  </div>
  <button
    v-else
    ref="el"
    type="button"
    class="side-card"
    :class="toneClass()"
    aria-haspopup="menu"
    :aria-expanded="expanded ? 'true' : 'false'"
    :aria-label="accessibleName"
    @click="emit('toggle')"
    @keydown.down.prevent="emit('open')"
  >
    <span class="side-card__l">
      {{ label }}
      <UiIcon :name="expanded ? 'chevron-up' : 'chevron-down'" size="sm" />
    </span>
    <span class="side-card__v"><slot /></span>
  </button>
</template>
