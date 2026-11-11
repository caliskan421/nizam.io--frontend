<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useProgramDepartments } from '@/modules/work/public'
import { useInstanceStore } from '@/shared/instance/store'
import { groupMeetings, meetingDepartments } from '../../model/list'
import type { Meeting } from '../../model/types'
import { dayLabel } from '../../pages/meetings/day-label'
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const props = defineProps<{ items: Meeting[]; complete: boolean }>()
const emit = defineEmits<{ create: []; openDeleted: []; select: [id: string] }>()
function select(event: MouseEvent, id: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  emit('select', id)
}
const departments = useProgramDepartments()
const instance = useInstanceStore()
const timezone = computed(() => instance.profile?.timezone ?? 'Europe/Istanbul')
const groups = computed(() => {
  const merged = new Map<string, Meeting[]>()
  for (const group of groupMeetings(props.items, timezone.value)) {
    const label = dayLabel(group.day, new Date(), timezone.value)
    merged.set(label, [...(merged.get(label) ?? []), ...group.items])
  }
  return [...merged].map(([label, items]) => ({ label, items }))
})
function format(date: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('tr-TR', { ...options, timeZone: timezone.value }).format(
    new Date(date),
  )
}
function codes(item: Meeting) {
  return meetingDepartments(item, departments.query.data.value?.departments ?? [])
}
</script>
<template>
  <div v-if="!items.length" class="meetings-empty">{{ t('meetings.list.empty') }}</div>
  <div v-else class="meetings-groups">
    <section v-for="group in groups" :key="group.label" class="meetings-group">
      <h2>
        {{ group.label }}
      </h2>
      <a
        v-for="item in group.items"
        :key="item.meeting_id"
        class="meeting-row"
        :href="router.resolve({ path: `/toplantilar/${item.meeting_id}`, query: route.query }).href"
        @click="select($event, item.meeting_id)"
      >
        <span class="meeting-date" data-state="normal"
          ><b>{{ format(item.meeting_date, { day: 'numeric' }) }}</b
          ><span>{{ format(item.meeting_date, { month: 'short' }) }}</span
          ><em>{{ format(item.meeting_date, { hour: '2-digit', minute: '2-digit' }) }}</em></span
        >
        <span class="meeting-content"
          ><strong>{{ item.title }}</strong
          ><span class="meeting-departments"
            ><span
              v-for="(department, index) in codes(item)"
              :key="department.department_id"
              class="meeting-code"
              :class="{ 'meeting-code-own': index === 0 }"
              :title="department.department_name"
              >{{ department.code }}</span
            ><span
              >{{ codes(item)[0]?.department_name
              }}<template v-if="item.departments.length > 1">
                + {{ item.departments.length - 1 }} koordinatörlük</template
              ></span
            ></span
          ></span
        >
        <span v-if="item.summary" class="meeting-stats"
          ><span title="Gündem"
            >{{ item.summary.agenda_checked }} / {{ item.summary.agenda_total }}</span
          ><span title="Notlar">{{ item.summary.note_count }}</span
          ><span title="Katılımcılar">{{ item.summary.participant_count }}</span></span
        ><span aria-hidden="true">›</span>
      </a>
    </section>
  </div>
</template>
