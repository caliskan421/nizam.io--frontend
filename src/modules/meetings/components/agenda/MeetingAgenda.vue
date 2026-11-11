<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import './agenda.css'
import { checker } from './checker'
import { useAddAgendaItem, useDeleteAgendaItem, useUpdateAgendaItem } from '../../api/detail-writes'
import { meetingCapabilities } from '../../model/capabilities'
import type { AgendaItem, MeetingDetail } from '../../model/types'
import { useSessionReset } from '../../pages/detail/use-session-reset'
import { reachesOwner } from '@/shared/http/mutation'
import { trMeetings } from '@/shared/i18n/tr/meetings'
import { useInstanceStore } from '@/shared/instance/store'
import { useScopeStore } from '@/shared/scope/store'
import { useStanding } from '@/shared/scope/standing'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'
import { UiIcon } from '@/shared/ui'

const text = trMeetings.meetings.agenda
const props = defineProps<{ meeting: MeetingDetail }>()
const emit = defineEmits<{ refresh: [] }>()
const scope = useScopeStore()
const { standing } = useStanding()
const instance = useInstanceStore()
const add = useAddAgendaItem()
const update = useUpdateAgendaItem()
const remove = useDeleteAgendaItem()
const { confirmWrite } = useConfirm()
const draft = ref('')
const editing = ref<string | null>(null)
const editTitle = ref('')
const openMenu = ref<string | null>(null)
const limitReached = ref(false)
const section = ref<HTMLElement | null>(null)
const menuButtons = new Map<string, HTMLButtonElement>()
const checked = computed(() => props.meeting.agenda.filter((item) => item.is_checked).length)
const canManage = computed(
  () =>
    meetingCapabilities(standing.value, scope.programId ?? '', {
      inviteMode: props.meeting.invite_mode,
      ownerDepartmentId: props.meeting.owner_department_id,
      departmentIds: props.meeting.departments.map((d) => d.department_id),
      createdByAccountId: props.meeting.created_by_account_id,
      membersIncluded: props.meeting.members_included,
      participant: props.meeting.participants.some(
        (p) => p.account_id === standing.value?.accountId,
      ),
      viewerRole: props.meeting.viewer_role,
    }).manage,
)
function clearDrafts() {
  draft.value = ''
  editing.value = null
  editTitle.value = ''
  openMenu.value = null
  limitReached.value = false
}
watch(() => [props.meeting.meeting_id, scope.programId], clearDrafts)
useSessionReset(clearDrafts)
const count = computed(() => Array.from(draft.value).length)
function closeMenu(id: string) {
  openMenu.value = null
  void nextTick(() => menuButtons.get(id)?.focus())
}
function setButton(id: string, el: unknown) {
  if (el instanceof HTMLButtonElement) menuButtons.set(id, el)
  else menuButtons.delete(id)
}
function result(
  outcome: Awaited<ReturnType<typeof add.submit>> | Awaited<ReturnType<typeof update.submit>>,
) {
  if (!reachesOwner(outcome)) return false
  if (outcome.kind === 'success') {
    emit('refresh')
    return true
  }
  if (outcome.kind === 'failed' && outcome.error.code === 'collaboration.agenda_limit_reached')
    limitReached.value = true
  notifyOutcome(outcome)
  return false
}
async function addItem() {
  const title = draft.value.trim()
  if (
    !scope.programId ||
    !title ||
    count.value > 300 ||
    props.meeting.agenda.length >= 50 ||
    limitReached.value ||
    add.isPending.value
  )
    return
  if (
    result(
      await add.submit({
        programId: scope.programId,
        id: props.meeting.meeting_id,
        body: { title },
      }),
    )
  )
    draft.value = ''
}
async function toggle(item: AgendaItem, event: Event) {
  const input = event.target
  if (input instanceof HTMLInputElement) input.checked = item.is_checked
  if (!scope.programId || update.isPending.value) return
  result(
    await update.submit({
      programId: scope.programId,
      itemId: item.agenda_item_id,
      body: { is_checked: !item.is_checked },
    }),
  )
}
async function save(item: AgendaItem) {
  const title = editTitle.value.trim()
  if (!scope.programId || !title || Array.from(title).length > 300 || update.isPending.value) return
  if (
    result(
      await update.submit({
        programId: scope.programId,
        itemId: item.agenda_item_id,
        body: { title },
      }),
    )
  )
    cancelEdit(item.agenda_item_id)
}
function editItem(item: AgendaItem) {
  editing.value = item.agenda_item_id
  editTitle.value = item.title
  openMenu.value = null
  void nextTick(() => section.value?.querySelector<HTMLInputElement>('[data-agenda-edit]')?.focus())
}
function cancelEdit(id: string) {
  editing.value = null
  void nextTick(() => menuButtons.get(id)?.focus())
}
function toggleMenu(id: string) {
  if (openMenu.value === id) return closeMenu(id)
  openMenu.value = id
  void nextTick(() =>
    section.value?.querySelector<HTMLButtonElement>('[role=menu] button')?.focus(),
  )
}
async function deleteItem(item: AgendaItem) {
  closeMenu(item.agenda_item_id)
  if (!scope.programId || remove.isPending.value) return
  const programId = scope.programId
  const outcome = await confirmWrite(
    {
      title: text.deleteTitle,
      description: item.title,
      confirmLabel: text.delete,
      tone: 'danger',
    },
    (context) => remove.submit({ programId, itemId: item.agenda_item_id }, { context }),
  )
  if (outcome && reachesOwner(outcome)) {
    if (outcome.kind === 'success') {
      emit('refresh')
      void nextTick(() => section.value?.querySelector<HTMLElement>('h2')?.focus())
    } else notifyOutcome(outcome)
  }
}
</script>

