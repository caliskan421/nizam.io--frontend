<script setup lang="ts">
import './notes.css'

import { computed, ref, shallowRef, watch } from 'vue'

import type { MutationOutcome } from '@/shared/http/mutation'
import { UiAvatar, UiButton } from '@/shared/ui'

import type { NoteMetadata, WorkItemNote } from '../../model/types'
import { formatNoteTime, noteFlagLabel, notesText } from './messages'
import NoteComposer from './NoteComposer.vue'
import { noticeContent, settle, type SettleResult, type UnknownNotice } from './use-note-actions'

/**
 * Tek not satırı (tasarım `rp-note`: avatar, yazar, zaman, "düzenlendi", gövde, alt satır).
 * Düzenle/Sil yalnız `canEdit` iken (s.145, yazar + ekip satırı; çağıran `capabilities.ts`'ten
 * hesaplar); yetkisizde GİZLİ. Düzenleme yerinde: taban, düzenleyicinin açıldığı nottur.
 */
const props = defineProps<{
  note: WorkItemNote
  canEdit: boolean
  timeZone: string | null
  busy: boolean
  save: (base: WorkItemNote, content: string, metadata: NoteMetadata) => Promise<SettleResult>
  remove: (note: WorkItemNote) => Promise<boolean>
  refetch: () => Promise<unknown>
}>()

const editing = shallowRef<WorkItemNote | null>(null)
const draft = ref('')
const flag = ref<WorkItemNote['flag']>(null)
const shared = ref(false)
const notice = shallowRef<UnknownNotice | null>(null)

const author = computed(() => props.note.author_full_name ?? notesText('unknownAuthor'))
const time = computed(() => formatNoteTime(props.note.created_at, props.timeZone))
const edited = computed(() => props.note.updated_at !== props.note.created_at)

function startEdit(): void {
  editing.value = props.note
  draft.value = props.note.content
  flag.value = props.note.flag
  shared.value = props.note.shared
  notice.value = null
}

function close(): void {
  editing.value = null
  notice.value = null
}

watch(
  () => props.canEdit,
  (allowed) => {
    if (!allowed) close()
  },
)

function apply(result: SettleResult): void {
  if (result.done) close()
  else notice.value = result.notice
}

async function submit(content: string): Promise<void> {
  const base = editing.value
  if (!base) return
  const result = await props.save(base, content, { flag: flag.value, shared: shared.value })
  if (editing.value === base) apply(result)
}

async function resolved(outcome: MutationOutcome<unknown, unknown, unknown>): Promise<void> {
  apply(await settle(outcome, props.refetch))
}
</script>

<template>
  <li class="wk-note" data-testid="note">
    <UiAvatar :name="author" />
    <div class="wk-note__main">
      <div class="wk-note__head">
        <strong class="wk-note__author">{{ author }}</strong>
        <time class="wk-note__cap" :datetime="note.created_at">{{ time }}</time>
        <span v-if="note.flag" class="wk-note__cap">{{ noteFlagLabel(note.flag) }}</span>
        <span v-if="note.shared" class="wk-note__cap">{{ notesText('shared') }}</span>
        <span v-if="edited" class="wk-note__cap">· {{ notesText('edited') }}</span>
      </div>
      <NoteComposer
        v-if="canEdit && editing"
        v-model="draft"
        v-model:flag="flag"
        v-model:shared="shared"
        :label="notesText('editor')"
        :submit-label="notesText('save')"
        :busy="busy"
        :notice="notice"
        :notice-draft="noticeContent(notice)"
        cancelable
        @submit="submit"
        @cancel="close"
        @resolved="resolved"
      />
      <template v-else>
        <p class="wk-note__body" data-testid="note-body">{{ note.content }}</p>
        <slot name="memory" />
        <div v-if="canEdit" class="wk-note__foot">
          <UiButton variant="ghost" size="sm" data-testid="note-edit" @click="startEdit">
            {{ notesText('edit') }}
          </UiButton>
          <UiButton
            variant="ghost"
            size="sm"
            icon="trash"
            data-testid="note-delete"
            :disabled="busy"
            @click="remove(note)"
          >
            {{ notesText('remove') }}
          </UiButton>
        </div>
      </template>
    </div>
  </li>
</template>
