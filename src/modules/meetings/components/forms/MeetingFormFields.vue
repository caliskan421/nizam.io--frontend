<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { trMeetings } from '@/shared/i18n/tr/meetings'
const text = trMeetings.meetings.forms
const title = defineModel<string>('title', { required: true })
const date = defineModel<string>('date', { required: true })
const time = defineModel<string>('time', { required: true })
const props = defineProps<{
  fieldErrors: Record<string, string>
  dateChanged: boolean
  today: string
  departmentEdit: boolean
  initialFocus?: 'date'
}>()
const dateInput = ref<HTMLInputElement | null>(null)
onMounted(async () => {
  if (props.initialFocus === 'date') {
    await nextTick()
    await nextTick()
    dateInput.value?.focus()
  }
})
</script>
<template>
  <template v-if="!departmentEdit">
    <label class="rp-field meeting-form__title"
      >{{ text.title }} <span class="rp-count">{{ Array.from(title).length }} / 255</span
      ><input
        v-model="title"
        class="t-input"
        :aria-invalid="fieldErrors.title ? true : undefined"
        :aria-describedby="fieldErrors.title ? 'meeting-title-error' : undefined"
        required
      /><span v-if="fieldErrors.title" id="meeting-title-error" role="alert">{{
        fieldErrors.title
      }}</span></label
    >
    <label class="rp-field meeting-form__date"
      >{{ text.date
      }}<input
        ref="dateInput"
        v-model="date"
        class="t-input"
        type="date"
        :aria-invalid="fieldErrors.meeting_date ? true : undefined"
        :aria-describedby="fieldErrors.meeting_date ? 'meeting-date-error' : undefined"
        :min="dateChanged ? today : undefined"
        required
      /><span class="t-hint">{{ text.dateHint }}</span
      ><span v-if="fieldErrors.meeting_date" id="meeting-date-error" role="alert">{{
        fieldErrors.meeting_date
      }}</span></label
    >
    <label class="rp-field meeting-form__time"
      >{{ text.time
      }}<input
        v-model="time"
        class="t-input"
        type="time"
        :aria-invalid="fieldErrors.meeting_date ? true : undefined"
        :aria-describedby="fieldErrors.meeting_date ? 'meeting-date-error' : undefined"
        required
    /></label>
  </template>
  <template
    v-for="key in ['invite_mode', 'department_ids', 'participant_ids', 'members_included']"
    :key="key"
  >
    <p v-if="fieldErrors[key]" :id="`meeting-${key}-error`" role="alert">{{ fieldErrors[key] }}</p>
  </template>
</template>
