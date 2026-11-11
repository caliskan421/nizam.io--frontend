<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { components } from '@/shared/api/schema'
import { UiIcon, UiMenu, UiMenuItem } from '@/shared/ui'

defineProps<{ departments: components['schemas']['ProgramDepartment'][]; selected: string }>()
const emit = defineEmits<{ select: [id: string] }>()
const { t } = useI18n()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
function outside(event: MouseEvent) {
  if (!root.value?.contains(event.target as Node)) close(false)
}
function close(focus: boolean) {
  if (!open.value) return
  open.value = false
  document.removeEventListener('click', outside, true)
  if (focus) void nextTick(() => trigger.value?.focus())
}
function toggle() {
  if (open.value) return close(true)
  open.value = true
  document.addEventListener('click', outside, true)
}
function pick(id: string) {
  emit('select', id)
  close(true)
}
onBeforeUnmount(() => document.removeEventListener('click', outside, true))
</script>
<template>
  <div ref="root" class="meeting-filter">
    <button
      ref="trigger"
      type="button"
      class="t-btn t-btn--secondary t-btn--sm"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-controls="open ? 'meeting-department-menu' : undefined"
      @click="toggle"
    >
      {{ t('meetings.list.department') }} <UiIcon name="chevron-down" size="sm" />
    </button>
    <UiMenu
      v-if="open"
      id="meeting-department-menu"
      class="meeting-filter-menu"
      :label="t('meetings.list.department')"
      @close="close(true)"
    >
      <UiMenuItem :checked="!selected" @select="pick('')">{{ t('meetings.list.all') }}</UiMenuItem>
      <UiMenuItem
        v-for="department in departments"
        :key="department.department_id"
        :checked="selected === department.department_id"
        @select="pick(department.department_id)"
        >{{ department.display_name }}</UiMenuItem
      >
    </UiMenu>
  </div>
</template>
