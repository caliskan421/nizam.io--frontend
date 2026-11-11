<script setup lang="ts">
import { computed } from 'vue'
import './side.css'
import type { MeetingDetail } from '../../model/types'
import { coordinatorDepartmentIds, meetingCapabilities } from '../../model/capabilities'
import { meetingDepartments } from '../../model/list'
import { useDepartments } from '../../pages/detail/use-departments'
import { useScopeStore } from '@/shared/scope/store'
import { useStanding } from '@/shared/scope/standing'
import { useInstanceStore } from '@/shared/instance/store'
import { trMeetings } from '@/shared/i18n/tr/meetings'

const props = defineProps<{ meeting: MeetingDetail }>()
defineEmits<{ edit: []; remove: [] }>()
const text = trMeetings.meetings.side
const scope = useScopeStore()
const instance = useInstanceStore()
const { standing } = useStanding()
const departments = useDepartments()
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
const ordered = computed(() => meetingDepartments(props.meeting, departments.value))
const code = (id: string) => ordered.value.find((d) => d.department_id === id)?.code
const creator = computed(
  () =>
    props.meeting.participants.find((p) => p.account_id === props.meeting.created_by_account_id)
      ?.full_name || text.unknown,
)
const date = computed(() =>
  new Intl.DateTimeFormat('tr-TR', {
    timeZone: instance.profile?.timezone ?? 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(props.meeting.created_at)),
)
const visibility = computed(() =>
  props.meeting.invite_mode === 'person'
    ? text.personVisibility
    : props.meeting.members_included
      ? text.membersVisibility
      : text.coordinatorsVisibility,
)
const role = computed(() => {
  const labels: string[] = []
  if (standing.value?.companyAdmin) labels.push(text.admin)
  const ids = new Set(props.meeting.departments.map((d) => d.department_id))
  for (const id of coordinatorDepartmentIds(standing.value, scope.programId)) {
    if (ids.has(id)) {
      const name =
        code(id) || props.meeting.departments.find((d) => d.department_id === id)?.department_name
      if (name) labels.push(`${name} ${text.coordinator}`)
    }
  }
  if (!labels.length) labels.push(text[props.meeting.viewer_role])
  return labels.join(', ')
})
</script>

<template>
  <aside class="meeting-side">
    <section class="t-card meeting-side__card">
      <header>
        <h2>{{ text.departments }} {{ meeting.departments.length }}</h2>
        <button v-if="access.manageDepartments" type="button" @click="$emit('edit')">
          {{ text.change }}
        </button>
      </header>
      <ul>
        <li v-for="department in ordered" :key="department.department_id">
          <strong v-if="code(department.department_id)">{{
            code(department.department_id)
          }}</strong>
          {{ department.department_name }}
          <small v-if="department.department_id === meeting.owner_department_id">{{
            text.owner
          }}</small>
        </li>
      </ul>
      <p>{{ text.departmentHint }}</p>
    </section>
    <section class="t-card meeting-side__card">
      <h2>{{ text.information }}</h2>
      <dl>
        <dt>{{ text.creator }}</dt>
        <dd>{{ creator }} · {{ text[meeting.created_by_role] }}</dd>
        <dt>{{ text.created }}</dt>
        <dd>{{ date }}</dd>
        <dt>{{ text.visibility }}</dt>
        <dd>{{ visibility }}</dd>
        <dt>{{ text.role }}</dt>
        <dd>{{ role }}</dd>
      </dl>
    </section>
  </aside>
</template>
