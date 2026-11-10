<script setup lang="ts">
import './timeline/timeline.css'

import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'

import { canCreateWorkItem, NewTaskDialog, TASKS_ROUTE } from '@/modules/work/public'
import { toApiError } from '@/shared/errors/api-error'
import { UiButton, UiEmptyState, UiErrorState, UiIcon } from '@/shared/ui'

import {
  DateChangeSnack,
  GanttView,
  RangeStrip,
  SelectedTaskPanel,
  TimelineHead,
  TimelineLegend,
  TimelineToolbar,
  type GanttDayRange,
} from '../components'
import { frameText } from '../components/frame/messages'
import { dateKeyBinding } from '../composables/useGanttKeyboard'
import { useDateChange } from '../composables/useDateChange'
import { clearedFilters } from './timeline/url-state'
import { useFullscreen } from './timeline/use-fullscreen'
import { useSelectionReveal } from './timeline/use-panel-reveal'
import { useTimelinePage } from './timeline/use-timeline-page'

/**
 * 03c · Görevler › Zaman çizelgesi (`/zaman-cizelgesi`, S2; W93 sayfa çerçevesi). Yüz kapsamdan
 * türer (`useGantt`); süzgeç/ölçek/seçim URL'de (K10). Gantt çizimi W92, seçili görev paneli
 * W94, tarih sürükleme politikası W95: sayfa yalnız sözleşmeli bileşenleri bağlar. Dışa aktarım
 * pilotla doğrulanana dek devre dışı "yakında" (P19); tam ekran Gantt alanını örter.
 */
const router = useRouter()
const stage = ref<HTMLElement | null>(null)
const board = ref<HTMLElement | null>(null)
const ganttView = ref<{ scrollToDay?: (day: string) => void } | null>(null)
const view = ref<GanttDayRange | null>(null)
let trigger: HTMLElement | null = null

const creating = ref(false)
const page = useTimelinePage(() => {
  view.value = null
  trigger = null
  creating.value = false // kapsam değişince açık form kapanır (eski kapsamın seçimiyle gönderim yok)
})
const fullscreen = useFullscreen(stage)
// W95: sürükleme / klavye tarih değişimi (P8; 5 sn gecikmeli gönderim, İptal et).
const dateChange = useDateChange({
  taskOf: (id) => page.allTasks.value.find((t) => t.work_item_id === id),
  face: () => page.face.value,
})
const draggableIds = computed(() => dateChange.draggableIds(page.tasks.value))
const dateKeyHandler = dateKeyBinding(dateChange.nudge)
const { state, url, gantt } = page

const canCreate = computed(() => canCreateWorkItem(page.standing.value, page.store.programId))
const loadError = computed(() =>
  gantt.query.isError.value && !page.ready.value ? toApiError(gantt.query.error.value) : null,
)
const loading = computed(() => !page.ready.value && loadError.value === null)
const isEmpty = computed(() => page.ready.value && page.allTasks.value.length === 0)
const filteredEmpty = computed(
  () => page.ready.value && !isEmpty.value && page.tasks.value.length === 0,
)
const showGantt = computed(() => page.ready.value && page.tasks.value.length > 0)
const panelTask = computed(() => (showGantt.value ? page.selected.value : null))
const reveal = useSelectionReveal(board, () => panelTask.value?.work_item_id ?? null)
const ceiling = computed(() => page.ready.value && page.gantt.ceiling.value)

/** Sayfa içi diyalog (W97a, 03'ün aynı formu); önseçili birim: Admin süzgeci, yoksa kapsam. */
const newTaskDepartment = computed(() => state.value.department ?? page.store.departmentId)
function newTask(): void {
  creating.value = true
}

function select(id: string | null): void {
  if (id !== null) {
    reveal.arm()
    const active = document.activeElement
    trigger = active instanceof HTMLElement && active !== document.body ? active : null
  }
  void url.update({ selected: id }, 'push')
}

/** Panel kapanınca odak seçimi açan öğeye (yoksa Gantt kabına) döner, gövdeye düşmez (KESİN 27). */
function closePanel(): void {
  const target = trigger
  void url.update({ selected: null }, 'push').then(() =>
    nextTick(() => {
      const back = target?.isConnected ? target : board.value
      back?.focus()
    }),
  )
}

function openInList(workItemId: string): void {
  void router.push({ name: TASKS_ROUTE.name, query: { gorev: workItemId } })
}
</script>

