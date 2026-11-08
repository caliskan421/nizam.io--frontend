<script setup lang="ts">
import './tasks.css'

import { nextTick, onBeforeUnmount, ref } from 'vue'

import { UiCount, UiIcon, UiMenu, UiMenuItem } from '@/shared/ui'

import type { ProgramDepartment } from '../../model/types'
import { tasksText } from './messages'

/**
 * Koordinatörlük süzgeci (E-03-12): TEK seçim, değer sunucuya `department_id` olarak gider (K3;
 * çoklu seçim reddedildi, P4). Rozet yalnız 0/1. Seçenekler `listProgramDepartments` (Admin
 * merceği). Açılır menü dışarı tıklama, Esc ve Tab ile kapanır; odak tetiğe döner.
 */
const props = defineProps<{ departments: readonly ProgramDepartment[] }>()
const model = defineModel<string | null>({ required: true })

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)

function onDocumentClick(event: MouseEvent): void {
  if (!root.value?.contains(event.target as Node)) close(false)
}

function close(returnFocus: boolean): void {
  if (!open.value) return
  open.value = false
  document.removeEventListener('click', onDocumentClick, true)
  if (returnFocus) void nextTick(() => trigger.value?.focus())
}

function toggle(): void {
  if (open.value) return close(true)
  open.value = true
  document.addEventListener('click', onDocumentClick, true)
}

function pick(departmentId: string | null): void {
  model.value = departmentId
  close(true)
}

function name(departmentId: string | null): string | undefined {
  return props.departments.find((d) => d.department_id === departmentId)?.display_name
}

onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick, true))
</script>

<template>
  <div ref="root" class="tasks-pop-anchor">
    <button
      ref="trigger"
      type="button"
      class="t-btn t-btn--secondary t-btn--sm tasks-filterbtn"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      :title="name(model)"
      data-testid="department-filter"
      @click="toggle"
    >
      {{ tasksText('tasksPage.department.label') }}
      <UiCount v-if="model" class="tasks-filterbtn__n" value="1" />
      <UiIcon name="chevron-down" size="sm" />
    </button>
    <UiMenu
      v-if="open"
      class="tasks-pop"
      :label="tasksText('tasksPage.department.menu')"
      @close="close(true)"
    >
      <UiMenuItem :checked="model === null" @select="pick(null)">
        {{ tasksText('tasksPage.department.all') }}
      </UiMenuItem>
      <UiMenuItem
        v-for="d in departments"
        :key="d.department_id"
        :checked="model === d.department_id"
        @select="pick(d.department_id)"
      >
        {{ d.display_name }}
      </UiMenuItem>
    </UiMenu>
  </div>
</template>
