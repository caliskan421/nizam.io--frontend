<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useAddAgendaItem, useDeleteAgendaItem, useUpdateAgendaItem } from '../../api/detail-writes'
import { meetingCapabilities } from '../../model/capabilities'
import type { AgendaItem, MeetingDetail } from '../../model/types'
import { reachesOwner } from '@/shared/http/mutation'
import { useInstanceStore } from '@/shared/instance/store'
import { useScopeStore } from '@/shared/scope/store'
import { useStanding } from '@/shared/scope/standing'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'

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
const count = computed(() => Array.from(draft.value).length)
function closeMenu(id: string) {
  openMenu.value = null
  void nextTick(() => menuButtons.get(id)?.focus())
}
function setButton(id: string, el: unknown) {
  if (el instanceof HTMLButtonElement) menuButtons.set(id, el)
  else menuButtons.delete(id)
}
function result(outcome: Awaited<ReturnType<typeof add.submit>>) {
  if (!reachesOwner(outcome)) return false
  if (outcome.kind === 'success') {
    emit('refresh')
    return true
  }
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
async function toggle(item: AgendaItem) {
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
    editing.value = null
}
async function deleteItem(item: AgendaItem) {
  closeMenu(item.agenda_item_id)
  if (!scope.programId || remove.isPending.value) return
  const programId = scope.programId
  const outcome = await confirmWrite(
    {
      title: 'Gündem maddesi silinsin mi?',
      description: item.title,
      confirmLabel: 'Sil',
      tone: 'danger',
    },
    (context) => remove.submit({ programId, itemId: item.agenda_item_id }, { context }),
  )
  if (outcome && reachesOwner(outcome)) {
    if (outcome.kind === 'success') emit('refresh')
    else notifyOutcome(outcome)
  }
}
function checker(item: AgendaItem) {
  const name =
    props.meeting.participants.find((p) => p.account_id === item.checked_by_account_id)
      ?.full_name ?? 'Bilinmeyen kişi'
  const parts = name.trim().split(/\s+/)
  const short = parts.length > 1 ? `${parts.slice(0, -1).join(' ')} ${parts.at(-1)?.[0]}.` : name
  const time = item.checked_at
    ? new Intl.DateTimeFormat('tr-TR', {
        timeZone: instance.profile?.timezone ?? 'Europe/Istanbul',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(item.checked_at))
    : ''
  return [short, time].filter(Boolean).join(' · ')
}
</script>

<template>
  <section class="t-card meeting-agenda" aria-labelledby="meeting-agenda-title">
    <div class="rp-cardhead">
      <h2 id="meeting-agenda-title" class="rp-cardtitle">Gündem</h2>
      <span :data-all="meeting.agenda.length > 0 && checked === meeting.agenda.length"
        >{{ checked }} / {{ meeting.agenda.length }}</span
      >
    </div>
    <progress
      :value="checked"
      :max="meeting.agenda.length || 1"
      :title="`${checked} / ${meeting.agenda.length} işaretli`"
    />
    <div v-for="item in meeting.agenda" :key="item.agenda_item_id" class="meeting-agenda__row">
      <input
        type="checkbox"
        :checked="item.is_checked"
        :disabled="!canManage || update.isPending.value"
        :aria-label="item.title"
        @change="toggle(item)"
      />
      <form v-if="editing === item.agenda_item_id" @submit.prevent="save(item)">
        <input v-model="editTitle" :aria-label="`${item.title} düzenle`" /><button type="submit">
          Kaydet</button
        ><button type="button" @click="editing = null">Vazgeç</button>
      </form>
      <span v-else :class="{ 'meeting-agenda__done': item.is_checked }">{{ item.title }}</span>
      <small v-if="item.is_checked">{{ checker(item) }}</small>
      <div v-if="canManage">
        <button
          :ref="(el) => setButton(item.agenda_item_id, el)"
          type="button"
          :aria-label="`${item.title} işlemleri`"
          :aria-expanded="openMenu === item.agenda_item_id"
          @click="
            openMenu === item.agenda_item_id
              ? closeMenu(item.agenda_item_id)
              : (openMenu = item.agenda_item_id)
          "
        >
          ⋯
        </button>
        <div
          v-if="openMenu === item.agenda_item_id"
          role="menu"
          @keydown.esc.stop="closeMenu(item.agenda_item_id)"
        >
          <button
            role="menuitem"
            type="button"
            @click="
              editing = item.agenda_item_id
              editTitle = item.title
              closeMenu(item.agenda_item_id)
            "
          >
            Düzenle
          </button>
          <button role="menuitem" type="button" @click="deleteItem(item)">Sil</button>
        </div>
      </div>
    </div>
    <form v-if="canManage" @submit.prevent="addItem">
      <label>
        <input
          v-model="draft"
          :disabled="meeting.agenda.length >= 50 || add.isPending.value"
          placeholder="Gündem maddesi ekle ve Enter’a bas"
        />
        <span>{{ count }} / 300</span></label
      >
      <p v-if="meeting.agenda.length >= 50">En fazla 50 gündem maddesi eklenebilir.</p>
    </form>
  </section>
</template>

<style scoped>
.meeting-agenda {
  padding: var(--space-5);
}
.meeting-agenda progress {
  width: 100%;
}
.meeting-agenda__row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-block: var(--space-3);
  border-bottom: var(--border-width) solid var(--border);
}
.meeting-agenda__row > span {
  flex: 1;
}
.meeting-agenda__done {
  text-decoration: line-through;
  opacity: 0.62;
}
</style>
