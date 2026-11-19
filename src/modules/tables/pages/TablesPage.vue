<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ApiError } from '@/shared/errors/api-error'
import { useProgramDepartments } from '@/shared/scope/program-departments'
import { useScopeStore } from '@/shared/scope/store'
import { useSessionStore } from '@/shared/session/store'
import { UiButton, UiEmptyState, UiErrorState } from '@/shared/ui'

import { useTables } from '../api/tables'
import CreateTableForm from '../components/CreateTableForm.vue'
import TableCards from '../components/TableCards.vue'
import TableTemplates from '../components/TableTemplates.vue'
import type { TableSummary, TableTarget } from '../model/types'
import TablesDetail from './TablesDetail.vue'
import { TABLE_ROUTE, TABLES_ROUTE } from '../routes'

import './tables.css'
const route = useRoute()
const router = useRouter()
const scope = useScopeStore()
const session = useSessionStore()
const unit = computed(() => route.query.alan === 'birim')
const routeQuery = computed(() => (unit.value ? { alan: 'birim' } : {}))
const tableId = computed(() =>
  typeof route.params.tableId === 'string' && route.params.tableId ? route.params.tableId : null,
)
const department = ref(scope.departmentId ?? '')
const { query: departments } = useProgramDepartments(unit)
const choices = computed(() => departments.data.value?.departments ?? [])
const target = computed<TableTarget | null>(() => {
  if (!scope.programId || (unit.value && !department.value)) return null
  return { programId: scope.programId, departmentId: unit.value ? department.value : null }
})
watch(
  () => [scope.programId, scope.departmentId, scope.lens, session.accountId],
  () => {
    department.value = scope.departmentId ?? ''
  },
  { flush: 'sync' },
)
const isList = computed(() => tableId.value === null)
const list = useTables(target, isList)
const templates = useTables(target, isList, true)
const templateError = computed(() =>
  templates.error.value instanceof ApiError ? templates.error.value : null,
)
const templateItems = computed(
  () =>
    templates.data.value?.pages.flatMap((page) => page.items).filter((item) => item.is_template) ??
    [],
)
const activeArea = computed(
  () =>
    choices.value.find((item) => item.department_id === department.value)?.display_name ??
    'Koordinatörlük',
)
const source = ref<TableSummary | null>(null)
const sourceAvailable = computed(
  () =>
    !templates.isError.value && templateItems.value.some((item) => item.id === source.value?.id),
)
let formTrigger = 'tables-create-trigger'

const listError = computed(() => (list.error.value instanceof ApiError ? list.error.value : null))
const listItems = computed(() => list.data.value?.pages.flatMap((page) => page.items) ?? [])
const formOpen = ref(false)
const editorGeneration = ref(0)
watch(
  () => [
    route.fullPath,
    scope.programId,
    scope.departmentId,
    scope.lens,
    department.value,
    session.accountId,
  ],
  () => {
    formOpen.value = false
    source.value = null
    editorGeneration.value += 1
  },
  { flush: 'sync' },
)
function showCreate(trigger = 'tables-create-trigger') {
  if (formOpen.value) return
  formTrigger = trigger
  source.value = null
  formOpen.value = true
}
function showTemplate(item: TableSummary) {
  if (
    formOpen.value ||
    !target.value ||
    templates.isError.value ||
    !templateItems.value.includes(item)
  )
    return
  formTrigger = 'tables-template-' + item.id
  source.value = item
  formOpen.value = true
}
async function closeCreate() {
  formOpen.value = false
  source.value = null
  await nextTick()
  const trigger =
    document.getElementById(formTrigger) ?? document.getElementById('tables-blank-trigger')
  trigger?.focus()
}

