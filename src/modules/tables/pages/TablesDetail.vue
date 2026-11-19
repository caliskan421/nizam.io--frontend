<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { ApiError } from '@/shared/errors/api-error'
import { queryKeys } from '@/shared/http/query-keys'
import { usePageCrumb } from '@/shared/navigation/page-crumb'
import { UiButton, UiEmptyState, UiErrorState } from '@/shared/ui'

import { useTable } from '../api/tables'
import TableEditor from '../components/TableEditor.vue'
import type { TableTarget } from '../model/types'
import { TABLES_ROUTE } from '../routes'

const props = defineProps<{
  target: TableTarget
  tableId: string
  accountId: string | null
  unit: boolean
}>()
const router = useRouter()
const client = useQueryClient()
const routeQuery = computed(() => (props.unit ? { alan: 'birim' } : {}))
const rowsCursor = ref<string | null>(null)
const previousCursors = ref<Array<string | null>>([])
const editorOpen = ref(false)
const locked = ref(false)
const optedIn = ref(false)
const detail = useTable(
  computed(() => props.target),
  computed(() => props.tableId),
  rowsCursor,
)
const detailError = computed(() =>
  detail.error.value instanceof ApiError ? detail.error.value : null,
)
const safeDetail = computed(() => [401, 403, 404].includes(detailError.value?.status ?? 0))
const snapshot = computed(() => {
  if (safeDetail.value || (detail.error.value && !editorOpen.value)) return undefined
  return detail.data.value
})
usePageCrumb(() => snapshot.value?.table.name ?? null)
watch(snapshot, (next) => {
  if (!next) editorOpen.value = false
})
watch(safeDetail, (unavailable) => {
  if (unavailable) previousCursors.value = []
})

function firstRows() {
  rowsCursor.value = null
  previousCursors.value = []
}
async function reloadTable() {
  return (await detail.refetch()).isSuccess
}
async function closeDeleted() {
  const key = queryKeys.tables.detailPrefix(props.target, props.tableId)
  await router.replace({ name: TABLES_ROUTE.name, query: routeQuery.value })
  client.removeQueries({ queryKey: key })
}
function nextRows() {
  const next = snapshot.value?.next_cursor
  if (!next || next === rowsCursor.value) return
  previousCursors.value = [...previousCursors.value, rowsCursor.value]
  rowsCursor.value = next
}
function previousRows() {
  if (!previousCursors.value.length) return
  rowsCursor.value = previousCursors.value.at(-1) ?? null
  previousCursors.value = previousCursors.value.slice(0, -1)
}
</script>

<template>
  <header class="tables-head">
    <div>
      <RouterLink class="tables-link" :to="{ name: TABLES_ROUTE.name, query: routeQuery }"
        >← Tablolar</RouterLink
      >
      <h1 id="tables-title">{{ snapshot?.table.name ?? 'Tablo' }}</h1>
    </div>
  </header>
  <p v-if="detail.isPending.value" class="tables-empty" role="status">Tablo yükleniyor…</p>
  <UiEmptyState
    v-else-if="safeDetail"
    title="Tablo açılamadı"
    text="Bu tablo artık burada olmayabilir veya erişiminiz değişmiş olabilir."
    icon="sheets"
  />
  <UiErrorState
    v-else-if="detailError && !snapshot"
    title="Tablo yüklenemedi"
    :error="detailError"
    retryable
    :retrying="detail.isFetching.value"
    @retry="detail.refetch()"
  />
  <template v-else-if="snapshot">
    <p v-if="detailError" class="tables-notice" role="status">Son güncelleme alınamadı.</p>
    <TableEditor
      v-model:opted-in="optedIn"
      :snapshot="snapshot"
      :locked="locked"
      :target="target"
      :account-id="accountId"
      :reload="reloadTable"
      @open="editorOpen = $event"
      @locked="locked = true"
      @deleted="closeDeleted"
      @reordered="firstRows"
    />
  </template>
  <div v-if="snapshot?.next_cursor || previousCursors.length" class="tables-actions">
    <UiButton v-if="previousCursors.length" size="sm" :disabled="editorOpen" @click="previousRows"
      >Önceki satırlar</UiButton
    >
    <UiButton
      v-if="snapshot?.next_cursor"
      size="sm"
      :disabled="detail.isFetching.value || editorOpen"
      @click="nextRows"
      >Sonraki satırlar</UiButton
    >
  </div>
</template>
