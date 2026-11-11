<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { UiAvatar, UiButton, UiModal } from '@/shared/ui'
import { trMeetings } from '@/shared/i18n/tr/meetings'
import type { MeetingCandidates } from '../../model/types'
import './people.css'
const props = withDefaults(
  defineProps<{
    selectedIds: string[]
    lockedIds?: string[]
    candidates: MeetingCandidates
    loading: boolean
    error: boolean
    mode: 'draft' | 'add'
    scopeLimited?: boolean
  }>(),
  { lockedIds: () => [], scopeLimited: false },
)
const emit = defineEmits<{ close: []; select: [ids: string[]]; retry: [] }>()
const text = trMeetings.meetings.people
const open = ref(true)
const search = ref('')
const input = ref<HTMLInputElement | null>(null)
const selected = ref(new Set([...props.selectedIds, ...props.lockedIds]))
const locked = computed(() => new Set(props.lockedIds))
const count = computed(() => [...selected.value].filter((id) => !locked.value.has(id)).length)
const shown = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  return props.candidates.people.filter((p) => p.fullName.toLocaleLowerCase('tr-TR').includes(term))
})
function toggle(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}
onMounted(() => void nextTick(() => input.value?.focus()))
</script>
<template>
  <UiModal
    v-model:open="open"
    :title="mode === 'draft' ? text.draftTitle : text.selectorTitle"
    @close="emit('close')"
  >
    <label class="t-label"
      >{{ text.search
      }}<input ref="input" v-model="search" class="t-input" type="search" @keydown.enter.prevent
    /></label>
    <p v-if="scopeLimited">{{ text.partial }}</p>
    <p v-if="candidates.truncated">{{ text.truncated }}</p>
    <p v-if="loading">{{ text.loading }}</p>
    <p v-else-if="error">
      {{ text.error }} <button type="button" @click="emit('retry')">{{ text.retry }}</button>
    </p>
    <p v-else-if="!candidates.people.length">{{ text.empty }}</p>
    <p v-else-if="!shown.length">{{ text.noMatch }}</p>
    <label v-for="person in shown" v-else :key="person.accountId" class="meeting-person-row">
      <input
        class="t-check"
        type="checkbox"
        :checked="selected.has(person.accountId)"
        :disabled="locked.has(person.accountId)"
        @change="toggle(person.accountId)"
      />
      <UiAvatar :name="person.fullName" size="sm" /><span>{{ person.fullName }}</span
      ><small v-if="locked.has(person.accountId)">{{ text.participant }}</small>
    </label>
    <button v-if="mode === 'draft'" type="button" @click="selected = new Set(locked)">
      {{ text.clear }}
    </button>
    <template #footer
      ><span aria-live="polite">{{ count }} {{ text.selected }}</span
      ><UiButton variant="ghost" @click="emit('close')">{{ text.cancel }}</UiButton
      ><UiButton
        variant="primary"
        :disabled="mode === 'add' && count === 0"
        @click="
          emit(
            'select',
            [...selected].filter((id) => !locked.has(id)),
          )
        "
        >{{ text.apply }}</UiButton
      ></template
    >
  </UiModal>
</template>
