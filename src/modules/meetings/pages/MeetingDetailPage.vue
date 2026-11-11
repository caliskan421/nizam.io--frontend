<script setup lang="ts">
import { computed, nextTick, onScopeDispose, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMeeting } from '../api/queries'
import { useDeleteMeeting } from '../api/meeting-writes'
import { meetingCapabilities } from '../model/capabilities'
import { meetingDay } from '../model/list'
import type { MeetingNote } from '../model/types'
import MeetingAgenda from '../components/agenda/MeetingAgenda.vue'
import MeetingNotes from '../components/notes/MeetingNotes.vue'
import MeetingPeople from '../components/people/MeetingPeople.vue'
import MeetingSide from '../components/side/MeetingSide.vue'
import MeetingForm from '../components/forms/MeetingForm.vue'
import MeetingConvert from '../components/convert/MeetingConvert.vue'
import { authSession } from '@/shared/http'
import { reachesOwner } from '@/shared/http/mutation'
import { useInstanceStore } from '@/shared/instance/store'
import { usePageCrumb } from '@/shared/navigation/page-crumb'
import { useScopeStore } from '@/shared/scope/store'
import { useStanding } from '@/shared/scope/standing'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'

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
usePageCrumb(() => meeting.value?.title ?? null)
const remove = useDeleteMeeting()
const { confirmWrite } = useConfirm()
const formOpen = ref(false)
const selectedNote = ref<MeetingNote | null>(null)
const menuOpen = ref(false)
const personSelectorUnavailable = ref(false)
const menuButton = ref<HTMLButtonElement | null>(null)
const noteOpener = ref<HTMLElement | null>(null)
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
    day === today ? 'Bugün · ' : day === meetingDay(tomorrowDate, timezone.value) ? 'Yarın · ' : ''
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
function openFormFromMenu() {
  closeMenu()
  formOpen.value = true
}
function formSaved() {
  formOpen.value = false
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
  void nextTick(() => noteOpener.value?.isConnected && noteOpener.value.focus())
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
      title: 'Toplantı silinsin mi?',
      description: m.title,
      body: [
        'Toplantı listeden kalkar ve artık değiştirilemez. Yönetici silinenlerden geri yükleyebilir.',
      ],
      confirmLabel: 'Sil',
      tone: 'danger',
    },
    (context) => remove.submit({ programId: m.program_id, id: m.meeting_id }, { context }),
  )
  if (!outcome || !reachesOwner(outcome)) return
  if (
    outcome.kind === 'success' ||
    (outcome.kind === 'failed' && outcome.error.code === 'collaboration.meeting_not_found')
  )
    void router.push({ name: 'collaboration.meetings' })
  else notifyOutcome(outcome)
}
</script>

<template>
  <main class="meeting-detail">
    <p v-if="query.isPending.value">Yükleniyor…</p>
    <div v-else-if="query.isError.value">
      <p>Toplantı yüklenemedi.</p>
      <button type="button" @click="refresh">Tekrar dene</button>
    </div>
    <template v-else-if="meeting">
      <header class="meeting-detail__header">
        <div>
          <p class="rp-kicker">{{ dateLabel }}</p>
          <h1 class="rp-h1">{{ meeting.title }}</h1>
          <div class="meeting-detail__departments">
            <span
              v-for="department in meeting.departments"
              :key="department.department_id"
              :title="
                department.department_id === meeting.owner_department_id
                  ? 'Sahip koordinatörlük'
                  : undefined
              "
              >{{ department.department_name }}</span
            ><span>{{ meeting.departments.length }} koordinatörlük davetli</span
            ><span
              v-if="meeting.members_included"
              title="Bağlı koordinatörlüklerin üyeleri de bu toplantıyı görür ve not ekleyebilir"
              >Üyeler dahil</span
            >
          </div>
        </div>
        <div v-if="canManage">
          <button type="button" class="t-btn t-btn--secondary" @click="formOpen = true">
            Düzenle</button
          ><button
            ref="menuButton"
            type="button"
            aria-label="Diğer işlemler: tarihi ileri al, sil"
            :aria-expanded="menuOpen"
            @click="menuOpen ? closeMenu() : (menuOpen = true)"
          >
            ⋯
          </button>
          <div v-if="menuOpen" role="menu" @keydown.esc.stop="closeMenu">
            <button type="button" role="menuitem" @click="openFormFromMenu">Tarihi ileri al</button
            ><button type="button" role="menuitem" @click="deleteMeeting">Sil</button>
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
          <p v-if="personSelectorUnavailable" role="status">Kişi seçici henüz kullanılamıyor.</p>
        </div>
        <MeetingSide :meeting="meeting" @edit="formOpen = true" @remove="deleteMeeting" />
      </div>
      <MeetingForm
        v-if="formOpen"
        :meeting="meeting"
        @close="formOpen = false"
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

<style scoped>
.meeting-detail {
  padding: var(--space-6);
}
.meeting-detail__header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-bottom: var(--space-6);
}
.meeting-detail__departments {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.meeting-detail__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, var(--rp-aside-basis));
  gap: var(--space-5);
}
@media (max-width: 900px) {
  .meeting-detail__body {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
