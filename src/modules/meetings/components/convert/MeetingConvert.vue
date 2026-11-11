<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useProgramDepartments } from '@/modules/work/public'
import { authSession } from '@/shared/http'
import { reachesOwner } from '@/shared/http/mutation'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiModal } from '@/shared/ui'
import { notifyOutcome } from '@/shared/ui/confirm'
import { useMeeting } from '../../api/queries'
import { useConvertNoteToTask } from '../../api/note-writes'
import { coordinatorDepartmentIds, meetingCapabilities } from '../../model/capabilities'
import type { MeetingNote } from '../../model/types'

const props = defineProps<{ note: MeetingNote }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const scope = useScopeStore()
const { standing } = useStanding()
const meeting = useMeeting(() => props.note.meeting_id)
const departments = useProgramDepartments()
const convert = useConvertNoteToTask()
const open = ref(true)
const title = ref(Array.from(props.note.content).slice(0, 100).join(''))
const department = ref('')
const start = ref('')
const end = ref('')
const options = computed(() => {
  const detail = meeting.data.value
  if (!detail || !standing.value) return []
  const facts = {
    inviteMode: detail.invite_mode,
    ownerDepartmentId: detail.owner_department_id,
    departmentIds: detail.departments.map((d) => d.department_id),
    createdByAccountId: detail.created_by_account_id,
    membersIncluded: detail.members_included,
    participant: detail.participants.some((p) => p.account_id === standing.value?.accountId),
    viewerRole: detail.viewer_role,
  }
  const access = meetingCapabilities(standing.value, detail.program_id, facts)
  if (
    !access.convertNote({
      authorAccountId: props.note.author_account_id,
      authorRole: props.note.author_role,
      converted: !!props.note.converted_to_work_item_id,
    })
  )
    return []
  const allowed = new Set(coordinatorDepartmentIds(standing.value, detail.program_id))
  return (departments.query.data.value?.departments ?? []).filter(
    (d) =>
      standing.value?.companyAdmin ||
      (allowed.has(d.department_id) && facts.departmentIds.includes(d.department_id)),
  )
})
const invalid = computed(
  () =>
    !department.value ||
    !options.value.some((d) => d.department_id === department.value) ||
    !start.value ||
    !end.value ||
    end.value < start.value ||
    start.value < new Date().toLocaleDateString('en-CA') ||
    Array.from(title.value).length > 255,
)
watch(
  () => [scope.programId, authSession.generation, standing.value?.accountId],
  () => emit('close'),
)
async function submit() {
  if (invalid.value || convert.isPending.value) return
  const result = await convert.submit({
    programId: scope.programId!,
    id: props.note.meeting_id,
    noteId: props.note.note_id,
    body: {
      department_id: department.value,
      title: title.value,
      start_date: start.value,
      end_date: end.value,
    },
  })
  if (!reachesOwner(result)) return
  if (result.kind === 'success') emit('saved')
  else {
    notifyOutcome(result)
    if (result.kind === 'failed' && result.error.code === 'collaboration.note_converted') {
      await meeting.refetch()
      emit('close')
    }
  }
}
</script>

<template>
  <UiModal
    v-model:open="open"
    title="Göreve dönüştür"
    :description="`${meeting.data.value?.title ?? ''} · ${note.author_name}`"
    @close="emit('close')"
  >
    <blockquote>{{ note.content }}</blockquote>
    <form id="meeting-convert-form" @submit.prevent="submit">
      <label>Görev başlığı <input v-model="title" maxlength="255" /></label>
      <p>
        {{ Array.from(title).length }} / 255 · Boş bırakırsan notun ilk 100 karakteri kullanılır.
      </p>
      <label
        >Hedef koordinatörlük
        <select v-model="department" required>
          <option value="" disabled>Seçiniz</option>
          <option v-for="item in options" :key="item.department_id" :value="item.department_id">
            {{ item.display_name }}
          </option>
        </select>
      </label>
      <label>Başlangıç <input v-model="start" type="date" required /></label>
      <label
        >Bitiş <input v-model="end" type="date" required :aria-invalid="!!end && invalid"
      /></label>
      <p v-if="end && invalid">Tarihleri ve hedef koordinatörlüğü kontrol edin.</p>
      <p>Görev, nottaki işaret ve denetim kaydı birlikte yazılır. Not bir kez dönüştürülebilir.</p>
    </form>
    <template #footer
      ><UiButton variant="ghost" @click="emit('close')">Vazgeç</UiButton
      ><UiButton variant="primary" :disabled="invalid || convert.isPending.value" @click="submit"
        >Görevi oluştur</UiButton
      ></template
    >
  </UiModal>
</template>
