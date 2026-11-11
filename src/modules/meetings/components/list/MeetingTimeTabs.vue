<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
type Tab = 'yaklasan' | 'gecmis' | 'silinenler'
const props = defineProps<{
  selected: Tab
  upcoming: number
  past: number
  complete: boolean
  admin: boolean
  deletedCount: number | null
  deletedMore: boolean
}>()
const emit = defineEmits<{ select: [tab: Tab] }>()
const { t } = useI18n()
const root = ref<HTMLElement | null>(null)
const tabs = computed(() => {
  const suffix = props.complete ? '' : '+'
  const result: { id: Tab; label: string; count: string }[] = [
    { id: 'yaklasan', label: t('meetings.list.upcoming'), count: `${props.upcoming}${suffix}` },
    { id: 'gecmis', label: t('meetings.list.past'), count: `${props.past}${suffix}` },
  ]
  if (props.admin)
    result.push({
      id: 'silinenler',
      label: t('meetings.list.deleted'),
      count:
        props.deletedCount === null ? '' : `${props.deletedCount}${props.deletedMore ? '+' : ''}`,
    })
  return result
})
function keydown(event: KeyboardEvent, index: number) {
  let target = index
  if (event.key === 'ArrowRight') target = (index + 1) % tabs.value.length
  else if (event.key === 'ArrowLeft') target = (index + tabs.value.length - 1) % tabs.value.length
  else if (event.key === 'Home') target = 0
  else if (event.key === 'End') target = tabs.value.length - 1
  else return
  event.preventDefault()
  const id = tabs.value[target]!.id
  emit('select', id)
  void nextTick(() => root.value?.querySelector<HTMLButtonElement>(`#meeting-tab-${id}`)?.focus())
}
</script>
<template>
  <div ref="root" class="rp-seg" role="tablist" :aria-label="t('meetings.list.time')">
    <button
      v-for="(item, index) in tabs"
      :id="`meeting-tab-${item.id}`"
      :key="item.id"
      type="button"
      role="tab"
      :aria-selected="selected === item.id"
      aria-controls="meeting-list-panel"
      :tabindex="selected === item.id ? 0 : -1"
      :title="item.id === 'silinenler' ? t('meetings.list.deletedTitle') : undefined"
      @click="$emit('select', item.id)"
      @keydown="keydown($event, index)"
    >
      {{ item.label }} {{ item.count }}
    </button>
  </div>
</template>
