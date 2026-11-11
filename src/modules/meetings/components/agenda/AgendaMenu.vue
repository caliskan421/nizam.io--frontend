<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useScopeStore } from '@/shared/scope/store'
import { useSessionReset } from '../../pages/detail/use-session-reset'
import { UiIcon } from '@/shared/ui'
import { trMeetings } from '@/shared/i18n/tr/meetings'
const props = defineProps<{ id: string; title: string }>()
const emit = defineEmits<{ edit: []; remove: [] }>()
const scope = useScopeStore()
const text = trMeetings.meetings.agenda
const open = ref(false)
const trigger = ref<HTMLButtonElement | null>(null)
const menu = ref<HTMLElement | null>(null)
watch(
  () => scope.programId,
  () => {
    open.value = false
  },
)
useSessionReset(() => {
  open.value = false
})
function close() {
  open.value = false
  void nextTick(() => trigger.value?.focus())
}
function toggle() {
  if (open.value) return close()
  open.value = true
  void nextTick(() => menu.value?.querySelector<HTMLButtonElement>('button')?.focus())
}
function edit() {
  open.value = false
  emit('edit')
}
function remove() {
  close()
  emit('remove')
}
</script>
<template>
  <div class="meeting-agenda__menu-container">
    <div class="meeting-agenda__actions">
      <button
        ref="trigger"
        class="t-iconbtn meeting-agenda__menu-trigger"
        :data-agenda-id="id"
        type="button"
        :aria-label="`${props.title} ${text.actions}`"
        :aria-expanded="open"
        @click="toggle"
        @keydown.esc.stop="close"
      >
        <UiIcon name="more" size="sm" />
      </button>
    </div>
    <div v-if="open" ref="menu" class="meeting-agenda__menu" role="menu" @keydown.esc.stop="close">
      <button class="rp-menuitem" role="menuitem" type="button" @click="edit">
        {{ text.edit }}</button
      ><button
        class="rp-menuitem rp-menuitem--danger"
        role="menuitem"
        type="button"
        @click="remove"
      >
        {{ text.delete }}
      </button>
    </div>
  </div>
</template>
