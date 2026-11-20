<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import { useInstanceStore } from '@/shared/instance/store'
import { toApiError } from '@/shared/errors/api-error'
import { UiButton, UiErrorState } from '@/shared/ui'

import { useMemoryQueries } from '../model/queries'
import type { Source, WorkNote } from '../model/types'

const emit = defineEmits<{ create: [Source, string, string?]; detail: [string] }>()
const queries = useMemoryQueries()
const instance = useInstanceStore()
const filter = ref<Source['kind'] | 'all'>('all')
const text = ref('')
const q = ref('')
const work = queries.workNotes(
  () => q.value,
  () => filter.value !== 'meeting_note',
)
const meeting = queries.meetingNotes(
  () => q.value,
  () => filter.value !== 'work_note',
)
const workPages = computed(() =>
  filter.value === 'meeting_note' || work.isError.value ? [] : (work.data.value?.pages ?? []),
)
const meetingPages = computed(() =>
  filter.value === 'work_note' || meeting.isError.value ? [] : (meeting.data.value?.pages ?? []),
)
const workItems = computed(() => workPages.value.flatMap((page) => page.items))
const meetingItems = computed(() => meetingPages.value.flatMap((page) => page.items))
const workLinks = queries.sources('work_note', () => workItems.value.map((item) => item.id))
const meetingLinks = queries.sources('meeting_note', () =>
  meetingItems.value.map((item) => item.id),
)

function workLink(note: WorkNote): RouteLocationRaw | undefined {
  const scope = queries.scope.store
  const unit = note.work_item.department_id
  if (scope.lens !== 'admin' && scope.departmentId !== unit) return undefined
  return {
    name: 'work.tasks',
    query: {
      gorev: note.work_item.id,
      ...(scope.lens === 'admin' ? { koordinatorluk: unit } : {}),
    },
  }
}

const notes = computed(() =>
  [
    ...workItems.value.map((note) => ({
      ...note,
      kind: 'work_note' as const,
      source: note.work_item.title,
      unit: note.work_item.department_id,
      link: workLink(note),
      relation: workLinks.data.value?.[note.id],
      relationReady: workLinks.isSuccess.value,
    })),
    ...meetingItems.value.map((note) => ({
      ...note,
      kind: 'meeting_note' as const,
      source: note.meeting.title,
      unit: undefined,
      link: { name: 'collaboration.meeting', params: { meetingId: note.meeting.id } },
      relation: meetingLinks.data.value?.[note.id],
      relationReady: meetingLinks.isSuccess.value,
    })),
  ].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || b.id.localeCompare(a.id)),
)

const visible = computed(() => [
  ...(filter.value === 'meeting_note' ? [] : [{ label: 'Görev notları', query: work }]),
  ...(filter.value === 'work_note' ? [] : [{ label: 'Toplantı notları', query: meeting }]),
])
const pending = computed(() => visible.value.some(({ query }) => query.isPending.value))

function retryLinks() {
  if (workLinks.isError.value) void workLinks.refetch()
  if (meetingLinks.isError.value) void meetingLinks.refetch()
}
function dateLabel(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: instance.profile?.timezone ?? 'Europe/Istanbul',
  }).format(new Date(value))
}
</script>

<template>
  <section class="memory-list" aria-label="Programdaki görünür notlar">
    <div class="memory-controls">
      <div class="memory-controls" role="group" aria-label="Not kaynağı">
        <UiButton size="sm" :aria-pressed="filter === 'all'" @click="filter = 'all'">Tümü</UiButton>
        <UiButton size="sm" :aria-pressed="filter === 'work_note'" @click="filter = 'work_note'"
          >Görev notları</UiButton
        >
        <UiButton
          size="sm"
          :aria-pressed="filter === 'meeting_note'"
          @click="filter = 'meeting_note'"
          >Toplantı notları</UiButton
        >
      </div>
      <form class="memory-controls" @submit.prevent="q = text.trim()">
        <input
          v-model="text"
          type="search"
          maxlength="200"
          class="t-input"
          aria-label="Notlarda ara"
          placeholder="Notlarda ara"
        /><UiButton size="sm" type="submit">Ara</UiButton>
      </form>
    </div>
    <p class="memory-muted">Seçili programda erişebildiğiniz görev ve toplantı notları.</p>
    <p v-if="pending" role="status">Notlar yükleniyor…</p>
    <template v-for="entry in visible" :key="entry.label">
      <UiErrorState
        v-if="entry.query.error.value"
        :error="toApiError(entry.query.error.value)"
        :title="entry.label + ' alınamadı'"
        retryable
        @retry="entry.query.refetch()"
      />
    </template>
    <p v-if="!pending && !notes.length && visible.every(({ query }) => !query.isError.value)">
      Not bulunamadı.
    </p>
    <article v-for="note in notes" :key="note.kind + note.id" class="t-card memory-note">
      <div class="memory-controls">
        <strong>{{ note.author_full_name || 'Bilinmeyen yazar' }}</strong
        ><span class="memory-meta">{{ dateLabel(note.created_at) }}</span>
        <RouterLink v-if="note.link" :to="note.link">{{ note.source }}</RouterLink
        ><span v-else>{{ note.source }}</span>
      </div>
      <p>{{ note.content }}</p>
      <div class="memory-controls">
        <UiButton v-if="note.relation" size="sm" @click="emit('detail', note.relation)"
          >Hafızada</UiButton
        >
        <UiButton
          v-else
          :disabled="!note.relationReady"
          size="sm"
          @click="emit('create', { id: note.id, kind: note.kind }, note.source, note.unit)"
          >Hafızaya ekle</UiButton
        >
      </div>
    </article>
    <div class="memory-controls">
      <template v-for="entry in visible" :key="entry.label">
        <UiButton
          v-if="entry.query.hasNextPage.value"
          size="sm"
          :disabled="entry.query.isFetchingNextPage.value"
          @click="entry.query.fetchNextPage()"
          >{{ entry.label }} · Daha fazla</UiButton
        >
      </template>
    </div>
    <div
      v-if="workLinks.isError.value || meetingLinks.isError.value"
      class="memory-controls"
      role="status"
    >
      Bağlı deneyimler alınamadı.
      <UiButton size="sm" @click="retryLinks">Yeniden dene</UiButton>
    </div>
  </section>
</template>
