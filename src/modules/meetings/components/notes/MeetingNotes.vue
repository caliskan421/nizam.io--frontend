<script setup lang="ts">
import './notes.css'
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { trMeetings } from '@/shared/i18n/tr/meetings'
import { designStub } from '@/shared/design-stub'
import { UiAvatar } from '@/shared/ui'
import { useInstanceStore } from '@/shared/instance/store'
import { reachesOwner } from '@/shared/http/mutation'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { ConflictDialog } from '@/shared/ui/conflict'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'
import { useMeetingNotes } from '../../api/queries'
import { useAddMeetingNote, useDeleteMeetingNote } from '../../api/note-writes'
import { meetingCapabilities } from '../../model/capabilities'
import type { MeetingDetail, MeetingNote } from '../../model/types'
import { useNoteEdit } from './use-note-edit'

const props = defineProps<{ meeting: MeetingDetail }>()
const emit = defineEmits<{ convert: [note: MeetingNote]; refresh: [] }>()
const scope = useScopeStore()
const route = useRoute()
const router = useRouter()
const instance = useInstanceStore()
const { standing } = useStanding()
const query = useMeetingNotes(() => props.meeting.meeting_id)
const add = useAddMeetingNote()
const remove = useDeleteMeetingNote()
const { confirmWrite } = useConfirm()
const draft = ref('')
const filter = computed(() =>
  route.query.notlar === 'gorev' ? 'converted' : route.query.notlar === 'benim' ? 'mine' : 'all',
)
function setFilter(value: 'all' | 'converted' | 'mine') {
  void router.replace({
    query: {
      ...route.query,
      notlar: value === 'converted' ? 'gorev' : value === 'mine' ? 'benim' : 'tumu',
    },
  })
}
const count = (value: number) => `${value}${query.hasNextPage.value ? '+' : ''}`
function time(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: instance.profile?.timezone ?? 'Europe/Istanbul',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
const openMenu = ref<string | null>(null)
const buttons = new Map<string, HTMLButtonElement>()
const notes = computed(() => query.data.value?.pages.flatMap((page) => page.items) ?? [])
const text = trMeetings.meetings.notes
const roleLabels = text.roles
const convertedLabel = designStub('BE-065', text.convertedLabel)
const converted = (note: MeetingNote) => !!note.converted_to_work_item_id
const mine = (note: MeetingNote) =>
  !!standing.value && note.author_account_id === standing.value.accountId
const shown = computed(() =>
  notes.value.filter(
    (n) => filter.value === 'all' || (filter.value === 'converted' ? converted(n) : mine(n)),
  ),
)
const access = computed(() =>
  meetingCapabilities(standing.value, scope.programId ?? '', {
    inviteMode: props.meeting.invite_mode,
    ownerDepartmentId: props.meeting.owner_department_id,
    departmentIds: props.meeting.departments.map((d) => d.department_id),
    createdByAccountId: props.meeting.created_by_account_id,
    membersIncluded: props.meeting.members_included,
    participant: props.meeting.participants.some((p) => p.account_id === standing.value?.accountId),
    viewerRole: props.meeting.viewer_role,
  }),
)
const facts = (n: MeetingNote) => ({
  authorAccountId: n.author_account_id,
  authorRole: n.author_role,
  converted: converted(n),
})
const target = () => ({ programId: scope.programId!, id: props.meeting.meeting_id })
const { update, conflict, editing, editDraft, saveNote } = useNoteEdit(target, () =>
  emit('refresh'),
)
watch(
  () => [props.meeting.meeting_id, scope.programId, standing.value?.accountId],
  () => {
    draft.value = ''
    editing.value = null
    openMenu.value = null
  },
)
function closeMenu(id: string) {
  openMenu.value = null
  void nextTick(() => buttons.get(id)?.focus())
}
function setButton(id: string, el: unknown) {
  if (el instanceof HTMLButtonElement) buttons.set(id, el)
  else buttons.delete(id)
}
function startEdit(note: MeetingNote) {
  editing.value = note
  editDraft.value = note.content
  closeMenu(note.note_id)
}
async function addNote() {
  if (
    !scope.programId ||
    !draft.value.trim() ||
    Array.from(draft.value).length > 5000 ||
    add.isPending.value
  )
    return
  const result = await add.submit({ ...target(), body: { content: draft.value } })
  if (!reachesOwner(result)) return
  if (result.kind === 'success') {
    draft.value = ''
    emit('refresh')
  } else notifyOutcome(result)
}
async function deleteNote(note: MeetingNote) {
  closeMenu(note.note_id)
  if (!scope.programId) return
  const result = await confirmWrite(
    {
      title: text.deleteTitle,
      body: [text.deleteBody],
      confirmLabel: text.delete,
      tone: 'danger',
    },
    (context) => remove.submit({ ...target(), noteId: note.note_id }, { context }),
  )
  if (!result || !reachesOwner(result)) return
  if (result.kind === 'success') emit('refresh')
  else notifyOutcome(result)
}
</script>

<template>
  <section class="t-card meeting-notes" :aria-label="text.title">
    <h2>
      {{ text.title }} <span>{{ count(notes.length) }}</span>
    </h2>
    <div role="group" :aria-label="text.filter">
      <button type="button" :aria-pressed="filter === 'all'" @click="setFilter('all')">
        {{ text.all }} {{ count(notes.length) }}</button
      ><button type="button" :aria-pressed="filter === 'converted'" @click="setFilter('converted')">
        {{ text.converted }} {{ count(notes.filter(converted).length) }}</button
      ><button type="button" :aria-pressed="filter === 'mine'" @click="setFilter('mine')">
        {{ text.mine }} {{ count(notes.filter(mine).length) }}
      </button>
    </div>
    <p v-if="query.hasNextPage.value">{{ text.partial }}</p>
    <form v-if="access.visible" class="meeting-notes__composer" @submit.prevent="addNote">
      <textarea v-model="draft" :aria-label="text.composer" :placeholder="text.placeholder" />
      <p>{{ text.hint }} · {{ Array.from(draft).length }} / 5000</p>
      <button
        type="submit"
        :disabled="!draft.trim() || Array.from(draft).length > 5000 || add.isPending.value"
      >
        {{ text.add }}
      </button>
    </form>
    <p v-if="query.isPending.value">{{ text.loading }}</p>
    <p v-else-if="query.isError.value">
      {{ text.error }} <button type="button" @click="query.refetch()">{{ text.retry }}</button>
    </p>
    <article v-for="note in shown" :key="note.note_id" class="meeting-notes__item">
      <UiAvatar :name="note.author_name" />
      <div class="meeting-notes__content">
        <strong>{{ note.author_name }}</strong>
        <small
          >{{ note.author_role ? roleLabels[note.author_role] : '' }} ·
          <time :datetime="note.created_at">{{ time(note.created_at) }}</time
          ><span v-if="note.edit_revision > 1"> · {{ text.edited }}</span></small
        >
        <form v-if="editing?.note_id === note.note_id" @submit.prevent="saveNote">
          <textarea v-model="editDraft" :aria-label="text.editor" /><button type="submit">
            {{ text.save }}</button
          ><button type="button" @click="editing = null">{{ text.cancel }}</button>
        </form>
        <p v-else>{{ note.content }}</p>
        <span v-if="converted(note)">{{ convertedLabel }}</span
        ><button
          v-else-if="access.convertNote(facts(note))"
          type="button"
          @click="emit('convert', note)"
        >
          {{ text.convert }}
        </button>
        <small v-if="converted(note) && mine(note) && !access.manage">{{ text.locked }}</small>
        <div v-if="access.editNote(facts(note)) || access.deleteNote(facts(note))">
          <button
            :ref="(el) => setButton(note.note_id, el)"
            type="button"
            :aria-label="`${text.actions}: ${note.author_name}`"
            :aria-expanded="openMenu === note.note_id"
            @click="openMenu === note.note_id ? closeMenu(note.note_id) : (openMenu = note.note_id)"
          >
            ⋯
          </button>
          <div
            v-if="openMenu === note.note_id"
            role="menu"
            @keydown.esc.stop="closeMenu(note.note_id)"
          >
            <button
              v-if="access.editNote(facts(note))"
              type="button"
              role="menuitem"
              @click="startEdit(note)"
            >
              {{ text.edit }}</button
            ><button
              v-if="access.deleteNote(facts(note))"
              type="button"
              role="menuitem"
              @click="deleteNote(note)"
            >
              {{ text.delete }}
            </button>
          </div>
        </div>
      </div>
    </article>
    <button
      v-if="query.hasNextPage.value"
      type="button"
      :disabled="query.isFetchingNextPage.value"
      @click="query.fetchNextPage()"
    >
      {{ text.more }}
    </button>
    <ConflictDialog
      v-model:open="conflict.open.value"
      :fields="conflict.fields.value"
      :busy="update.isPending.value"
      @resolve="conflict.choose"
      @cancel="conflict.dismiss"
    />
  </section>
</template>
