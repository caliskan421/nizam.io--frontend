<script setup lang="ts">
import './tasks.css'

import { onBeforeUnmount, ref, watch } from 'vue'

import { DesignStub, UiButton, UiInput } from '@/shared/ui'

import type { ProgramDepartment } from '../../model/types'
import DepartmentFilter from './DepartmentFilter.vue'
import { tasksText } from './messages'

/**
 * Arama ve süzgeç satırı (E-03-10…12). Arama yüklenen kümede, URL'ye ~300 ms gecikmeyle yazılır
 * (koordinatör kararı; tek sabit). Kişi süzgeci statik (BE-038/039: sunucu süzgeci ve aday
 * dizini yok; P4) — görünür, açılmaz. Koordinatörlük süzgeci tek seçim, yalnız Admin merceğinde
 * (K3, P4); K/Ü merceğinde kapsam zaten tek birim.
 */
const props = defineProps<{
  search: string
  department: string | null
  departments: readonly ProgramDepartment[]
  showDepartment: boolean
}>()
const emit = defineEmits<{
  'update:search': [value: string]
  'update:department': [value: string | null]
}>()

/** Arama URL yazım gecikmesi (E-03-10; kalibre edilebilir tek sabit). */
const SEARCH_DEBOUNCE_MS = 300

const draft = ref(props.search)
let timer: ReturnType<typeof setTimeout> | undefined

function cancel(): void {
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
}

watch(draft, (value) => {
  cancel()
  if (value === props.search) return
  timer = setTimeout(() => {
    timer = undefined
    emit('update:search', value)
  }, SEARCH_DEBOUNCE_MS)
})

// Dışarıdan değişim (geri tuşu, "süzgeçleri temizle"): bekleyen yazım düşer, kutu eşitlenir.
watch(
  () => props.search,
  (value) => {
    if (value === draft.value) return
    cancel()
    draft.value = value
  },
)

onBeforeUnmount(cancel)
</script>

<template>
  <div class="rp-toolbar">
    <div class="rp-tgroup rp-tgroup--grow">
      <div class="tasks-search">
        <UiInput
          v-model="draft"
          type="search"
          icon="search"
          size="sm"
          :aria-label="tasksText('tasksPage.search.label')"
          :placeholder="tasksText('tasksPage.search.placeholder')"
        />
      </div>
    </div>
    <div class="rp-tgroup">
      <DesignStub id="BE-038">
        <UiButton
          size="sm"
          icon-end="chevron-down"
          disabled
          data-testid="person-filter"
          :title="tasksText('tasksPage.person.stub')"
        >
          {{ tasksText('tasksPage.person.label') }}
        </UiButton>
      </DesignStub>
      <DepartmentFilter
        v-if="showDepartment"
        :model-value="department"
        :departments="departments"
        @update:model-value="emit('update:department', $event)"
      />
    </div>
  </div>
</template>
