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
import { useNow } from '../../pages/meetings/use-now'
import MeetingPersonSelector from '../people/MeetingPersonSelector.vue'
import { meetingDateParts, meetingTimestamp, meetingWarning } from './meeting-time'
import MeetingDepartments from './MeetingDepartments.vue'
import MeetingInviteMode from './MeetingInviteMode.vue'
import { departmentOrder } from './department-order'
import { meetingChanges } from './form-diff'

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
const selectorOpen = ref(false)
const candidates = useMeetingCandidates(standing, selectorOpen)
const title = ref(props.meeting?.title ?? '')
const timezone = computed(() => instance.profile?.timezone ?? 'Europe/Istanbul'),
  clock = useNow()
const initial = props.meeting
  ? meetingDateParts(new Date(props.meeting.meeting_date), timezone.value)
  : { date: '', time: '' }
const date = ref(initial.date),
  time = ref(initial.time)
const dateInput = ref<HTMLInputElement | null>(null)
const mode = ref<'person' | 'coordinatorship'>(props.meeting?.invite_mode ?? 'coordinatorship')
const departmentIds = ref<string[]>(departmentOrder(props.meeting))
const participantIds = ref<string[]>([])
const members = ref(props.meeting?.members_included ?? false)
const options = computed(() => departments.query.data.value?.departments ?? [])
const allowedOwners = computed(() => coordinatorDepartmentIds(standing.value, scope.programId))
const dateChanged = computed(
  () => !props.meeting || date.value !== initial.date || time.value !== initial.time,
)
const departmentEdit = computed(() => props.editSection === 'departments')
const canEditDepartments = computed(
  () => standing.value?.companyAdmin === true && props.meeting?.invite_mode === 'coordinatorship',
)
const today = computed(() => meetingDateParts(clock.value, timezone.value).date)
const uncertain = ref(false)
const busy = computed(() => create.isPending.value || update.isPending.value)
const invalidDate = computed(
  () =>
    dateChanged.value &&
    (!date.value ||
      date.value < today.value ||
      !time.value ||
      !meetingTimestamp(date.value, time.value, timezone.value)),
)
const invalidFields = computed(
  () => !title.value.trim() || Array.from(title.value.trim()).length > 255 || invalidDate.value,
)
const invalidOwner = computed(
  () =>
    !departmentIds.value.length ||
    !options.value.some((d) => d.department_id === departmentIds.value[0]) ||
    (standing.value?.companyAdmin !== true &&
      !allowedOwners.value.includes(departmentIds.value[0] ?? '')),
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
watch(mode, () => departmentIds.value.splice(1))
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
      : meetingChanges(props.meeting!, {
          title: title.value.trim(),
          meetingDate,
          dateChanged: dateChanged.value,
          members: members.value,
        }),
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
  if (dateChanged.value && date.value < meetingDateParts(new Date(), timezone.value).date) return
  const meetingDate = meetingTimestamp(date.value, time.value, timezone.value)
  if (props.meeting) await submitUpdate(scope.programId, props.meeting.meeting_id, meetingDate)
  else if (meetingDate) await submitCreate(scope.programId, meetingDate)
}
</script>
<template>
  <UiModal
    :open="true"
    :title="meeting ? text.edit : text.create"
    :dismissible="!busy"
    @close="emit('close')"
  >
    <form id="meeting-form" class="meeting-form" @submit.prevent="submit">
      <p v-if="uncertain" role="alert">{{ text.uncertain }}</p>
      <template v-if="!departmentEdit">
        <label class="rp-field meeting-form__title"
          >{{ text.title }} <span class="rp-count">{{ Array.from(title).length }} / 255</span
          ><input v-model="title" class="t-input" required
        /></label>
        <label class="rp-field meeting-form__date"
          >{{ text.date
          }}<input
            ref="dateInput"
            v-model="date"
            class="t-input"
            type="date"
            :min="dateChanged ? today : undefined"
            required
          /><span class="t-hint">{{ text.dateHint }}</span></label
        >
        <label class="rp-field meeting-form__time"
          >{{ text.time }}<input v-model="time" class="t-input" type="time" required
        /></label>
      </template>
      <MeetingInviteMode v-if="!meeting" v-model="mode" />
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
      <button
        v-if="!meeting"
        type="button"
        class="t-btn t-btn--secondary meeting-form__people"
        @click="selectorOpen = true"
      >
        {{ text.people }} ({{ participantIds.length }})
      </button>
      <label v-if="!departmentEdit && mode === 'coordinatorship'" class="meeting-form__members"
        ><input v-model="members" class="t-check" type="checkbox" /><span
          ><strong>{{ text.members }}</strong
          ><small>{{ text.membersHint }}</small></span
        ></label
      >
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
        {{ meeting ? text.save : text.createAction }}
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
