<script setup lang="ts">
import { computed } from 'vue'
import { trMeetings } from '@/shared/i18n/tr/meetings'
const text = trMeetings.meetings.notes
const draft = defineModel<string>({ required: true })
defineProps<{ busy: boolean; uncertain?: boolean }>()
const emit = defineEmits<{ submit: []; clear: [] }>()
const count = computed(() => Array.from(draft.value).length)
function clear() {
  draft.value = ''
  emit('clear')
}
</script>
<template>
  <form class="meeting-notes__composer" @submit.prevent="emit('submit')">
    <textarea
      v-model="draft"
      :aria-label="text.composer"
      :placeholder="text.placeholder"
      :disabled="busy"
    />
    <p v-if="uncertain" role="status">
      {{ text.uncertain }} <button type="button" @click="clear">{{ text.clear }}</button>
    </p>
    <div class="meeting-notes__composer-foot">
      <p>{{ text.hint }} · {{ count }} / 5000</p>
      <button
        class="t-btn t-btn--primary t-btn--sm"
        type="submit"
        :disabled="!draft.trim() || count > 5000 || busy || uncertain"
      >
        {{ text.add }}
      </button>
    </div>
  </form>
</template>