<template>
  <section ref="section" class="t-card meeting-agenda" aria-labelledby="meeting-agenda-title">
    <div class="rp-cardhead">
      <h2 id="meeting-agenda-title" class="rp-cardtitle" tabindex="-1">{{ text.title }}</h2>
      <div
        class="meeting-agenda__status"
        :data-all="meeting.agenda.length > 0 && checked === meeting.agenda.length"
      >
        <progress
          class="meeting-agenda__progress"
          :value="checked"
          :max="meeting.agenda.length || 1"
          :title="`${checked} / ${meeting.agenda.length} ${text.checked}`"
        />
        <span>{{ checked }} / {{ meeting.agenda.length }}</span>
      </div>
    </div>
    <div v-for="item in meeting.agenda" :key="item.agenda_item_id" class="meeting-agenda__row">
      <input
        class="t-check"
        type="checkbox"
        :checked="item.is_checked"
        :disabled="!canManage || update.isPending.value"
        :aria-label="item.title"
        @change="toggle(item, $event)"
      />
      <form
        v-if="editing === item.agenda_item_id"
        @submit.prevent="save(item)"
        @keydown.esc.stop="cancelEdit(item.agenda_item_id)"
      >
        <input v-model="editTitle" data-agenda-edit :aria-label="`${item.title} düzenle`" /><button
          type="submit"
        >
          {{ text.save }}</button
        ><button type="button" @click="cancelEdit(item.agenda_item_id)">{{ text.cancel }}</button>
      </form>
      <span v-else :class="{ 'meeting-agenda__done': item.is_checked }">{{ item.title }}</span>
      <small v-if="item.is_checked">{{
        checker(
          item,
          meeting.participants,
          instance.profile?.timezone ?? 'Europe/Istanbul',
          text.unknown,
        )
      }}</small>
      <div v-if="canManage" class="meeting-agenda__actions">
        <button
          :ref="(el) => setButton(item.agenda_item_id, el)"
          class="t-iconbtn meeting-agenda__menu-trigger"
          type="button"
          :aria-label="`${item.title} ${text.actions}`"
          :aria-expanded="openMenu === item.agenda_item_id"
          @click="toggleMenu(item.agenda_item_id)"
          @keydown.esc.stop="closeMenu(item.agenda_item_id)"
        >
          <UiIcon name="more" size="sm" />
        </button>
      </div>
      <div
        v-if="openMenu === item.agenda_item_id"
        class="meeting-agenda__menu"
        role="menu"
        @keydown.esc.stop="closeMenu(item.agenda_item_id)"
      >
        <button class="rp-menuitem" role="menuitem" type="button" @click="editItem(item)">
          {{ text.edit }}
        </button>
        <button
          class="rp-menuitem rp-menuitem--danger"
          role="menuitem"
          type="button"
          @click="deleteItem(item)"
        >
          {{ text.delete }}
        </button>
      </div>
    </div>
    <form v-if="canManage" @submit.prevent="addItem">
      <label class="meeting-agenda__addrow">
        <UiIcon name="plus" size="sm" />
        <input
          v-model="draft"
          :disabled="meeting.agenda.length >= 50 || limitReached || add.isPending.value"
          :placeholder="text.placeholder"
          :aria-label="text.placeholder"
        />
        <span>{{ count }} / 300</span></label
      >
      <p v-if="meeting.agenda.length >= 50 || limitReached">{{ text.limit }}</p>
    </form>
  </section>
</template>
