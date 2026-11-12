<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'
import { UiInput } from '@/shared/ui'

import {
  actorCandidates,
  actorValue,
  departmentCandidates,
  type DeletedFilters,
} from '../model/filters'
import {
  DELETED_RANGES,
  supportsActorFilter,
  supportsDepartmentFilter,
  supportsRange,
  type DeletedRange,
} from '../model/kinds'
import { deletedText } from '../model/messages'
import { unknownDepartment } from '../model/rows'
import type { DeletedRow } from '../model/types'
import FilterMenu from './FilterMenu.vue'

/**
 * Süzgeç çubuğu (E-12-17…20; P43): tarih aralığı, Silen (yalnız toplantı), Koordinatörlük (görev
 * ve toplantı), arama. Hepsi YÜKLENEN KÜME üzerinde istemci süzgecidir; sunucuya gitmez. Adaylar
 * yüklenen satırlardan türer. Arama yazarken gecikmeli URL'ye yazılır; bekleyen yazım sahip
 * sökülünce, kapsam ve oturum değişince iptal edilir (KESİN 26a).
 */
const props = defineProps<{
  filters: DeletedFilters
  rows: readonly DeletedRow[]
  departmentName: (departmentId: string) => string | null
}>()
const emit = defineEmits<{ update: [patch: Partial<DeletedFilters>] }>()

const SEARCH_DELAY_MS = 250
const RANGE_LABEL: Record<DeletedRange, 'today' | 'week' | 'all'> = {
  bugun: 'today',
  '7gun': 'week',
  tumu: 'all',
}
const rangeText = (range: DeletedRange) => deletedText(`filters.range.${RANGE_LABEL[range]}`)

const rangeOptions = computed(() =>
  // Tasarım sırası: Bugün, Son 7 gün, Tümü.
  [...DELETED_RANGES].reverse().map((value) => ({ value, label: rangeText(value) })),
)
const actorOptions = computed(() => [
  { value: null, label: deletedText('filters.actor.all') },
  ...actorCandidates(props.rows).map((actor) => ({
    value: actorValue(actor),
    label: actor.name || deletedText('filters.actor.unknown'),
  })),
])
const departmentOptions = computed(() => {
  const collator = new Intl.Collator('tr-TR')
  const named = departmentCandidates(props.rows).map((id) => ({
    value: id,
    label: props.departmentName(id) ?? unknownDepartment(),
  }))
  named.sort((a, b) => collator.compare(a.label, b.label))
  return [{ value: null, label: deletedText('filters.department.all') }, ...named]
})

function selectedLabel(
  options: ReadonlyArray<{ value: string | null; label: string }>,
  value: string | null,
  base: string,
): string {
  const found = value === null ? undefined : options.find((o) => o.value === value)
  return found ? `${base}: ${found.label}` : base
}

const draft = ref(props.filters.q)
let timer: ReturnType<typeof setTimeout> | null = null
function cancelPending(): void {
  if (timer !== null) clearTimeout(timer)
  timer = null
}
function onInput(value: string): void {
  draft.value = value
  cancelPending()
  timer = setTimeout(() => {
    timer = null
    emit('update', { q: draft.value.trim() })
  }, SEARCH_DELAY_MS)
}
watch(
  () => props.filters.q,
  (q) => {
    // Dışarıdan değişim (Filtreleri temizle, tür değişimi): yazım taslağı eşlenir.
    if (q !== draft.value.trim()) {
      cancelPending()
      draft.value = q
    }
  },
)
const scope = useScopeStore()
const stopScope = scope.onChange(cancelPending)
const stopSession = authSession.subscribe(cancelPending)
onBeforeUnmount(() => {
  cancelPending()
  stopScope()
  stopSession()
})
</script>

<template>
  <div class="dr-tgroup" data-testid="dr-filters">
    <FilterMenu
      :label="deletedText('filters.range.label')"
      :trigger="rangeText(filters.range)"
      icon="calendar"
      :options="rangeOptions"
      :model-value="filters.range"
      :disabled="!supportsRange(filters.kind)"
      :hint="deletedText('filters.range.unsupported')"
      data-testid="dr-range"
      @update:model-value="emit('update', { range: $event })"
    />
    <FilterMenu
      :label="deletedText('filters.actor.label')"
      :trigger="selectedLabel(actorOptions, filters.actor, deletedText('filters.actor.label'))"
      :options="actorOptions"
      :model-value="filters.actor"
      :disabled="!supportsActorFilter(filters.kind)"
      :hint="deletedText('filters.actor.unsupported')"
      data-testid="dr-actor"
      @update:model-value="emit('update', { actor: $event })"
    />
    <FilterMenu
      :label="deletedText('filters.department.label')"
      :trigger="
        selectedLabel(
          departmentOptions,
          filters.department,
          deletedText('filters.department.label'),
        )
      "
      :options="departmentOptions"
      :model-value="filters.department"
      :disabled="!supportsDepartmentFilter(filters.kind)"
      :hint="deletedText('filters.department.unsupported')"
      data-testid="dr-department"
      @update:model-value="emit('update', { department: $event })"
    />
    <div class="dr-search">
      <UiInput
        type="search"
        icon="search"
        size="sm"
        :model-value="draft"
        :placeholder="deletedText('filters.search.placeholder')"
        :aria-label="deletedText('filters.search.label')"
        data-testid="dr-search"
        @update:model-value="onInput"
      />
    </div>
  </div>
</template>
