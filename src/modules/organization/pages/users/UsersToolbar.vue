<script setup lang="ts">
import './users-page.css'

import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { designStub } from '@/shared/design-stub'
import { UiInput, UiSegmented, type UiChoiceOption } from '@/shared/ui'

import { usersText } from '../../components/users/messages'
import { USER_ROLE_TABS, type UserRoleTab } from '../../model/capabilities'
import type { ProgramDepartment } from '../../model/types'
import CoordinatorshipFilter from './CoordinatorshipFilter.vue'

/**
 * Araç çubuğu (E-05-06…08). Rol sekmeleri yüklenen kümede, seçili programın etiketlerine göre
 * (sayaçlar imleç bitmediyse "yüklenen kayıtlar içinde"); "Admin" sekmesi devre dışı
 * `designStub('BE-042')`. Arama sunucu `search` (yalnız ad; yer tutucu "Ad…" — BE-041), URL'ye
 * ~300 ms gecikmeyle yazılır (03 E-03-10 sabiti). Koordinatörlük süzgeci tek seçim.
 */
const props = defineProps<{
  tab: UserRoleTab
  counts: Readonly<Record<UserRoleTab, number>>
  complete: boolean
  search: string
  department: string | null
  departments: readonly ProgramDepartment[]
  departmentsTruncated: boolean
  programReady: boolean
}>()
const emit = defineEmits<{
  'update:tab': [value: UserRoleTab]
  'update:search': [value: string]
  'update:department': [value: string | null]
}>()

/** Arama URL yazım gecikmesi (E-05-07; 03 E-03-10 ile aynı tek sabit). */
const SEARCH_DEBOUNCE_MS = 300

const options = computed<UiChoiceOption<UserRoleTab>[]>(() =>
  USER_ROLE_TABS.map((tab) => {
    const label = usersText(`users.tabs.${tab}`)
    if (tab === 'admin') return designStub('BE-042', { value: tab, label, disabled: true })
    return { value: tab, label, count: props.counts[tab] }
  }),
)
const tabModel = computed({
  get: () => props.tab,
  set: (value: UserRoleTab | null) => {
    if (value) emit('update:tab', value)
  },
})

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
  <div class="rp-toolbar users-toolbar">
    <div class="rp-tgroup users-tabs">
      <!-- Sayaç parantezsiz: Kullanicilar.dc.html "Tümü 185" (F2 görsel doğrulaması K-4). -->
      <UiSegmented
        v-model="tabModel"
        :options="options"
        :label="usersText('users.tabs.label')"
        :parens="false"
      />
      <span v-if="!complete" class="rp-cap" data-testid="tabs-partial">
        {{ usersText('users.partial') }}
      </span>
    </div>
    <div class="rp-tgroup rp-tgroup--grow">
      <UiInput
        v-model="draft"
        class="users-search"
        type="search"
        icon="search"
        :aria-label="usersText('users.search.label')"
        :placeholder="usersText('users.search.placeholder')"
        data-testid="users-search"
      />
      <CoordinatorshipFilter
        :model-value="department"
        :departments="departments"
        :disabled="!programReady"
        @update:model-value="emit('update:department', $event)"
      />
    </div>
    <p v-if="departmentsTruncated" class="rp-cap users-toolbar__note">
      {{ usersText('users.department.truncated') }}
    </p>
  </div>
</template>
