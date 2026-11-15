<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
type Tab = 'yaklasan' | 'gecmis' | 'silinenler'
const props = defineProps<{
  selected: Tab
  /** `tab_counts` (BE-021); okuma gelene dek `null` (sayı gösterilmez). */
  upcoming: number | null
  past: number | null
  admin: boolean
  /** Yalnız ŞY'de dolu. */
  deleted: number | null
}>()
const emit = defineEmits<{ select: [tab: Tab] }>()
const { t } = useI18n()
const root = ref<HTMLElement | null>(null)
const tabs = computed(() => {
  const show = (count: number | null) => (count === null ? '' : String(count))
  const result: { id: Tab; label: string; count: string }[] = [
    { id: 'yaklasan', label: t('meetings.list.upcoming'), count: show(props.upcoming) },
    { id: 'gecmis', label: t('meetings.list.past'), count: show(props.past) },
  ]
  if (props.admin)
    result.push({
      id: 'silinenler',
      label: t('meetings.list.deleted'),
      count: show(props.deleted),
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
