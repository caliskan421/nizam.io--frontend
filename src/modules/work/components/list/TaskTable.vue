<script setup lang="ts">
import './list.css'

import { ref } from 'vue'

import { designStub } from '@/shared/design-stub'
import { UiIcon } from '@/shared/ui'

import type { ProgramDepartment, WorkItem } from '../../model/types'
import { taskListText } from './messages'
import type { RowSort, RowSortField } from './rows'
import TaskRow from './TaskRow.vue'

/**
 * Görev tablosu (`rp-dtable`, E-03-15…28). Sütunlar: (gizli seçim) · görev · durum · bitiş ·
 * kişi. Sıralama düğmeleri yüklenen kümede istemci sıralaması ister (E-03-16, `designStub
 * ('BE-040')`); etkin sütunda `aria-sort`. Açık alt görev blokları bellekte, birbirinden
 * bağımsız (E-03-21); kapsam değişince çağıran tabloyu yeniden kurar. Yükleniyor: iskelet satır.
 */
const props = defineProps<{
  items: readonly WorkItem[]
  departments: ReadonlyMap<string, ProgramDepartment>
  selectedId: string | null
  sort: RowSort | null
  today: string
  loading: boolean
  hrefFor: (workItemId: string) => string
}>()
const emit = defineEmits<{
  open: [workItemId: string, tab: 'summary' | 'subtasks']
  sort: [field: RowSortField]
}>()

const SORTABLE: readonly RowSortField[] = ['gorev', 'durum', 'bitis']
const SKELETON_ROWS = 10

const expanded = ref(new Set<string>())

function toggle(id: string): void {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

function ariaSort(field: RowSortField): 'ascending' | 'descending' | 'none' {
  if (props.sort?.field !== field) return 'none'
  return props.sort.direction === 'artan' ? 'ascending' : 'descending'
}

function requestSort(field: RowSortField): void {
  emit('sort', designStub('BE-040', field))
}

function department(id: string): ProgramDepartment | undefined {
  return props.departments.get(id)
}
</script>

<template>
  <div class="rp-dtable">
    <div class="rp-scroll">
      <div
        role="table"
        class="task-table"
        :aria-label="taskListText('taskList.table')"
        :aria-busy="loading ? 'true' : undefined"
      >
        <div role="row" class="rp-tr rp-tr--head task-row">
          <span role="columnheader" class="task-row__pick" />
          <span
            v-for="field in SORTABLE"
            :key="field"
            role="columnheader"
            :aria-sort="ariaSort(field)"
          >
            <button
              type="button"
              class="rp-sortbtn"
              :data-sort="field"
              :title="
                taskListText('taskList.sortHint', {
                  column: taskListText(`taskList.column.${field}`),
                })
              "
              @click="requestSort(field)"
            >
              {{ taskListText(`taskList.column.${field}`) }}
              <UiIcon
                v-if="sort?.field === field"
                :name="sort.direction === 'artan' ? 'chevron-up' : 'chevron-down'"
                size="sm"
              />
            </button>
          </span>
          <span role="columnheader">{{ taskListText('taskList.column.kisi') }}</span>
        </div>
        <template v-if="loading">
          <div
            v-for="n in SKELETON_ROWS"
            :key="`skeleton-${n}`"
            role="row"
            class="rp-tr task-row task-row--skeleton"
            :aria-label="n === 1 ? taskListText('taskList.loading') : undefined"
            data-skeleton
          >
            <span v-for="c in 5" :key="c" role="cell"><span class="task-skel" /></span>
          </div>
        </template>
        <template v-else>
          <TaskRow
            v-for="item in items"
            :key="item.work_item_id"
            :item="item"
            :department-name="department(item.department_id)?.display_name ?? ''"
            :code="department(item.department_id)?.code ?? null"
            :href="hrefFor(item.work_item_id)"
            :selected="item.work_item_id === selectedId"
            :expanded="expanded.has(item.work_item_id)"
            :today="today"
            @open="emit('open', item.work_item_id, 'summary')"
            @toggle="toggle(item.work_item_id)"
            @open-subtasks="emit('open', $event, 'subtasks')"
          />
        </template>
      </div>
    </div>
  </div>
</template>
