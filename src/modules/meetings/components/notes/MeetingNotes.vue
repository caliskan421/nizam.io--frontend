<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
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
const { standing } = useStanding()
const query = useMeetingNotes(() => props.meeting.meeting_id)
const add = useAddMeetingNote()
const remove = useDeleteMeetingNote()
const { confirmWrite } = useConfirm()
const draft = ref('')
const filter = ref<'all' | 'converted' | 'mine'>('all')
const openMenu = ref<string | null>(null)
const buttons = new Map<string, HTMLButtonElement>()
const notes = computed(() => query.data.value?.pages.flatMap((page) => page.items) ?? [])
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
      title: 'Not silinsin mi?',
      body: ['Bu işlem geri alınamaz.'],
      confirmLabel: 'Sil',
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
  <section class="t-card meeting-notes" aria-label="Notlar">
    <h2>
      Notlar <span>{{ notes.length }}</span>
    </h2>
    <div role="group" aria-label="Not filtresi">
      <button type="button" :aria-pressed="filter === 'all'" @click="filter = 'all'">
        Tümü {{ notes.length }}</button
      ><button type="button" :aria-pressed="filter === 'converted'" @click="filter = 'converted'">
        Göreve dönüşen {{ notes.filter(converted).length }}</button
      ><button type="button" :aria-pressed="filter === 'mine'" @click="filter = 'mine'">
        Benim {{ notes.filter(mine).length }}
      </button>
    </div>
    <p v-if="query.hasNextPage.value">Sayaçlar yüklenen notları gösterir.</p>
    <form v-if="access.visible" @submit.prevent="addNote">
      <textarea
        v-model="draft"
        aria-label="Not yaz"
        placeholder="Toplantı notu yaz… Katılan herkes not ekleyebilir."
      />
      <p>Notu daha sonra göreve dönüştürebilirsin · {{ Array.from(draft).length }} / 5000</p>
      <button
        type="submit"
        :disabled="!draft.trim() || Array.from(draft).length > 5000 || add.isPending.value"
      >
        Not ekle
      </button>
    </form>
    <p v-if="query.isPending.value">Notlar yükleniyor…</p>
    <p v-else-if="query.isError.value">
      Notlar yüklenemedi. <button type="button" @click="query.refetch()">Yeniden dene</button>
    </p>
    <article v-for="note in shown" :key="note.note_id" class="meeting-notes__item">
      <strong>{{ note.author_name }}</strong>
      <small
        >{{ note.author_role }} ·
        <time :datetime="note.created_at">{{
          new Date(note.created_at).toLocaleString('tr-TR')
        }}</time
        ><span v-if="note.edit_revision > 1"> · düzenlendi</span></small
      >
      <form v-if="editing?.note_id === note.note_id" @submit.prevent="saveNote">
        <textarea v-model="editDraft" aria-label="Not düzenle" /><button type="submit">
          Kaydet</button
        ><button type="button" @click="editing = null">Vazgeç</button>
      </form>
      <p v-else>{{ note.content }}</p>
      <span v-if="converted(note)">Göreve dönüştü</span
      ><button
        v-else-if="access.convertNote(facts(note))"
        type="button"
        @click="emit('convert', note)"
      >
        Göreve dönüştür
      </button>
      <small v-if="converted(note) && mine(note) && !access.manage"
        >Göreve dönüştüğü için yazarı artık düzenleyemez</small
      >
      <div v-if="access.editNote(facts(note)) || access.deleteNote(facts(note))">
        <button
          :ref="(el) => setButton(note.note_id, el)"
          type="button"
          :aria-label="`Not işlemleri: ${note.author_name}`"
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
            @click="
              editing = note
              editDraft = note.content
              closeMenu(note.note_id)
            "
          >
            Düzenle</button
          ><button
            v-if="access.deleteNote(facts(note))"
            type="button"
            role="menuitem"
            @click="deleteNote(note)"
          >
            Sil
          </button>
        </div>
      </div>
    </article>
    <button
      v-if="query.hasNextPage.value"
      type="button"
      :disabled="query.isFetchingNextPage.value"
      @click="query.fetchNextPage()"
    >
      Daha fazla not göster
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
<style scoped>
.meeting-notes {
  padding: var(--space-5);
}
.meeting-notes__item {
  padding-block: var(--space-3);
  border-bottom: var(--border-width) solid var(--border);
}
</style>
