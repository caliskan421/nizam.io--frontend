<script setup lang="ts">
import './users-page.css'

import { nextTick, onBeforeUnmount, ref } from 'vue'

import { UiCount, UiIcon, UiMenu, UiMenuItem } from '@/shared/ui'

import { usersText } from '../../components/users/messages'
import type { ProgramDepartment } from '../../model/types'

/**
 * Koordinatörlük süzgeci (E-05-08): TEK seçim (çoklu yok — K3, P4); seçenekler
 * `listProgramDepartments` (programdaki ad, G13). Seçiliyken tablo yalnız o birimin
 * `listMembers`'ı. Program yoksa devre dışı. Menü dışarı tık, Esc ve Tab ile kapanır.
 */
const props = defineProps<{ departments: readonly ProgramDepartment[]; disabled: boolean }>()
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
  <div ref="root" class="users-pop-anchor">
    <button
      ref="trigger"
      type="button"
      class="t-btn t-btn--secondary t-btn--sm users-filterbtn"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      :title="disabled ? usersText('organization.users.department.noProgram') : name(model)"
      :disabled="disabled"
      data-testid="department-filter"
      @click="toggle"
    >
      {{ usersText('organization.users.department.label') }}
      <UiCount v-if="model" value="1" />
      <UiIcon name="chevron-down" size="sm" />
    </button>
    <UiMenu
      v-if="open"
      class="users-filterpop"
      :label="usersText('organization.users.department.menu')"
      @close="close(true)"
    >
      <UiMenuItem :checked="model === null" @select="pick(null)">
        {{ usersText('organization.users.department.all') }}
      </UiMenuItem>
      <UiMenuItem
        v-for="d in departments"
        :key="d.department_id"
        :checked="model === d.department_id"
        :data-department="d.department_id"
        @select="pick(d.department_id)"
      >
        {{ d.display_name }}
      </UiMenuItem>
    </UiMenu>
  </div>
</template>
