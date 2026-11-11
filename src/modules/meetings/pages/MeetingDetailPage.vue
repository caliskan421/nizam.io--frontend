<script setup lang="ts">
import { computed, nextTick, onScopeDispose, ref, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import './detail/detail.css'
import { useRoute, useRouter } from 'vue-router'
import { useMeeting } from '../api/queries'
import { listQuery } from './detail/list-query'
import { useDepartments } from './detail/use-departments'
import { useDeleteMeeting } from '../api/meeting-writes'
import { useMeetingAccess } from './detail/use-meeting-access'
import { meetingDepartments } from '../model/list'
import { dateLabel } from './detail/date-label'
import type { MeetingNote } from '../model/types'
import MeetingAgenda from '../components/agenda/MeetingAgenda.vue'
import MeetingNotes from '../components/notes/MeetingNotes.vue'
import MeetingPeople from '../components/people/MeetingPeople.vue'
import MeetingSide from '../components/side/MeetingSide.vue'
import MeetingForm from '../components/forms/MeetingForm.vue'
import MeetingConvert from '../components/convert/MeetingConvert.vue'
import { useSessionReset } from './detail/use-session-reset'
import { reachesOwner } from '@/shared/http/mutation'
import { authSession } from '@/shared/http'
import { ApiError } from '@/shared/errors/api-error'
import { invalidateStanding } from '@/shared/scope/standing'
import { trMeetings } from '@/shared/i18n/tr/meetings'
import { useInstanceStore } from '@/shared/instance/store'
import { usePageCrumb } from '@/shared/navigation/page-crumb'
import { useScopeStore } from '@/shared/scope/store'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'
import { UiIcon } from '@/shared/ui'

const text = trMeetings.meetings.detail
const route = useRoute()
const router = useRouter()
const scope = useScopeStore()
const instance = useInstanceStore()
const id = computed(() =>
  typeof route.params.meetingId === 'string' ? route.params.meetingId : null,
)
const query = useMeeting(id)
const client = useQueryClient()
let alive = true
onScopeDispose(() => {
  alive = false
})
watch(query.error, async (error) => {
  if (!(error instanceof ApiError) || (error.status !== 403 && error.status !== 404)) return
  const program = scope.programId
  const meetingId = id.value
  const generation = authSession.generation
  await invalidateStanding(client)
  if (
    !alive ||
    generation !== authSession.generation ||
    program !== scope.programId ||
    meetingId !== id.value
  )
    return
  void router.push({ name: 'collaboration.meetings', query: listQuery(route.query) })
})
const meeting = computed(() => query.data.value)
const departments = useDepartments()
const displayDepartments = computed(() =>
  meeting.value ? meetingDepartments(meeting.value, departments.value) : [],
)
usePageCrumb(() => meeting.value?.title ?? null)
const remove = useDeleteMeeting()
const { confirmWrite } = useConfirm()
const formOpen = ref(false)
const formDateFocus = ref(false)
const formSection = ref<'all' | 'departments'>('all')
const selectedNote = ref<MeetingNote | null>(null)
const menuOpen = ref(false)
const menuButton = ref<HTMLButtonElement | null>(null)
const noteOpener = ref<HTMLElement | null>(null)
const formOpener = ref<HTMLElement | null>(null)
const page = ref<HTMLElement | null>(null)
const timezone = computed(() => instance.profile?.timezone ?? 'Europe/Istanbul')
const canManage = useMeetingAccess(meeting)

const meetingDateLabel = computed(() =>
  meeting.value
    ? dateLabel(meeting.value.meeting_date, timezone.value, new Date(), text.today, text.tomorrow)
    : '',
)

function openForm() {
  formSection.value = 'all'
  formDateFocus.value = false
  formOpener.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
  formOpen.value = true
}
function openDepartments() {
  openForm()
  formSection.value = 'departments'
}
function openFormFromMenu() {
  formSection.value = 'all'
  formDateFocus.value = true
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
function toggleMenu() {
  if (menuOpen.value) return closeMenu()
  menuOpen.value = true
  void nextTick(() =>
    menuButton.value?.nextElementSibling?.querySelector<HTMLButtonElement>('button')?.focus(),
  )
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
}
watch(() => [scope.programId, id.value], closeDialogs)
useSessionReset(closeDialogs)
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
          <p class="rp-kicker">{{ meetingDateLabel }}</p>
          <h1 class="rp-h1">{{ meeting.title }}</h1>
          <div class="meeting-detail__departments">
            <span
              v-for="department in displayDepartments"
              :key="department.department_id"
              class="meeting-detail__code"
              :class="{
                'meeting-detail__code--owner':
                  department.department_id === meeting.owner_department_id,
              }"
              :title="
                department.department_id === meeting.owner_department_id ? text.owner : undefined
              "
              >{{ department.code }}</span
            ><span class="meeting-detail__count"
              >{{ meeting.departments.length }} {{ text.invited }}</span
            ><span
              v-if="meeting.members_included"
              class="meeting-detail__members"
              :title="text.membersTitle"
              ><UiIcon name="eye" size="sm" /> {{ text.members }}</span
            >
          </div>
        </div>
        <div v-if="canManage">
          <button type="button" class="t-btn t-btn--secondary" @click="openForm">
            <UiIcon name="edit" size="sm" /> {{ text.edit }}</button
          ><button
            ref="menuButton"
            class="t-iconbtn"
            type="button"
            :aria-label="text.other"
            :aria-expanded="menuOpen"
            @click="toggleMenu"
            @keydown.esc.stop="closeMenu"
          >
            <UiIcon name="more" size="sm" />
          </button>
          <div
            v-if="menuOpen"
            class="meeting-detail__menu"
            role="menu"
            @keydown.esc.stop="closeMenu"
          >
            <button class="rp-menuitem" type="button" role="menuitem" @click="openFormFromMenu">
              {{ text.reschedule }}</button
            ><button
              class="rp-menuitem rp-menuitem--danger"
              type="button"
              role="menuitem"
              @click="deleteMeeting"
            >
              {{ text.delete }}
            </button>
          </div>
        </div>
      </header>
      <div class="meeting-detail__body">
        <div class="meeting-detail__content">
          <MeetingAgenda :meeting="meeting" @refresh="refresh" /><MeetingNotes
            :meeting="meeting"
            @convert="openConvert"
            @refresh="refresh"
          />
        </div>
        <div class="meeting-side">
          <MeetingPeople :meeting="meeting" @refresh="refresh" />
          <MeetingSide :meeting="meeting" @edit="openDepartments" @remove="deleteMeeting" />
        </div>
      </div>
      <MeetingForm
        v-if="formOpen"
        :meeting="meeting"
        :edit-section="formSection"
        :initial-focus="formDateFocus ? 'date' : undefined"
        @close="closeForm"
        @saved="formSaved"
      />
      <MeetingConvert
        v-if="selectedNote"
        :note="selectedNote"
        @close="closeConvert"
        @saved="convertSaved"
      />
    </template>
  </main>
</template>
