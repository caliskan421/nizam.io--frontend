<script setup lang="ts">
import { computed } from 'vue'
import { trMeetings } from '@/shared/i18n/tr/meetings'
const text = trMeetings.meetings.notes
const draft = defineModel<string>({ required: true })
defineProps<{ busy: boolean }>()
const emit = defineEmits<{ submit: [] }>()
const count = computed(() => Array.from(draft.value).length)
</script>
<template>
  <form class="meeting-notes__composer" @submit.prevent="emit('submit')">
    <textarea v-model="draft" :aria-label="text.composer" :placeholder="text.placeholder" />
    <p>{{ text.hint }} · {{ count }} / 5000</p>
    <button type="submit" :disabled="!draft.trim() || count > 5000 || busy">{{ text.add }}</button>
  </form>
</template>
