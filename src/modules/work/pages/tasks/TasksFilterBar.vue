<script setup lang="ts">
import './tasks.css'

import { onBeforeUnmount, ref, watch } from 'vue'

import { UiInput } from '@/shared/ui'

import type { ProgramDepartment, WorkItem } from '../../model/types'
import DepartmentFilter from './DepartmentFilter.vue'
import { tasksText } from './messages'
import PersonFilter from './PersonFilter.vue'

/**
 * Arama ve süzgeç satırı (E-03-10…12). Arama yüklenen kümede, URL'ye ~300 ms gecikmeyle yazılır
 * (koordinatör kararı; tek sabit). Kişi süzgeci çoklu seçim, sunucu `assignee_account_id` (BE-038;
 * aday dizini BE-039 yok → görülen atananlar). Koordinatörlük süzgeci tek seçim, yalnız Admin merceğinde
 * (K3, P4); K/Ü merceğinde kapsam zaten tek birim.
 */
const props = defineProps<{
  search: string
  department: string | null
  departments: readonly ProgramDepartment[]
  showDepartment: boolean
  /** Seçili atananlar (sunucu süzgeci, BE-038). */
  people: readonly string[]
  /** Aday kişiler: yüklenen satırların `assignees[]`'ı (aday dizini yok, BE-039). */
  candidates: readonly Pick<WorkItem, 'assignees'>[]
  /** Üye merceğinde kilitli. */
  personLocked: boolean
}>()
const emit = defineEmits<{
  'update:search': [value: string]
  'update:department': [value: string | null]
  'update:people': [value: string[]]
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
      <PersonFilter
        :people="people"
        :candidates="candidates"
        :locked="personLocked"
        @update:people="emit('update:people', $event)"
      />
      <DepartmentFilter
        v-if="showDepartment"
        :model-value="department"
        :departments="departments"
        @update:model-value="emit('update:department', $event)"
      />
    </div>
  </div>
</template>
