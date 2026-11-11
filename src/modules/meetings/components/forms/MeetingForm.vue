<script setup lang="ts">
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

const props = defineProps<{ meeting: MeetingDetail | null; initialFocus?: 'date' }>()
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
function dateParts(value: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone.value,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value)
  const get = (key: string) => parts.find((part) => part.type === key)?.value ?? ''
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  }
}
const initial = props.meeting
  ? dateParts(new Date(props.meeting.meeting_date))
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
const today = computed(() => dateParts(new Date()).date)
const uncertain = ref(false)
const busy = computed(() => create.isPending.value || update.isPending.value)
const invalid = computed(
  () =>
    uncertain.value ||
    !scope.programId ||
    !title.value.trim() ||
    Array.from(title.value.trim()).length > 255 ||
    !date.value ||
    date.value < today.value ||
    !time.value ||
    (!props.meeting &&
      (!departmentIds.value.length ||
        !options.value.some((d) => d.department_id === departmentIds.value[0]))),
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
  () => scope.programId,
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
  if (failed.length || side.event_failed || side.failed_messages)
    toast.push({
      message: text.partial
        .replace('{people}', failed.join(', ') || '0')
        .replace('{messages}', String(side.failed_messages))
        .replace('{event}', side.event_failed ? text.eventFailed : text.eventOk),
      tone: 'danger',
      timeout: 0,
    })
}
async function submit() {
  if (invalid.value || busy.value || !scope.programId) return
  const meetingDate = `${date.value}T${time.value}:00`
  if (props.meeting) {
    const result = await update.submit({
      programId: scope.programId,
      id: props.meeting.meeting_id,
      body: {
        title: title.value.trim(),
        meeting_date: meetingDate,
        ...(mode.value === 'coordinatorship' ? { members_included: members.value } : {}),
      },
    })
    if (!reachesOwner(result)) return
    if (result.kind === 'unknown_outcome') uncertain.value = true
    if (result.kind === 'success') {
      warn(result.data.side_effects)
      emit('saved', props.meeting.meeting_id)
    } else notifyOutcome(result)
  } else {
    const result = await create.submit({
      programId: scope.programId,
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
}
</script>
<template>
  <UiModal
    v-model:open="open"
    :title="meeting ? text.edit : text.create"
    :dismissible="!busy"
    @close="emit('close')"
  >
    <form id="meeting-form" @submit.prevent="submit">
      <p v-if="uncertain" role="alert">{{ text.uncertain }}</p>
      <label>{{ text.title }}<input v-model="title" required maxlength="255" /></label>
      <label
        >{{ text.date }}<input ref="dateInput" v-model="date" type="date" :min="today" required
      /></label>
      <label>{{ text.time }}<input v-model="time" type="time" required /></label>
      <template v-if="!meeting">
        <fieldset>
          <legend>{{ text.mode }}</legend>
          <label
            ><input v-model="mode" type="radio" value="coordinatorship" />{{
              text.coordinatorship
            }}</label
          ><label><input v-model="mode" type="radio" value="person" />{{ text.person }}</label>
        </fieldset>
        <fieldset>
          <legend>{{ text.department }}</legend>
          <label v-for="department in options" :key="department.department_id"
            ><input
              :type="mode === 'person' ? 'radio' : 'checkbox'"
              :checked="departmentIds.includes(department.department_id)"
              @change="selectDepartment(department.department_id)"
            />{{ department.display_name }}</label
          >
        </fieldset>
        <button type="button" @click="selectorOpen = true">
          {{ text.people }} ({{ participantIds.length }})
        </button>
      </template>
      <label v-if="mode === 'coordinatorship'"
        ><input v-model="members" type="checkbox" />{{ text.members }}</label
      >
    </form>
    <template #footer
      ><button type="button" :disabled="busy" @click="emit('close')">{{ text.cancel }}</button
      ><button type="submit" form="meeting-form" :disabled="invalid || busy">
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
