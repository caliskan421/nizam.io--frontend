<script setup lang="ts">
import './notes.css'
import { computed, onScopeDispose, ref, watch } from 'vue'
import { trMeetings } from '@/shared/i18n/tr/meetings'
import { designStub } from '@/shared/design-stub'
import { UiAvatar } from '@/shared/ui'
import { useInstanceStore } from '@/shared/instance/store'
import { authSession } from '@/shared/http'
import { reachesOwner } from '@/shared/http/mutation'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { ConflictDialog } from '@/shared/ui/conflict'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'
import { useMeetingNotes } from '../../api/queries'
import { useAddMeetingNote, useDeleteMeetingNote } from '../../api/note-writes'
import { meetingCapabilities } from '../../model/capabilities'
import type { MeetingDetail, MeetingNote } from '../../model/types'
import NoteFilters from './NoteFilters.vue'
import NoteComposer from './NoteComposer.vue'
import { noteCount, noteTime, noteFacts, noteFocus } from './notes-view'
import { useNoteFilter } from './use-note-filter'
import { useNoteEdit } from './use-note-edit'

const props = defineProps<{ meeting: MeetingDetail }>()
const emit = defineEmits<{ convert: [note: MeetingNote]; refresh: [] }>()
const scope = useScopeStore()
const instance = useInstanceStore()
const { standing } = useStanding()
const query = useMeetingNotes(() => props.meeting.meeting_id)
const add = useAddMeetingNote()
const remove = useDeleteMeetingNote()
const { confirmWrite } = useConfirm()
const draft = ref('')
const unknownDraft = ref<string | null>(null)
const { filter, setFilter } = useNoteFilter()
const count = (value: number) => noteCount(value, query.hasNextPage.value)
const time = (value: string) => noteTime(value, instance.profile?.timezone)
const openMenu = ref<string | null>(null)
const { focus: focusNote, bind: setButton } = noteFocus()
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
const facts = noteFacts
const target = () => ({ programId: scope.programId!, id: props.meeting.meeting_id })
let version = 0
const { update, conflict, editing, editDraft, saveNote } = useNoteEdit(
  target,
  () => version,
  () => {
    const id = editing.value?.note_id
    void query.refetch()
    emit('refresh')
    if (id) focusNote(id)
  },
)
function resetDraft() {
  version += 1
  draft.value = ''
  unknownDraft.value = null
  editing.value = null
  openMenu.value = null
}
watch(() => [props.meeting.meeting_id, scope.programId, JSON.stringify(standing.value)], resetDraft)
const initialGeneration = authSession.generation
const offSession = authSession.subscribe(() => {
  if (authSession.generation !== initialGeneration) resetDraft()
})
onScopeDispose(offSession)
function cancelEdit(note: MeetingNote) {
  editing.value = null
  focusNote(note.note_id)
}
function closeMenu(id: string) {
  openMenu.value = null
  focusNote(id)
}
function startEdit(note: MeetingNote) {
  editing.value = note
  editDraft.value = note.content
  closeMenu(note.note_id)
}
function clearDraft() {
  draft.value = ''
  unknownDraft.value = null
}
async function addNote() {
  if (
    !scope.programId ||
    !draft.value.trim() ||
    Array.from(draft.value).length > 5000 ||
    add.isPending.value ||
    draft.value === unknownDraft.value
  )
    return
  const started = version
  const content = draft.value
  const result = await add.submit({ ...target(), body: { content } })
  if (!reachesOwner(result) || started !== version) return
  if (result.kind === 'success') {
    unknownDraft.value = null
    draft.value = ''
    emit('refresh')
  } else {
    if (result.kind === 'unknown_outcome') unknownDraft.value = content
    notifyOutcome(result)
  }
}
async function deleteNote(note: MeetingNote) {
  closeMenu(note.note_id)
  if (!scope.programId) return
  const started = version
  const result = await confirmWrite(
    {
      title: text.deleteTitle,
      body: [text.deleteBody],
      confirmLabel: text.delete,
      tone: 'danger',
    },
    (context) => remove.submit({ ...target(), noteId: note.note_id }, { context }),
  )
  if (!result || !reachesOwner(result) || started !== version) return
  if (result.kind === 'success') emit('refresh')
  else notifyOutcome(result)
}
</script>

<template>
  <section class="t-card meeting-notes" :aria-label="text.title">
    <h2 tabindex="-1" data-testid="meeting-notes-title">
      {{ text.title }} {{ count(notes.length) }}
    </h2>
    <NoteFilters
      :filter="filter"
      :all="count(notes.length)"
      :converted="count(notes.filter(converted).length)"
      :mine="count(notes.filter(mine).length)"
      @change="setFilter"
    />
    <NoteComposer
      v-if="access.visible"
      v-model="draft"
      :busy="add.isPending.value"
      :uncertain="draft === unknownDraft"
      @clear="clearDraft"
      @submit="addNote"
    />
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
          ><button type="button" @click="cancelEdit(note)">{{ text.cancel }}</button>
        </form>
        <p v-else>{{ note.content }}</p>
        <span v-if="converted(note)">{{ convertedLabel }}</span
        ><button
          v-else-if="access.convertNote(facts(note))"
          class="t-btn t-btn--secondary t-btn--sm"
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
            :aria-controls="openMenu === note.note_id ? `note-menu-${note.note_id}` : undefined"
            @click="openMenu === note.note_id ? closeMenu(note.note_id) : (openMenu = note.note_id)"
          >
            ⋯
          </button>
          <div
            v-if="openMenu === note.note_id"
            :id="`note-menu-${note.note_id}`"
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
      class="t-btn t-btn--ghost t-btn--sm"
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
