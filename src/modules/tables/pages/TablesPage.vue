<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { isNavigationFailure, useRoute, useRouter } from 'vue-router'
import { ApiError } from '@/shared/errors/api-error'
import { useProgramDepartments } from '@/shared/scope/program-departments'
import { useScopeStore } from '@/shared/scope/store'
import { useSessionStore } from '@/shared/session/store'
import { UiButton, UiEmptyState, UiErrorState } from '@/shared/ui'
import CreateTableForm from '../components/CreateTableForm.vue'
import TableCards from '../components/TableCards.vue'
import TableTemplates from '../components/TableTemplates.vue'
import { useTableCatalog } from '../composables/use-table-catalog'
import { useTableCreatePanel } from '../composables/use-table-create-panel'
import type { TableTarget } from '../model/types'
import TablesDetail from './TablesDetail.vue'
import { TABLE_DESIGN_ROUTE, TABLE_ROUTE, TABLES_ROUTE } from '../routes'
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
const { list, templates, listError, templateError, listItems, templateItems, recoverSource } =
  useTableCatalog(target, isList)
const activeArea = computed(
  () =>
    choices.value.find((item) => item.department_id === department.value)?.display_name ??
    'Koordinatörlük',
)
const panel = useTableCreatePanel({
  target,
  account: () => session.accountId,
  listReady: () => list.isSuccess.value,
  hasSource: (item) => !templates.isError.value && templateItems.value.includes(item),
  reload: async () => (await list.refetch()).isSuccess,
})
const {
  guardKey,
  canCreate,
  formOpen,
  source,
  held,
  refreshing,
  showCreate,
  showTemplate,
  closeCreate,
  refreshCreationList,
} = panel
const sourceAvailable = computed(
  () =>
    !templates.isError.value && templateItems.value.some((item) => item.id === source.value?.id),
)
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
    panel.reset()
    editorGeneration.value += 1
  },
  { flush: 'sync' },
)
async function openTable(tableId: string) {
  if (!formOpen.value) return
  const generation = editorGeneration.value
  try {
    if (
      !isNavigationFailure(
        await router.push({ name: TABLE_ROUTE.name, params: { tableId }, query: routeQuery.value }),
      )
    )
      return
  } catch {
    // Kayıt sunucuda tamamlandı. Başarısız gezinme işlemi yeniden açmaz.
  }
  if (editorGeneration.value !== generation) return
  await list.refetch()
  if (editorGeneration.value === generation) await closeCreate()
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
      <RouterLink v-if="isList" :to="TABLE_DESIGN_ROUTE.path">Tasarım önizlemesi</RouterLink>
      <UiButton
        v-if="isList && canCreate && !formOpen"
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
        :guard-key="guardKey"
        :source="source"
        :source-available="sourceAvailable"
        :area-label="unit ? activeArea : 'Kişisel'"
        :reload="refreshCreationList"
        @cancel="closeCreate"
        @created="openTable"
        @source-lost="recoverSource"
      />
      <div v-if="held && !formOpen" class="tables-notice" role="status">
        <p>
          {{
            held === 'pending'
              ? 'Önceki oluşturma işlemi sürüyor.'
              : 'Önceki oluşturmanın sonucu belirsiz. Yeni işlemden önce güncel listeyi okuyun.'
          }}
        </p>
        <UiButton
          v-if="held === 'uncertain'"
          size="sm"
          :disabled="refreshing"
          @click="refreshCreationList"
          >Listeyi yenile</UiButton
        >
      </div>
      <TableTemplates
        :items="templateItems"
        :pending="templates.isPending.value"
        :fetching="templates.isFetching.value"
        :has-next="templates.hasNextPage.value"
        :error="templateError"
        :form-open="formOpen"
        :can-create="canCreate"
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
