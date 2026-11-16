<script setup lang="ts">
import { useRouter } from 'vue-router'
import { TASKS_ROUTE } from '@/modules/work/public'
import { trMeetings } from '@/shared/i18n/tr/meetings'
import type { MeetingNote } from '../../model/types'

const props = defineProps<{ note: MeetingNote }>()
const text = trMeetings.meetings.notes
const router = useRouter()
// Dönüşüm anındaki hedef departman kopyası (BE-065) varsa etiket görev bağlantısıdır; eski
// dönüşmüş notlarda alan null → bağlantısız etiket. Görev erişimi work yetkisiyle sınanır.
const href = () =>
  props.note.converted_to_work_item_id && props.note.converted_work_item_department_id
    ? `${TASKS_ROUTE.path}?${new URLSearchParams({ gorev: props.note.converted_to_work_item_id })}`
    : null
function open(event: MouseEvent, target: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  void router.push(target)
}
</script>
<template>
  <a
    v-if="href()"
    class="meeting-notes__converted"
    :href="href()!"
    @click="open($event, href()!)"
    >{{ text.convertedLabel }}</a
  >
  <span v-else class="meeting-notes__converted">{{ text.convertedLabel }}</span>
</template>
