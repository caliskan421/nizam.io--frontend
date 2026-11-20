<script setup lang="ts">
import '../pages/memory.css'

import { ref, watch } from 'vue'

import { UiButton, UiModal } from '@/shared/ui'

import { useMemoryScope } from '../model/capabilities'
import type { SourceKind } from '../model/types'
import ExperienceCreate from './ExperienceCreate.vue'

const props = defineProps<{
  id: string
  kind: SourceKind
  label: string
  unit?: string
  linked?: string
}>()
const scope = useMemoryScope()
const open = ref(false)
watch([scope.program, scope.audience, () => scope.store.snapshot, () => props.id], () => {
  open.value = false
})
</script>

<template>
  <RouterLink v-if="linked" :to="{ name: 'memory', query: { deneyim: linked } }"
    >Hafızada</RouterLink
  >
  <UiButton v-else size="sm" @click="open = true">Hafızaya ekle</UiButton>
  <UiModal v-model:open="open" title="Notu hafızaya ekle" :dismissible="false">
    <ExperienceCreate
      v-if="open"
      :source="{ id, kind }"
      :source-label="label"
      :default-unit="unit"
      @close="open = false"
      @saved="open = false"
    />
  </UiModal>
</template>
