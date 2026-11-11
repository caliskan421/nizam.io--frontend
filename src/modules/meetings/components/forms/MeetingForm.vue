<script setup lang="ts">
import './forms.css'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useProgramDepartments } from '@/modules/work/public'
import { reachesOwner } from '@/shared/http/mutation'
import { trMeetings } from '@/shared/i18n/tr/meetings'
import { useInstanceStore } from '@/shared/instance/store'
import { useScopeStore } from '@/shared/scope/store'
import { useStanding } from '@/shared/scope/standing'
import { UiModal } from '@/shared/ui'
import { notifyOutcome } from '@/shared/ui/confirm'
import { useToast } from '@/shared/ui/use-toast'
import { useMeetingCandidates } from '../../api/queries'
import { useCreateMeeting, useUpdateMeeting } from '../../api/meeting-writes'
import { coordinatorDepartmentIds } from '../../model/capabilities'
import type { MeetingDetail } from '../../model/types'
import { useSessionReset } from '../../pages/detail/use-session-reset'
import MeetingPersonSelector from '../people/MeetingPersonSelector.vue'
import { meetingDateParts, meetingTimestamp, meetingWarning } from './meeting-time'
import MeetingDepartments from './MeetingDepartments.vue'

const props = defineProps<{
  meeting: MeetingDetail | null
  initialFocus?: 'date'
  editSection?: 'all' | 'departments'
}>()
const emit = defineEmits<{ close: []; saved: [meetingId: string]; selectPeople: [] }>()
const text = trMeetings.meetings.forms
const scope = useScopeStore()
const instance = useInstanceStore()
const { standing } = useStanding()
const departments = useProgramDepartments()
const create = useCreateMeeting()
const update = useUpdateMeeting()
const toast = useToast()
const open = ref(true)
const selectorOpen = ref(false)
const candidates = useMeetingCandidates(standing, selectorOpen)
const title = ref(props.meeting?.title ?? '')
const timezone = computed(() => instance.profile?.timezone ?? 'Europe/Istanbul')
const initial = props.meeting
  ? meetingDateParts(new Date(props.meeting.meeting_date), timezone.value)
  : { date: '', time: '' }
