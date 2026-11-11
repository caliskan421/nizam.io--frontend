<script setup lang="ts">
import './deleted.css'
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
const uncertain = ref<string[]>([])

async function finish(
  result: Awaited<ReturnType<typeof restore.submit>> | null | undefined,
  id: string,
) {
  if (!result || !reachesOwner(result)) return
  if (result.kind === 'unknown_outcome') uncertain.value = [...uncertain.value, id]
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
  if (restore.isPending.value || purge.isPending.value || uncertain.value.includes(item.meeting_id))
    return
  await finish(
    await restore.submit({ programId: item.program_id, id: item.meeting_id }),
    item.meeting_id,
  )
}
async function purgeItem(item: Meeting) {
  if (restore.isPending.value || purge.isPending.value || uncertain.value.includes(item.meeting_id))
    return
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
  await finish(result, item.meeting_id)
}
</script>

<template>
  <section ref="section" class="meeting-deleted" tabindex="-1" :aria-label="text.title">
    <h2>{{ text.title }} {{ items.length }}</h2>
    <p v-if="error" role="alert">
      {{ text.error }} <button type="button" @click="emit('refresh')">{{ text.retry }}</button>
    </p>
    <p v-if="!props.items.length && !loading && !error">{{ text.empty }}</p>
    <ul v-if="props.items.length" class="meeting-deleted__list">
      <li v-for="item in props.items" :key="item.meeting_id" class="meeting-deleted__row">
        <h3>{{ item.title }}</h3>
        <p>{{ new Date(item.meeting_date).toLocaleString('tr-TR') }}</p>
        <p v-if="uncertain.includes(item.meeting_id)" role="status">{{ text.uncertain }}</p>
        <p v-if="item.deleted_by">{{ text.deletedBy }}: {{ item.deleted_by.full_name }}</p>
        <button
          class="t-btn t-btn--secondary t-btn--sm"
          type="button"
          :disabled="
            restore.isPending.value || purge.isPending.value || uncertain.includes(item.meeting_id)
          "
          @click="restoreItem(item)"
        >
          {{ text.restore }}
        </button>
        <button
          class="t-btn t-btn--secondary t-btn--sm"
          type="button"
          :disabled="
            restore.isPending.value || purge.isPending.value || uncertain.includes(item.meeting_id)
          "
          @click="purgeItem(item)"
        >
          {{ text.purge }}
        </button>
      </li>
    </ul>
    <p class="meeting-deleted__note">{{ text.note }}</p>
    <p v-if="loading" role="status">{{ text.loading }}</p>
    <button v-if="hasMore" type="button" :disabled="loading" @click="emit('loadMore')">
      {{ text.more }}
    </button>
  </section>
</template>
