<script setup lang="ts">
import { computed, nextTick, onScopeDispose, ref, watch } from 'vue'
import './detail/detail.css'
import { useRoute, useRouter } from 'vue-router'
import { useMeeting } from '../api/queries'
import { listQuery } from './detail/list-query'
import { useDepartments } from './detail/use-departments'
import { useDeleteMeeting } from '../api/meeting-writes'
import { meetingCapabilities } from '../model/capabilities'
import { meetingDay, meetingDepartments } from '../model/list'
import type { MeetingNote } from '../model/types'
import MeetingAgenda from '../components/agenda/MeetingAgenda.vue'
import MeetingNotes from '../components/notes/MeetingNotes.vue'
import MeetingPeople from '../components/people/MeetingPeople.vue'
import MeetingSide from '../components/side/MeetingSide.vue'
import MeetingForm from '../components/forms/MeetingForm.vue'
import MeetingConvert from '../components/convert/MeetingConvert.vue'
import { authSession } from '@/shared/http'
import { reachesOwner } from '@/shared/http/mutation'
import { trMeetings } from '@/shared/i18n/tr/meetings'
import { useInstanceStore } from '@/shared/instance/store'
import { usePageCrumb } from '@/shared/navigation/page-crumb'
import { useScopeStore } from '@/shared/scope/store'
import { useStanding } from '@/shared/scope/standing'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'

