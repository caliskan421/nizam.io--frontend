<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useSessionReset } from '../../pages/detail/use-session-reset'
import { pushAppNotice } from '@/shared/ui/use-toast'
import { useMeetingCandidates } from '../../api/queries'
import { useAddMeetingParticipant, useRemoveMeetingParticipant } from '../../api/detail-writes'
import { meetingCapabilities } from '../../model/capabilities'
import type { MeetingDetail } from '../../model/types'
import { useScopeStore } from '@/shared/scope/store'
import { useStanding } from '@/shared/scope/standing'
import { reachesOwner, runWithFollowUps, useActionContext } from '@/shared/http/mutation'
import { notifyOutcome } from '@/shared/ui/confirm'
import { trMeetings } from '@/shared/i18n/tr/meetings'
import { UiAvatar } from '@/shared/ui'
import MeetingPersonSelector from './MeetingPersonSelector.vue'
import './people.css'
const props = defineProps<{ meeting: MeetingDetail }>()
const emit = defineEmits<{ add: []; refresh: [] }>()
const text = trMeetings.meetings.people
const roles = trMeetings.meetings.notes.roles
const scope = useScopeStore()
const { standing } = useStanding()
const opened = ref(false)
const trigger = ref<HTMLButtonElement | null>(null)
const section = ref<HTMLElement | null>(null)
const failed = ref<string[]>([])
const uncertain = ref(false)
const busy = ref(false)
let version = 0
const add = useAddMeetingParticipant()
const remove = useRemoveMeetingParticipant()
const capture = useActionContext()
const query = useMeetingCandidates(standing, opened)
const locked = computed(() => props.meeting.participants.map((p) => p.account_id))
const candidates = computed(() => {
  const data = query.data.value ?? { people: [], partial: false, truncated: false }
  const people = [...data.people]
  for (const participant of props.meeting.participants)
    if (!people.some((p) => p.accountId === participant.account_id))
      people.push({ accountId: participant.account_id, fullName: participant.full_name })
  return { ...data, people }
})
const access = computed(() =>
  meetingCapabilities(standing.value, scope.programId ?? '', {
    inviteMode: props.meeting.invite_mode,
    ownerDepartmentId: props.meeting.owner_department_id,
    departmentIds: props.meeting.departments.map((d) => d.department_id),
    createdByAccountId: props.meeting.created_by_account_id,
    membersIncluded: props.meeting.members_included,
    participant: locked.value.includes(standing.value?.accountId ?? ''),
    viewerRole: props.meeting.viewer_role,
  }),
)
function openSelector() {
  opened.value = true
  emit('add')
}
function close() {
  opened.value = false
  void nextTick(() => trigger.value?.focus())
}
function reset() {
  version += 1
  opened.value = false
  failed.value = []
  uncertain.value = false
  busy.value = false
}
watch(() => [scope.programId, scope.departmentId, scope.lens, props.meeting.meeting_id], reset, {
  flush: 'sync',
})
useSessionReset(reset)
async function select(ids: string[]) {
  const programId = scope.programId
  if (!programId || busy.value || !ids.length) return
  const context = capture()
  const started = version
  const target = { programId, id: props.meeting.meeting_id }
  const names = new Map(candidates.value.people.map((p) => [p.accountId, p.fullName]))
  const failures: string[] = []
  let success = false
  busy.value = true
  close()
  const pending = ids.filter((id) => !locked.value.includes(id))
  let stopped = false
  let detached = false
  async function send(id: string, actionContext = context) {
    const outcome = await add.submit({ ...target, userId: id }, { context: actionContext })
    if (!reachesOwner(outcome) || started !== version) {
      detached = true
      stopped = true
      if (success || outcome.kind === 'success')
        pushAppNotice({ message: text.partialNotice }, context.generation)
    } else if (outcome.kind === 'success') success = true
    else if (
      outcome.kind === 'failed' &&
      outcome.error.code === 'collaboration.participant_invalid'
    )
      failures.push(names.get(id) ?? id)
    else {
      stopped = true
      uncertain.value = outcome.kind === 'unknown_outcome'
      notifyOutcome(outcome)
    }
    return outcome
  }
  async function runBatch() {
    while (pending.length && !stopped) {
      const first = pending.shift()!
      const outcome = await send(first)
      if (outcome.kind !== 'success' || stopped) continue
      let previous = outcome as Awaited<ReturnType<typeof add.submit>>
      await runWithFollowUps(
        () => Promise.resolve(outcome),
        (_data, actionContext) =>
          pending.splice(0).map((id) => ({
            name: id,
            run: async () => {
              if (!stopped) previous = await send(id, actionContext ?? context)
              return previous
            },
          })),
      )
    }
  }
  await runBatch()
  if (detached) return
  failed.value = failures
  busy.value = false
  if (success || uncertain.value) emit('refresh')
}
async function removePerson(id: string) {
  if (!scope.programId || busy.value) return
  const started = version
  busy.value = true
  const outcome = await remove.submit({
    programId: scope.programId,
    id: props.meeting.meeting_id,
    userId: id,
  })
  if (!reachesOwner(outcome) || started !== version) return
  busy.value = false
  if (outcome.kind === 'success') {
    emit('refresh')
    void nextTick(() => section.value?.querySelector<HTMLElement>('h2')?.focus())
  } else notifyOutcome(outcome)
}
</script>
<template>
  <section ref="section" class="t-card meeting-people">
    <header>
      <h2 tabindex="-1">{{ text.title }} {{ meeting.participants.length }}</h2>
      <button
        v-if="access.manageParticipants"
        ref="trigger"
        type="button"
        :disabled="busy"
        @click="openSelector"
      >
        {{ text.add }}
      </button>
    </header>
    <div v-if="failed.length" role="status">
      <strong>{{ failed.length }} {{ text.failed }}</strong>
      <p v-for="name in failed" :key="name">{{ name }}: {{ text.reason }}</p>
      <button type="button" @click="failed = []">{{ text.dismiss }}</button>
    </div>
    <p v-if="uncertain" role="status">{{ text.uncertain }}</p>
    <div v-for="person in meeting.participants" :key="person.account_id" class="meeting-person-row">
      <UiAvatar :name="person.full_name" size="sm" /><span>{{ person.full_name }}</span
      ><small>{{
        person.teams.map((team) => `${team.department_name} · ${roles[team.role]}`).join(', ')
      }}</small
      ><button
        v-if="access.manageParticipants"
        type="button"
        :aria-label="`${person.full_name}: ${text.remove}`"
        :disabled="busy"
        @click="removePerson(person.account_id)"
      >
        ×
      </button>
    </div>
    <p>{{ text.hint }}</p>
    <MeetingPersonSelector
      v-if="opened"
      :selected-ids="[]"
      :locked-ids="locked"
      :candidates="candidates"
      :scope-limited="!standing?.companyAdmin"
      :loading="query.isPending.value"
      :error="query.isError.value"
      mode="add"
      @close="close"
      @select="select"
      @retry="query.refetch()"
    />
  </section>
</template>