<template>
  <section class="timeline-page" data-testid="timeline-page">
    <TimelineHead
      :task-count="page.counts.value.total"
      :done-count="page.counts.value.done"
      :overdue-count="page.counts.value.overdue"
      :approximate="ceiling"
      :can-create-task="canCreate"
      :pending="!page.ready.value"
      @show-list="router.push({ name: TASKS_ROUTE.name })"
      @new-task="newTask"
    />
    <div
      ref="stage"
      class="timeline-stage"
      :class="{ 'timeline-stage--full': fullscreen.active.value }"
      role="region"
      :aria-label="frameText('timeline.page.stage')"
      data-testid="timeline-stage"
    >
      <TimelineToolbar
        :status="state.status"
        :scale="state.scale"
        :departments="page.departmentOptions.value"
        :department-id="state.department"
        :show-department-filter="page.adminFace.value"
        :fullscreen="fullscreen.active.value"
        :export-ready="false"
        @update:status="url.update({ status: $event })"
        @update:scale="url.update({ scale: $event })"
        @update:department-id="url.update({ department: $event })"
        @update:fullscreen="fullscreen.set"
      />
      <p v-if="ceiling" class="timeline-ceiling" role="status" data-testid="timeline-ceiling">
        <UiIcon name="alert" size="sm" />
        {{ frameText('timeline.page.ceiling') }}
      </p>
      <RangeStrip
        v-if="page.ready.value"
        :range="page.range.value"
        :histogram="page.histogram.value"
        :view="view"
        :today="page.today.value"
        :year="page.year.value"
        @seek="ganttView?.scrollToDay?.($event)"
      />
      <TimelineLegend />
      <div
        ref="board"
        class="timeline-board"
        :class="{
          'timeline-board--panel': panelTask !== null,
          'timeline-board--state': !showGantt,
        }"
        tabindex="-1"
        data-testid="timeline-board"
      >
        <div
          v-if="loading"
          class="timeline-skeleton"
          role="status"
          :aria-label="frameText('timeline.page.loading')"
          data-skeleton
        >
          <div v-for="n in 8" :key="n" class="timeline-skeleton__row">
            <span class="timeline-skeleton__label" />
            <span class="timeline-skeleton__bar" :style="{ width: `${28 + ((n * 17) % 55)}%` }" />
          </div>
        </div>
        <UiErrorState
          v-else-if="loadError"
          :error="loadError"
          :title="frameText('timeline.page.loadError')"
          retryable
          :retrying="gantt.query.isFetching.value"
          @retry="gantt.query.refetch()"
        />
        <UiEmptyState
          v-else-if="isEmpty"
          icon="gantt"
          :title="frameText('timeline.page.empty.title')"
          :text="frameText('timeline.page.empty.text')"
        >
          <template v-if="canCreate" #action>
            <UiButton size="sm" variant="primary" icon="plus" @click="newTask">
              {{ frameText('timeline.frame.head.create') }}
            </UiButton>
          </template>
        </UiEmptyState>
        <UiEmptyState
          v-else-if="filteredEmpty"
          icon="search"
          :title="frameText('timeline.page.filteredEmpty.title')"
          :text="frameText('timeline.page.filteredEmpty.text')"
        >
          <template #action>
            <UiButton size="sm" @click="url.update(clearedFilters(state))">
              {{ frameText('timeline.page.filteredEmpty.clear') }}
            </UiButton>
          </template>
        </UiEmptyState>
        <template v-else>
          <GanttView
            ref="ganttView"
            :tasks="page.tasks.value"
            :links="gantt.links.value"
            :scale="state.scale"
            :today="page.today.value"
            :department-names="page.departmentNames.value"
            :department-codes="page.adminFace.value ? page.departmentCodes.value : undefined"
            :selected-id="state.selected"
            :draggable-ids="draggableIds"
            :date-key-handler="dateKeyHandler"
            @edge-drag="dateChange.onEdgeDrag"
            @select="select"
            @scroll="view = $event"
          />
          <div v-if="panelTask && page.face.value" class="timeline-dock">
            <SelectedTaskPanel
              :key="panelTask.work_item_id"
              class="timeline-panel"
              :task="panelTask"
              :face="page.face.value"
              :department-name="page.departmentNames.value.get(panelTask.department_id) ?? null"
              @close="closePanel"
              @open-in-list="openInList"
            />
          </div>
        </template>
      </div>
    </div>
    <NewTaskDialog v-if="canCreate" v-model:open="creating" :department-id="newTaskDepartment" />
    <p class="rp-sr" role="status" aria-live="polite" data-testid="timeline-date-announce">
      {{ dateChange.announcement.value }}
    </p>
    <DateChangeSnack
      v-if="dateChange.snack.value?.visible"
      v-bind="dateChange.snack.value.props"
      @cancel="dateChange.cancel"
      @dismiss="dateChange.dismiss"
    />
  </section>
</template>