function recoverSource() {
  void Promise.all([list.refetch(), templates.refetch()])
}
async function reloadList() {
  return (await list.refetch()).isSuccess
}
function openTable(tableId: string) {
  if (formOpen.value)
    void router.push({ name: TABLE_ROUTE.name, params: { tableId }, query: routeQuery.value })
}
</script>
<template>
  <section class="tables-page" aria-labelledby="tables-title">
    <header v-if="isList || !target || (unit && departments.isError.value)" class="tables-head">
      <div>
        <RouterLink
          v-if="!isList"
          class="tables-link"
          :to="{ name: TABLES_ROUTE.name, query: routeQuery }"
          >← Tablolar</RouterLink
        >
        <h1 id="tables-title">{{ isList ? 'Tablolar' : 'Tablo' }}</h1>
      </div>
      <UiButton
        v-if="isList && target && list.isSuccess.value && !formOpen"
        id="tables-create-trigger"
        variant="primary"
        icon="plus"
        @click="showCreate()"
        >Yeni tablo</UiButton
      >
    </header>
    <div v-if="isList || unit" class="tables-toolbar">
      <nav v-if="isList" class="tables-segment" aria-label="Tablo çalışma alanı">
        <RouterLink :to="{ name: TABLES_ROUTE.name }" :aria-current="unit ? undefined : 'page'"
          >Kişisel</RouterLink
        >
        <RouterLink
          :to="{ name: TABLES_ROUTE.name, query: { alan: 'birim' } }"
          :aria-current="unit ? 'page' : undefined"
          >Koordinatörlük</RouterLink
        >
      </nav>
      <label v-if="unit" class="tables-field">
        Koordinatörlük
        <select
          v-model="department"
          class="t-select"
          :disabled="departments.isPending.value || departments.isError.value"
        >
          <option value="">
            {{ departments.isPending.value ? 'Yükleniyor…' : 'Koordinatörlük seçin' }}
          </option>
          <option v-for="item in choices" :key="item.department_id" :value="item.department_id">
            {{ item.display_name }}
          </option>
        </select>
      </label>
    </div>
    <UiErrorState
      v-if="unit && departments.error.value instanceof ApiError"
      :error="departments.error.value"
      title="Koordinatörlükler yüklenemedi"
      retryable
      :retrying="departments.isFetching.value"
      @retry="departments.refetch()"
    />
    <UiEmptyState
      v-else-if="!target"
      title="Çalışma alanını seçin"
      :text="
        unit
          ? 'Tabloları görmek için bir koordinatörlük seçin.'
          : 'Tabloları görmek için bir program seçin.'
      "
      icon="sheets"
    />
    <template v-else-if="isList">
      <CreateTableForm
        v-if="formOpen"
        :key="editorGeneration"
        :target="target"
        :source="source"
        :source-available="sourceAvailable"
        :area-label="unit ? activeArea : 'Kişisel'"
        :reload="reloadList"
        @cancel="closeCreate"
        @created="openTable"
        @source-lost="recoverSource"
      />
      <TableTemplates
        :items="templateItems"
        :pending="templates.isPending.value"
        :fetching="templates.isFetching.value"
        :has-next="templates.hasNextPage.value"
        :error="templateError"
        :form-open="formOpen"
        :can-create="list.isSuccess.value"
        @blank="showCreate('tables-blank-trigger')"
        @select="showTemplate"
        @retry="templates.refetch()"
        @more="templates.fetchNextPage()"
      />
      <p v-if="list.isPending.value" class="tables-empty" role="status">Tablolar yükleniyor…</p>
      <UiErrorState
        v-else-if="listError"
        title="Tablolar açılamadı"
        :error="listError"
        :retryable="listError.status !== 403 && listError.status !== 404"
        :retrying="list.isFetching.value"
        @retry="list.refetch()"
      />
      <TableCards
        v-else
        :key="editorGeneration"
        :items="listItems"
        :account-id="session.accountId"
        :unit="unit"
        :has-next="list.hasNextPage.value"
      />
      <UiButton
        v-if="!list.isError.value && list.hasNextPage.value"
        size="sm"
        :disabled="list.isFetching.value"
        @click="list.fetchNextPage()"
        >Daha fazla tablo</UiButton
      >
    </template>
    <TablesDetail
      v-else-if="tableId"
      :key="editorGeneration"
      :table-id="tableId"
      :target="target"
      :account-id="session.accountId"
      :unit="unit"
    />
  </section>
</template>
