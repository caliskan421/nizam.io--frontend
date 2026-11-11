<script setup lang="ts">
import './list.css'

import { computed } from 'vue'

import { workShortCode } from '../../model/short-code'
import { UiAvatar, UiIcon } from '@/shared/ui'

import type { WorkItem } from '../../model/types'
import { SubtaskBlock } from '../index'
import { formatDay } from './dates'
import { taskListText } from './messages'
import {
  avatarStack,
  dueNote,
  personName,
  requestTag,
  STATUS_DOT,
  statusLabel,
  subtaskToggle,
} from './row-view'

/**
 * Görev satırı (E-03-18…29). Seçim kutusu gizli, sütunu boş kalır (P7, E-03-18); öncelik
 * gösterilmez (E-03-29, karar bekliyor → gizli). Kısa kod: önek `ProgramDepartment.code`
 * (yoksa yok), sıra numarası statik `—` (BE-005). Alt görev bloğu satırın altında, bağımsız
 * açılır (E-03-21; içerik W44 `SubtaskBlock`, panel sekmesiyle aynı sorgu).
 */
const props = defineProps<{
  item: WorkItem
  departmentName: string
  code: string | null
  href: string
  selected: boolean
  expanded: boolean
  today: string
}>()
const emit = defineEmits<{
  open: []
  toggle: []
  openSubtasks: [workItemId: string]
}>()

const shortCode = computed(() => workShortCode(props.code) || null)
const subtasks = computed(() => subtaskToggle(props.item.subtask_counts))
const note = computed(() => dueNote(props.item, props.today))
const request = computed(() => requestTag(props.item))
const stack = computed(() =>
  avatarStack(
    props.item.assignees.map((a) => ({ id: a.account_id, name: personName(a.full_name) })),
  ),
)

const INTERACTIVE = 'a, button, input, select, label, textarea, [tabindex]'

/** Satır tıklaması paneli açar (E-03-19); içerideki denetimler kendi işini yapar. */
function onRowClick(event: MouseEvent): void {
  if ((event.target as Element | null)?.closest(INTERACTIVE)) return
  emit('open')
}
</script>

<template>
  <div
    role="row"
    class="rp-tr rp-tr--body task-row"
    :class="{ 'rp-sel': selected }"
    :aria-selected="selected ? 'true' : undefined"
    :data-work-item="item.work_item_id"
    @click="onRowClick"
  >
    <span role="cell" class="task-row__pick" />
    <span role="cell" class="task-row__main">
      <a class="rp-title rp-trunc" :href="href" @click.prevent="emit('open')">{{ item.title }}</a>
      <span class="rp-tmeta">
        <span class="rp-kicker task-row__code">{{ shortCode ?? '' }}</span>
        <button
          type="button"
          class="rp-subtog"
          :data-has="subtasks.has ? 'true' : 'false'"
          :data-done="subtasks.done ? 'true' : 'false'"
          :aria-expanded="expanded ? 'true' : 'false'"
          :title="taskListText('taskList.subtasks')"
          @click="emit('toggle')"
        >
          <UiIcon name="chevron-right" size="sm" />
          <span>{{ subtasks.label }}</span>
        </button>
        <span class="rp-cap rp-trunc task-row__dept">{{ departmentName }}</span>
      </span>
    </span>
    <span role="cell" class="rp-status">
      <span class="rp-dot" :class="`rp-dot--${STATUS_DOT[item.status]}`" aria-hidden="true" />
      <span class="rp-trunc">{{ statusLabel(item.status) }}</span>
    </span>
    <span role="cell" class="task-row__due">
      <span class="rp-mono">{{ formatDay(item.end_on) }}</span>
      <span
        v-if="note"
        class="rp-nowrap task-row__note"
        :class="note.tone === 'danger' ? 'rp-danger-text' : 'rp-faint'"
        >{{ note.text }}</span
      >
      <span v-if="request" class="rp-reqtag" :title="request.title">
        <UiIcon name="calendar" size="sm" />{{ request.label }}
      </span>
    </span>
    <span role="cell">
      <span class="rp-avstack">
        <span
          v-for="person in stack.shown"
          :key="person.id"
          class="rp-tip task-row__person"
          role="img"
          tabindex="0"
          :aria-label="person.name"
          :data-tip="person.name"
        >
          <UiAvatar :name="person.name" size="sm" />
        </span>
        <span
          v-if="stack.more"
          class="rp-tip task-row__person task-row__more"
          role="img"
          tabindex="0"
          :aria-label="stack.more.label"
          :data-tip="stack.more.label"
        >
          <span class="rp-av rp-av--sm" aria-hidden="true">{{ stack.more.text }}</span>
        </span>
      </span>
    </span>
  </div>
  <!-- Yerleşim kabı (rolsüz): tablo satırı + hücreyi `SubtaskBlock` verir (row > cell; W48). -->
  <div v-if="expanded" class="task-row__subs">
    <SubtaskBlock :item="item" @open-subtasks="emit('openSubtasks', $event)" />
  </div>
</template>
