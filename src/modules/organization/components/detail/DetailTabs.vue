<script setup lang="ts">
import { ref } from 'vue'

import { UiCount } from '@/shared/ui'
import { rovingTarget } from '@/shared/ui/roving'

import type { CoordinatorshipTab } from '../index'
import type { DetailTabItem } from './detail-model'
import { detailText } from './messages'

/**
 * Sekme şeridi (E-08-57; tasarım `rp-tabs`, `role="tablist"`). Sekme kimliği
 * `‹panelId›-tab-‹değer›`, her sekme `aria-controls` ile panele bağlı. Gezici `tabindex`; ←/→,
 * Home/End etkin sekmeler arasında odağı taşır ve seçer. Arşiv (F5) ve Toplantılar (F4) faz dışı:
 * odaklanabilir değil, `aria-disabled`, sayı yok, ipucu faz notu (P2; `meeting_count`
 * kullanılmaz — BE-021). `shared/ui` `UiTabs` `disabled` özniteliği kullandığından ve faz notu
 * taşımadığından şerit burada aynı sınıflarla kurulur.
 */
const props = defineProps<{
  tabs: readonly DetailTabItem[]
  active: CoordinatorshipTab
  panelId: string
}>()
const emit = defineEmits<{ select: [tab: CoordinatorshipTab] }>()
const list = ref<HTMLElement | null>(null)

function choose(item: DetailTabItem): void {
  if (item.phase) return
  if (item.value !== props.active) emit('select', item.value as CoordinatorshipTab)
}

function onKeydown(event: KeyboardEvent): void {
  const tabs = [
    ...(list.value?.querySelectorAll<HTMLElement>('[role="tab"]:not([aria-disabled])') ?? []),
  ]
  const target = rovingTarget(event, tabs, 'horizontal')
  const item = props.tabs.find((t) => t.value === target?.dataset.value)
  if (item) choose(item)
}
</script>

<template>
  <div
    ref="list"
    class="rp-tabs cd-tabs"
    role="tablist"
    :aria-label="detailText('coordinatorship.tabs.label')"
    @keydown="onKeydown"
  >
    <button
      v-for="item in tabs"
      :id="`${panelId}-tab-${item.value}`"
      :key="item.value"
      type="button"
      role="tab"
      :data-value="item.value"
      :aria-selected="active === item.value ? 'true' : 'false'"
      :aria-controls="item.phase ? undefined : panelId"
      :aria-disabled="item.phase ? 'true' : undefined"
      :title="item.phase"
      :tabindex="active === item.value ? 0 : -1"
      @click="choose(item)"
    >
      {{ item.label }}
      <UiCount v-if="!item.phase && item.count !== undefined" :value="item.count" />
      <span v-if="item.phase" class="cd-phase">{{ item.phase }}</span>
    </button>
  </div>
</template>
