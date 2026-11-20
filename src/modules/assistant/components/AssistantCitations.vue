<script setup lang="ts">
import { computed } from 'vue'

import { UiButton } from '@/shared/ui'

import type { ScopeSnapshot } from '@/shared/scope/scope'
import type { Turn } from '../model/types'
import { resolveView, SOURCE_LABELS, type ViewLink } from '../model/views'

const props = defineProps<{
  turn: Turn
  dismissed: string[]
  scope: ScopeSnapshot
  admin: boolean
  busy: boolean
}>()
const emit = defineEmits<{ view: [string, ViewLink]; dismiss: [string] }>()
const views = computed(() =>
  (props.turn.views ?? []).flatMap((view, index) => {
    const key = props.turn.key + ':' + index
    if (props.dismissed.includes(key)) return []
    const target = resolveView(view, props.scope, props.admin)
    return target ? [{ key, target }] : []
  }),
)
const sources = computed(() =>
  (props.turn.sources ?? []).filter((source) => Object.hasOwn(SOURCE_LABELS, source)),
)
</script>

<template>
  <ul v-if="sources.length" class="assistant-sources" aria-label="Yanıt kaynakları">
    <li v-for="source in sources" :key="source">
      <RouterLink v-if="source === 'hafiza_ara'" :to="{ name: 'memory' }"
        >Kurumsal hafızayı aç</RouterLink
      >
      <span v-else>{{ SOURCE_LABELS[source] }}</span>
    </li>
  </ul>
  <article v-for="{ key, target } in views" :key="key" class="assistant-view">
    <strong>{{ target.label }}</strong>
    <p>İlgili görünümü açmak ister misiniz?</p>
    <div class="assistant-toolbar">
      <UiButton size="sm" :disabled="busy" @click="emit('dismiss', key)">Vazgeç</UiButton>
      <UiButton size="sm" variant="primary" :disabled="busy" @click="emit('view', key, target)"
        >Görünümü aç</UiButton
      >
    </div>
  </article>
</template>
