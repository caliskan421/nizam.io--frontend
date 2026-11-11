<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { usePermanentDeleteMeeting, useRestoreMeeting } from '../../api/meeting-writes'
import type { Meeting } from '../../model/types'
import { reachesOwner } from '@/shared/http/mutation'
import { trMeetings } from '@/shared/i18n/tr/meetings'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'

const props = defineProps<{
  items: Meeting[]
  hasMore?: boolean
  loading?: boolean
  error?: boolean
}>()
const emit = defineEmits<{ close: []; refresh: []; loadMore: [] }>()
const text = trMeetings.meetings.deleted
const restore = useRestoreMeeting()
const purge = usePermanentDeleteMeeting()
const { confirmWrite } = useConfirm()
const section = ref<HTMLElement | null>(null)

async function finish(result: Awaited<ReturnType<typeof restore.submit>> | undefined) {
  if (!result || !reachesOwner(result)) return
  if (
    result.kind === 'success' ||
    (result.kind === 'failed' && result.error.code === 'collaboration.meeting_not_found')
  ) {
    emit('refresh')
    await nextTick()
    section.value?.focus()
  } else notifyOutcome(result)
}
async function restoreItem(item: Meeting) {
  if (restore.isPending.value || purge.isPending.value) return
  await finish(await restore.submit({ programId: item.program_id, id: item.meeting_id }))
}
async function purgeItem(item: Meeting) {
  if (restore.isPending.value || purge.isPending.value) return
  const result = await confirmWrite(
    {
      title: text.confirmTitle,
      description: item.title,
      body: [text.confirmBody],
      confirmLabel: text.purge,
      tone: 'danger',
    },
    (context) => purge.submit({ programId: item.program_id, id: item.meeting_id }, { context }),
  )
  await finish(result)
}
</script>

<template>
  <section ref="section" tabindex="-1" :aria-label="text.title">
    <h2>{{ text.title }}</h2>
    <p v-if="error" role="alert">
      {{ text.error }} <button type="button" @click="emit('refresh')">{{ text.retry }}</button>
    </p>
    <p v-if="!props.items.length && !loading && !error">{{ text.empty }}</p>
    <ul v-if="props.items.length">
      <li v-for="item in props.items" :key="item.meeting_id">
        <h3>{{ item.title }}</h3>
        <p>{{ new Date(item.meeting_date).toLocaleString('tr-TR') }}</p>
        <p v-if="item.deleted_by">{{ text.deletedBy }}: {{ item.deleted_by.full_name }}</p>
        <button
          type="button"
          :disabled="restore.isPending.value || purge.isPending.value"
          @click="restoreItem(item)"
        >
          {{ text.restore }}
        </button>
        <button
          type="button"
          :disabled="restore.isPending.value || purge.isPending.value"
          @click="purgeItem(item)"
        >
          {{ text.purge }}
        </button>
      </li>
    </ul>
    <p v-if="loading" role="status">{{ text.loading }}</p>
    <button v-if="hasMore" type="button" :disabled="loading" @click="emit('loadMore')">
      {{ text.more }}
    </button>
  </section>
</template>
