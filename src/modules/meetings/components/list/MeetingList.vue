<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useProgramDepartments } from '@/modules/work/public'
import { useInstanceStore } from '@/shared/instance/store'
import { UiEmptyState, UiIcon } from '@/shared/ui'
import { groupMeetings, meetingDepartments } from '../../model/list'
import type { Meeting } from '../../model/types'
import { dayLabel } from '../../pages/meetings/day-label'
import { useNow } from '../../pages/meetings/use-now'
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
const now = useNow()
const timezone = computed(() => instance.profile?.timezone ?? 'Europe/Istanbul')
const groups = computed(() => {
  const merged = new Map<string, Meeting[]>()
  for (const group of groupMeetings(props.items, timezone.value)) {
    const label = dayLabel(group.day, now.value, timezone.value)
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
  <UiEmptyState v-if="!items.length" :title="t('meetings.list.empty')" />
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
              >{{ codes(item)[0]?.department_name }}{{ ' '
              }}<template v-if="item.departments.length > 1">
                {{
                  t('meetings.list.extraDepartments', { count: item.departments.length - 1 })
                }}</template
              ></span
            ></span
          ></span
        >
        <span v-if="item.summary" class="meeting-stats"
          ><span :title="t('meetings.list.agenda')"
            ><UiIcon name="tasks" size="sm" />{{ item.summary.agenda_checked }} /
            {{ item.summary.agenda_total }}</span
          ><span :title="t('meetings.list.notes')"
            ><UiIcon name="meeting-note" size="sm" />{{ item.summary.note_count }}</span
          ><span :title="t('meetings.list.participants')"
            ><UiIcon name="meeting-person" size="sm" />{{ item.summary.participant_count }}</span
          ></span
        ><UiIcon name="chevron-right" size="sm" aria-hidden="true" />
      </a>
    </section>
  </div>
</template>
