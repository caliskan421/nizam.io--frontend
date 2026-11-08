<script setup lang="ts">
import './notes.css'

import { computed, ref, shallowRef, watch } from 'vue'

import { toApiError } from '@/shared/errors/api-error'
import type { MutationOutcome } from '@/shared/http/mutation'
import { useInstanceStore } from '@/shared/instance/store'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiEmptyState, UiErrorState } from '@/shared/ui'
import { ConflictDialog } from '@/shared/ui/conflict'

import { useWorkItemNotes } from '../../api'
import { canEditOwnNote, canWriteNote, isSelf, workActorFacts } from '../../model/capabilities'
import { targetOf } from '../../model/target'
import type { WorkItemNote } from '../../model/types'
import type { NotesTabProps } from '../index'
import { notesText } from './messages'
import NoteComposer from './NoteComposer.vue'
import NoteItem from './NoteItem.vue'
import {
  noticeContent,
  settle,
  useNoteActions,
  type SettleResult,
  type UnknownNotice,
} from './use-note-actions'

/**
 * W47 · E-03-62 — panel "Notlar" sekmesi: not listesi (`listWorkItemNotes`, sayfasız, görevin
 * kendi kapsamı), yazma alanı (s.144: koordinatör ∨ atanmış üye; şirket yöneticisi HER
 * durumda gizli), kendi notunu düzenle/sil (s.145). Görünürlük yalnız `capabilities.ts`
 * olgularından (mercek değil, P1); gizleme güvenlik değildir — 403 `work.not_assigned` /
 * `work.not_authorized` gerçek sonuçtur ve metni hata kodundan (i18n) gelir.
 */
const props = defineProps<NotesTabProps>()

const scope = useScopeStore()
const instance = useInstanceStore()
const { standing } = useStanding()

const target = computed(() => targetOf(props.item))
const notesQuery = useWorkItemNotes(() => props.item.work_item_id, target)
const refetch = () => notesQuery.refetch()
const actions = useNoteActions(() => props.item, refetch)

const facts = computed(() => workActorFacts(standing.value, scope.snapshot.programId, props.item))
const canWrite = computed(() => canWriteNote(facts.value))
const canEdit = (note: WorkItemNote) =>
  canEditOwnNote({ ...facts.value, author: isSelf(standing.value, note.author_account_id) })

const notes = computed(() => notesQuery.data.value?.notes ?? [])
const loadError = computed(() =>
  notesQuery.data.value === undefined && notesQuery.error.value
    ? toApiError(notesQuery.error.value)
    : null,
)
const timeZone = computed(() => instance.profile?.timezone ?? null)

const draft = ref('')
const notice = shallowRef<UnknownNotice | null>(null)

// Başka görev açılınca taslak ve yerinde bildirim o göreve taşınmaz.
watch(
  () => props.item.work_item_id,
  () => {
    draft.value = ''
    notice.value = null
  },
)

function apply(result: SettleResult): void {
  notice.value = result.notice
  if (result.done) draft.value = ''
}

async function addNote(content: string): Promise<void> {
  apply(await actions.addNote(content))
}

async function resolved(outcome: MutationOutcome<unknown, unknown, unknown>): Promise<void> {
  apply(await settle(outcome, refetch))
}
</script>

<template>
  <section class="wk-notes" data-testid="notes-tab">
    <NoteComposer
      v-if="canWrite"
      v-model="draft"
      :label="notesText('composer')"
      :placeholder="notesText('placeholder')"
      :submit-label="notesText('add')"
      :busy="actions.adding.value"
      :notice="notice"
      :notice-draft="noticeContent(notice)"
      @submit="addNote"
      @resolved="resolved"
    />
    <UiErrorState
      v-if="loadError"
      :error="loadError"
      retryable
      :retrying="notesQuery.isFetching.value"
      @retry="refetch"
    />
    <p v-else-if="notesQuery.isPending.value" class="wk-notes__status" aria-busy="true">
      {{ notesText('loading') }}
    </p>
    <UiEmptyState
      v-else-if="notes.length === 0"
      icon="document"
      :title="notesText('empty')"
      :text="canWrite ? notesText('emptyWriter') : undefined"
    />
    <ol v-else class="wk-notes__list" :aria-label="notesText('list')">
      <NoteItem
        v-for="note in notes"
        :key="note.note_id"
        :note="note"
        :can-edit="canEdit(note)"
        :time-zone="timeZone"
        :busy="actions.saving.value || actions.removing.value"
        :save="actions.saveNote"
        :remove="actions.deleteNote"
        :refetch="refetch"
      />
    </ol>
    <ConflictDialog
      v-model:open="actions.conflict.open.value"
      :fields="actions.conflict.fields.value"
      :busy="actions.saving.value"
      @resolve="actions.conflict.choose"
      @cancel="actions.conflict.dismiss"
    />
  </section>
</template>