const date = ref(initial.date)
const time = ref(initial.time)
const dateInput = ref<HTMLInputElement | null>(null)
const mode = ref<'person' | 'coordinatorship'>(props.meeting?.invite_mode ?? 'coordinatorship')
const departmentIds = ref<string[]>(props.meeting?.departments.map((d) => d.department_id) ?? [])
const participantIds = ref<string[]>([])
const members = ref(props.meeting?.members_included ?? false)
const options = computed(() => {
  const allowed = coordinatorDepartmentIds(standing.value, scope.programId)
  return (departments.query.data.value?.departments ?? []).filter(
    (d) => standing.value?.companyAdmin || allowed.includes(d.department_id),
  )
})
const departmentEdit = computed(() => props.editSection === 'departments')
const canEditDepartments = computed(
  () =>
    !!props.meeting &&
    standing.value?.companyAdmin === true &&
    props.meeting.invite_mode === 'coordinatorship',
)
const today = computed(() => meetingDateParts(new Date(), timezone.value).date)
const uncertain = ref(false)
const busy = computed(() => create.isPending.value || update.isPending.value)
const invalidFields = computed(
  () =>
    !title.value.trim() ||
    Array.from(title.value.trim()).length > 255 ||
    !date.value ||
    date.value < today.value ||
    !time.value ||
    !meetingTimestamp(date.value, time.value, timezone.value),
)
const invalidOwner = computed(
  () =>
    !departmentIds.value.length ||
    !options.value.some((d) => d.department_id === departmentIds.value[0]),
)
const invalid = computed(
  () =>
    uncertain.value ||
    !scope.programId ||
    (departmentEdit.value
      ? !canEditDepartments.value || !departmentIds.value.length
      : invalidFields.value || (!props.meeting && invalidOwner.value)),
)
function selectDepartment(id: string) {
  if (mode.value === 'person') departmentIds.value = [id]
  else
    departmentIds.value = departmentIds.value.includes(id)
      ? departmentIds.value.filter((value) => value !== id)
      : [...departmentIds.value, id]
}
watch(mode, () => {
  departmentIds.value = departmentIds.value.slice(0, 1)
})
watch(
  () => scope.snapshot,
  () => emit('close'),
)
useSessionReset(() => emit('close'))
onMounted(async () => {
  if (props.initialFocus === 'date') {
    await nextTick()
    await nextTick()
    dateInput.value?.focus()
  }
})
function selectPeople(ids: string[]) {
  participantIds.value = ids
  selectorOpen.value = false
}
function warn(side: { event_failed: boolean; failed_messages: number }, failed: string[] = []) {
  const message = meetingWarning(side, failed, text)
  if (message) toast.push({ message, tone: 'danger', timeout: 0 })
}
async function submitUpdate(programId: string, meetingId: string, meetingDate: string | null) {
  const result = await update.submit({
    programId,
    id: meetingId,
    body: departmentEdit.value
      ? { department_ids: [...departmentIds.value] }
      : {
          title: title.value.trim(),
          meeting_date: meetingDate,
          ...(mode.value === 'coordinatorship' ? { members_included: members.value } : {}),
        },
  })
  if (!reachesOwner(result)) return
  if (result.kind === 'unknown_outcome') uncertain.value = true
  if (result.kind === 'success') {
    warn(result.data.side_effects)
    emit('saved', meetingId)
  } else notifyOutcome(result)
}
async function submitCreate(programId: string, meetingDate: string) {
  const result = await create.submit({
    programId,
    body: {
      title: title.value.trim(),
      meeting_date: meetingDate,
      invite_mode: mode.value,
      department_ids:
        mode.value === 'person' ? departmentIds.value.slice(0, 1) : [...departmentIds.value],
      participant_ids: [...participantIds.value],
      ...(mode.value === 'coordinatorship' ? { members_included: members.value } : {}),
    },
  })
  if (!reachesOwner(result)) return
  if (result.kind === 'unknown_outcome') uncertain.value = true
  if (result.kind === 'success') {
    warn(result.data.side_effects, result.data.failed_participants ?? [])
    emit('saved', result.data.meeting.meeting_id)
  } else notifyOutcome(result)
}
async function submit() {
  if (invalid.value || busy.value || !scope.programId) return
  const meetingDate = meetingTimestamp(date.value, time.value, timezone.value)
  if (props.meeting) await submitUpdate(scope.programId, props.meeting.meeting_id, meetingDate)
  else if (meetingDate) await submitCreate(scope.programId, meetingDate)
}
</script>
<template>
  <UiModal
    v-model:open="open"
    :title="meeting ? text.edit : text.create"
    :dismissible="!busy"
    @close="emit('close')"
  >
    <form id="meeting-form" class="meeting-form" @submit.prevent="submit">
      <p v-if="uncertain" role="alert">{{ text.uncertain }}</p>
      <template v-if="!departmentEdit">
        <label class="rp-field"
          >{{ text.title }} <span class="rp-count">{{ Array.from(title).length }} / 255</span
          ><input v-model="title" class="t-input" required maxlength="255"
        /></label>
        <label class="rp-field"
          >{{ text.date
          }}<input
            ref="dateInput"
            v-model="date"
            class="t-input"
            type="date"
            :min="today"
            required
          /><span class="t-hint">{{ text.dateHint }}</span></label
        >
        <label class="rp-field"
          >{{ text.time }}<input v-model="time" class="t-input" type="time" required
        /></label>
        <template v-if="!meeting">
          <fieldset class="meeting-form__group">
            <legend>{{ text.mode }}</legend>
            <label
              ><input v-model="mode" type="radio" value="coordinatorship" />{{
                text.coordinatorship
              }}</label
            ><label><input v-model="mode" type="radio" value="person" />{{ text.person }}</label>
          </fieldset>
          <button type="button" class="t-btn t-btn--secondary" @click="selectorOpen = true">
            {{ text.people }} ({{ participantIds.length }})
          </button>
        </template>
        <label v-if="mode === 'coordinatorship'"
          ><input v-model="members" type="checkbox" />{{ text.members }}</label
        >
      </template>
      <MeetingDepartments
        v-if="!meeting || (departmentEdit && canEditDepartments)"
        :options="options"
        :selected="departmentIds"
        :single="mode === 'person'"
        :label="text.department"
        :owner-label="text.owner"
        @toggle="selectDepartment"
        @owner="departmentIds = [$event, ...departmentIds.filter((id) => id !== $event)]"
      />
    </form>
    <template #footer
      ><button class="t-btn t-btn--ghost" type="button" :disabled="busy" @click="emit('close')">
        {{ text.cancel }}</button
      ><button
        class="t-btn t-btn--primary"
        type="submit"
        form="meeting-form"
        :disabled="invalid || busy"
      >
        {{ text.save }}
      </button></template
    >
  </UiModal>
  <MeetingPersonSelector
    v-if="selectorOpen"
    :selected-ids="participantIds"
    :candidates="candidates.data.value ?? { people: [], truncated: false, partial: false }"
    :loading="candidates.isPending.value"
    :error="candidates.isError.value"
    mode="draft"
    :scope-limited="standing?.companyAdmin === false"
    @close="selectorOpen = false"
    @select="selectPeople"
    @retry="candidates.refetch()"
  />
</template>