const text = trMeetings.meetings.detail
const route = useRoute()
const router = useRouter()
const scope = useScopeStore()
const instance = useInstanceStore()
const { standing } = useStanding()
const id = computed(() =>
  typeof route.params.meetingId === 'string' ? route.params.meetingId : null,
)
const query = useMeeting(id)
const meeting = computed(() => query.data.value)
const departments = useDepartments()
const displayDepartments = computed(() =>
  meeting.value ? meetingDepartments(meeting.value, departments.value) : [],
)
usePageCrumb(() => meeting.value?.title ?? null)
const remove = useDeleteMeeting()
const { confirmWrite } = useConfirm()
const formOpen = ref(false)
const selectedNote = ref<MeetingNote | null>(null)
const menuOpen = ref(false)
const personSelectorUnavailable = ref(false)
const menuButton = ref<HTMLButtonElement | null>(null)
const noteOpener = ref<HTMLElement | null>(null)
const formOpener = ref<HTMLElement | null>(null)
const page = ref<HTMLElement | null>(null)
const timezone = computed(() => instance.profile?.timezone ?? 'Europe/Istanbul')
const canManage = computed(() => {
  const m = meeting.value
  if (!m) return false
  return meetingCapabilities(standing.value, scope.programId ?? '', {
    inviteMode: m.invite_mode,
    ownerDepartmentId: m.owner_department_id,
    departmentIds: m.departments.map((d) => d.department_id),
    createdByAccountId: m.created_by_account_id,
    membersIncluded: m.members_included,
    participant: m.participants.some((p) => p.account_id === standing.value?.accountId),
    viewerRole: m.viewer_role,
  }).manage
})
const dateLabel = computed(() => {
  if (!meeting.value) return ''
  const date = new Date(meeting.value.meeting_date)
  const day = meetingDay(date, timezone.value)
  const today = meetingDay(new Date(), timezone.value)
  const tomorrowDate = new Date(Date.now() + 86400000)
  const relative =
    day === today
      ? `${text.today} · `
      : day === meetingDay(tomorrowDate, timezone.value)
        ? `${text.tomorrow} · `
        : ''
  return (
    relative +
    new Intl.DateTimeFormat('tr-TR', {
      timeZone: timezone.value,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  )
})
function openForm() {
  formOpener.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
  formOpen.value = true
}
function openFormFromMenu() {
  menuOpen.value = false
  formOpener.value = menuButton.value
  formOpen.value = true
}
function closeForm() {
  formOpen.value = false
  void nextTick(() => (formOpener.value?.isConnected ? formOpener.value : page.value)?.focus())
}
function formSaved() {
  closeForm()
  refresh()
}
function convertSaved() {
  closeConvert()
  refresh()
}
function refresh() {
  void query.refetch()
}
function closeMenu() {
  menuOpen.value = false
  void nextTick(() => menuButton.value?.focus())
}
function openConvert(note: MeetingNote) {
  noteOpener.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
  selectedNote.value = note
}
function closeConvert() {
  selectedNote.value = null
  void nextTick(() => {
    const fallback =
      page.value?.querySelector<HTMLElement>('[data-testid="meeting-notes-title"]') ?? page.value
    ;(noteOpener.value?.isConnected ? noteOpener.value : fallback)?.focus()
  })
}
function closeDialogs() {
  formOpen.value = false
  selectedNote.value = null
  menuOpen.value = false
  personSelectorUnavailable.value = false
}
watch(() => [scope.programId, id.value], closeDialogs)
const offSession = authSession.subscribe(closeDialogs)
onScopeDispose(offSession)
async function deleteMeeting() {
  closeMenu()
  const m = meeting.value
  if (!m || !scope.programId || remove.isPending.value) return
  const outcome = await confirmWrite(
    {
      title: text.deleteTitle,
      description: m.title,
      body: [text.deleteBody],
      confirmLabel: text.delete,
      tone: 'danger',
    },
    (context) => remove.submit({ programId: m.program_id, id: m.meeting_id }, { context }),
  )
  if (!outcome || !reachesOwner(outcome)) return
  if (
    outcome.kind === 'success' ||
    (outcome.kind === 'failed' && outcome.error.code === 'collaboration.meeting_not_found')
  )
    void router.push({ name: 'collaboration.meetings', query: listQuery(route.query) })
  else notifyOutcome(outcome)
}
</script>

<template>
  <main ref="page" class="meeting-detail" tabindex="-1">
    <p v-if="query.isPending.value">{{ text.loading }}</p>
    <div v-else-if="query.isError.value">
      <p>{{ text.loadError }}</p>
      <button type="button" @click="refresh">{{ text.retry }}</button>
    </div>
    <template v-else-if="meeting">
      <header class="meeting-detail__header">
        <div>
          <p class="rp-kicker">{{ dateLabel }}</p>
          <h1 class="rp-h1">{{ meeting.title }}</h1>
          <div class="meeting-detail__departments">
            <span
              v-for="department in displayDepartments"
              :key="department.department_id"
              :title="
                department.department_id === meeting.owner_department_id ? text.owner : undefined
              "
              >{{ department.code }}</span
            ><span>{{ meeting.departments.length }} {{ text.invited }}</span
            ><span v-if="meeting.members_included" :title="text.membersTitle">{{
              text.members
            }}</span>
          </div>
        </div>
        <div v-if="canManage">
          <button type="button" class="t-btn t-btn--secondary" @click="openForm">
            {{ text.edit }}</button
          ><button
            ref="menuButton"
            type="button"
            :aria-label="text.other"
            :aria-expanded="menuOpen"
            @click="menuOpen ? closeMenu() : (menuOpen = true)"
          >
            ⋯
          </button>
          <div v-if="menuOpen" role="menu" @keydown.esc.stop="closeMenu">
            <button type="button" role="menuitem" @click="openFormFromMenu">
              {{ text.reschedule }}</button
            ><button type="button" role="menuitem" @click="deleteMeeting">{{ text.delete }}</button>
          </div>
        </div>
      </header>
      <div class="meeting-detail__body">
        <div>
          <MeetingAgenda :meeting="meeting" @refresh="refresh" /><MeetingNotes
            :meeting="meeting"
            @convert="openConvert"
            @refresh="refresh"
          /><MeetingPeople
            :meeting="meeting"
            @add="personSelectorUnavailable = true"
            @refresh="refresh"
          />
          <p v-if="personSelectorUnavailable" role="status">{{ text.selectorUnavailable }}</p>
        </div>
        <MeetingSide :meeting="meeting" @edit="openForm" @remove="deleteMeeting" />
      </div>
      <MeetingForm v-if="formOpen" :meeting="meeting" @close="closeForm" @saved="formSaved" />
      <MeetingConvert
        v-if="selectedNote"
        :note="selectedNote"
        @close="closeConvert"
        @saved="convertSaved"
      />
    </template>
  </main>
</template>
