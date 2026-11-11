<script setup lang="ts">
import './convert.css'
import { computed, onScopeDispose, ref, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useProgramDepartments } from '@/modules/work/public'
import { trMeetings } from '@/shared/i18n/tr/meetings'
import { authSession } from '@/shared/http'
import { ownerLife, reachesOwner } from '@/shared/http/mutation'
import { useInstanceStore } from '@/shared/instance/store'
import { queryKeys } from '@/shared/http/query-keys'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiModal } from '@/shared/ui'
import { notifyOutcome } from '@/shared/ui/confirm'
import { useMeeting } from '../../api/queries'
import { useConvertNoteToTask } from '../../api/note-writes'
import { coordinatorDepartmentIds, meetingCapabilities } from '../../model/capabilities'
import type { MeetingNote } from '../../model/types'

const text = trMeetings.meetings.convert
const props = defineProps<{ note: MeetingNote }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const scope = useScopeStore()
const instance = useInstanceStore()
const client = useQueryClient()
const owner = ownerLife()
const { standing } = useStanding()
const meeting = useMeeting(() => props.note.meeting_id)
const departments = useProgramDepartments()
const convert = useConvertNoteToTask()
const open = ref(true)
const title = ref(Array.from(props.note.content).slice(0, 100).join(''))
const department = ref('')
const start = ref('')
const end = ref('')
const options = computed(() => {
  const detail = meeting.data.value
  if (!detail || !standing.value) return []
  const facts = {
    inviteMode: detail.invite_mode,
    ownerDepartmentId: detail.owner_department_id,
    departmentIds: detail.departments.map((d) => d.department_id),
    createdByAccountId: detail.created_by_account_id,
    membersIncluded: detail.members_included,
    participant: detail.participants.some((p) => p.account_id === standing.value?.accountId),
    viewerRole: detail.viewer_role,
  }
  const access = meetingCapabilities(standing.value, detail.program_id, facts)
  if (
    !access.convertNote({
      authorAccountId: props.note.author_account_id,
      authorRole: props.note.author_role,
      converted: !!props.note.converted_to_work_item_id,
    })
  )
    return []
  const allowed = new Set(coordinatorDepartmentIds(standing.value, detail.program_id))
  return (departments.query.data.value?.departments ?? []).filter(
    (d) =>
      standing.value?.companyAdmin ||
      (allowed.has(d.department_id) && facts.departmentIds.includes(d.department_id)),
  )
})
const today = computed(() => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: instance.profile?.timezone ?? 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
})
const invalid = computed(
  () =>
    !department.value ||
    !options.value.some((d) => d.department_id === department.value) ||
    !start.value ||
    !end.value ||
    end.value < start.value ||
    start.value < today.value ||
    Array.from(title.value).length > 255,
)
const initialGeneration = authSession.generation
const unsubscribe = authSession.subscribe(() => {
  if (authSession.generation !== initialGeneration) emit('close')
})
onScopeDispose(unsubscribe)
watch(
  () => scope.programId,
  () => emit('close'),
)
watch(
  () => standing.value,
  (current, previous) => {
    if (
      previous &&
      (!current ||
        current.accountId !== previous.accountId ||
        JSON.stringify(current.rows) !== JSON.stringify(previous.rows) ||
        current.companyAdmin !== previous.companyAdmin)
    )
      emit('close')
  },
)
function sameOwner(generation: number, programId: string | null, accountId: string | undefined) {
  return (
    owner.alive() &&
    generation === authSession.generation &&
    programId === scope.programId &&
    accountId === standing.value?.accountId
  )
}
async function submit() {
  if (invalid.value || convert.isPending.value) return
  const generation = authSession.generation
  const programId = scope.programId
  const accountId = standing.value?.accountId
  const result = await convert.submit({
    programId: scope.programId!,
    id: props.note.meeting_id,
    noteId: props.note.note_id,
    body: {
      department_id: department.value,
      ...(title.value.trim() ? { title: title.value } : {}),
      start_date: start.value,
      end_date: end.value,
    },
  })
  if (!reachesOwner(result)) return
  if (result.kind === 'success') {
    emit('saved')
    return
  }
  notifyOutcome(result)
  if (result.kind === 'failed' && result.error.code === 'collaboration.note_converted') {
    await client.invalidateQueries({
      queryKey: queryKeys.meetings.noteList(scope.snapshot, props.note.meeting_id),
    })
    if (sameOwner(generation, programId, accountId)) emit('close')
  }
}
</script>

<template>
  <UiModal
    v-model:open="open"
    :title="text.title"
    :description="`${meeting.data.value?.title ?? ''} · ${note.author_name}`"
    @close="emit('close')"
  >
    <blockquote class="meeting-convert__quote">{{ note.content }}</blockquote>
    <form id="meeting-convert-form" class="meeting-convert__form" @submit.prevent="submit">
      <label>{{ text.taskTitle }} <input v-model="title" /></label>
      <p>{{ Array.from(title).length }} / 255 · {{ text.titleHint }}</p>
      <label
        >{{ text.department }}
        <select v-model="department" required>
          <option value="" disabled>{{ text.select }}</option>
          <option v-for="item in options" :key="item.department_id" :value="item.department_id">
            {{ item.display_name }}
          </option>
        </select>
      </label>
      <label>{{ text.start }} <input v-model="start" type="date" required /></label>
      <label
        >{{ text.end }} <input v-model="end" type="date" required :aria-invalid="!!end && invalid"
      /></label>
      <p v-if="end && invalid">{{ text.invalid }}</p>
      <p>{{ text.info }}</p>
    </form>
    <template #footer
      ><UiButton variant="ghost" @click="emit('close')">{{ text.cancel }}</UiButton
      ><UiButton variant="primary" :disabled="invalid || convert.isPending.value" @click="submit">{{
        text.submit
      }}</UiButton></template
    >
  </UiModal>
</template>
