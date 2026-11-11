<script setup lang="ts">
import { trMeetings } from '@/shared/i18n/tr/meetings'
const text = trMeetings.meetings.notes
defineProps<{
  filter: 'all' | 'converted' | 'mine'
  all: string
  converted: string
  mine: string
}>()
const emit = defineEmits<{ change: [value: 'all' | 'converted' | 'mine'] }>()
</script>
<template>
  <div class="meeting-notes__header">
    <h2 tabindex="-1" data-testid="meeting-notes-title">{{ text.title }} {{ all }}</h2>
    <div class="rp-seg" role="group" :aria-label="text.filter">
      <button type="button" :aria-pressed="filter === 'all'" @click="emit('change', 'all')">
        {{ text.all }} {{ all }}
      </button>
      <button
        type="button"
        :aria-pressed="filter === 'converted'"
        @click="emit('change', 'converted')"
      >
        {{ text.converted }} {{ converted }}
      </button>
      <button type="button" :aria-pressed="filter === 'mine'" @click="emit('change', 'mine')">
        {{ text.mine }} {{ mine }}
      </button>
    </div>
  </div>
</template>
