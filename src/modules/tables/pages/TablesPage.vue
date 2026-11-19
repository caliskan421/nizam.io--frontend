<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ApiError } from '@/shared/errors/api-error'
import { usePageCrumb } from '@/shared/navigation/page-crumb'
import { useProgramDepartments } from '@/shared/scope/program-departments'
import { useScopeStore } from '@/shared/scope/store'
import { useSessionStore } from '@/shared/session/store'
import { UiButton, UiEmptyState, UiErrorState, UiIcon } from '@/shared/ui'

import { useTable, useTables } from '../api/tables'
import CreateTableForm from '../components/CreateTableForm.vue'
import type { TableTarget } from '../model/types'
import TableGrid from '../components/TableGrid.vue'
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

const rowsCursor = ref<string | null>(null)
const previousCursors = ref<Array<string | null>>([])
const isList = computed(() => tableId.value === null)
const list = useTables(target, isList)
const detail = useTable(target, tableId, rowsCursor)
const listError = computed(() => (list.error.value instanceof ApiError ? list.error.value : null))
const detailError = computed(() =>
  detail.error.value instanceof ApiError ? detail.error.value : null,
)
const safeDetail = computed(
  () => detailError.value?.status === 403 || detailError.value?.status === 404,
)
const listItems = computed(() => list.data.value?.pages.flatMap((page) => page.items) ?? [])
const snapshot = computed(() => (detail.error.value ? undefined : detail.data.value))
usePageCrumb(() => snapshot.value?.table.name ?? null)

const formOpen = ref(false)

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
    rowsCursor.value = null
    previousCursors.value = []
    formOpen.value = false
  },
  { flush: 'sync' },
)

function showCreate() {
  formOpen.value = true
}

async function closeCreate() {
  formOpen.value = false
  await nextTick()
  document.querySelector<HTMLElement>('#tables-create-trigger')?.focus()
}

function openTable(tableId: string) {
  if (formOpen.value)
    void router.push({ name: TABLE_ROUTE.name, params: { tableId }, query: routeQuery.value })
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
  <section class="tables-page" aria-labelledby="tables-title">
    <header class="tables-head">
      <div>
        <RouterLink
          v-if="tableId"
          class="tables-link"
          :to="{ name: TABLES_ROUTE.name, query: routeQuery }"
          >← Tablolar</RouterLink
        >
        <h1 id="tables-title">{{ tableId ? (snapshot?.table.name ?? 'Tablo') : 'Tablolar' }}</h1>
      </div>
      <UiButton
        v-if="isList && target && list.isSuccess.value && !formOpen"
        id="tables-create-trigger"
        variant="primary"
        icon="plus"
        @click="showCreate"
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
        :target="target"
        @cancel="closeCreate"
        @created="openTable"
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
      <UiEmptyState
        v-else-if="!listItems.length"
        title="Henüz tablo yok"
        text="Bu çalışma alanındaki tablolar burada görünür."
        icon="sheets"
      />
      <ul v-else class="tables-cards">
        <li v-for="item in listItems" :key="item.id">
          <RouterLink
            class="t-card tables-card"
            :to="{ name: TABLE_ROUTE.name, params: { tableId: item.id }, query: routeQuery }"
          >
            <UiIcon name="sheets" />
            <strong>{{ item.name }}</strong>
            <span v-if="item.owner_id === session.accountId" class="tables-chip">Sahip</span>
          </RouterLink>
        </li>
      </ul>
      <UiButton
        v-if="!list.isError.value && list.hasNextPage.value"
        size="sm"
        :disabled="list.isFetching.value"
        @click="list.fetchNextPage()"
        >Daha fazla tablo</UiButton
      >
    </template>

    <template v-else>
      <p v-if="detail.isPending.value" class="tables-empty" role="status">Tablo yükleniyor…</p>
      <UiEmptyState
        v-else-if="safeDetail"
        title="Tablo açılamadı"
        text="Bu tablo artık burada olmayabilir veya erişiminiz değişmiş olabilir."
        icon="sheets"
      />
      <UiErrorState
        v-else-if="detailError"
        title="Tablo yüklenemedi"
        :error="detailError"
        retryable
        :retrying="detail.isFetching.value"
        @retry="detail.refetch()"
      />
      <TableGrid v-else-if="snapshot" :snapshot="snapshot" />
      <div v-if="snapshot?.next_cursor || previousCursors.length" class="tables-actions">
        <UiButton v-if="previousCursors.length" size="sm" @click="previousRows"
          >Önceki satırlar</UiButton
        >
        <UiButton
          v-if="snapshot?.next_cursor"
          size="sm"
          :disabled="detail.isFetching.value"
          @click="nextRows"
          >Sonraki satırlar</UiButton
        >
      </div>
    </template>
  </section>
</template>
