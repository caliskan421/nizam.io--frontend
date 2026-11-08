<script setup lang="ts">
import type { ScopeLens } from '@/shared/scope/scope'
import type { DepartmentOption } from '@/shared/scope/standing-facts'
import { UiMenu, UiMenuItem } from '@/shared/ui'

import { sideText } from './messages'

/**
 * Koordinatörlük menüsü (E-00-09): satırlar `program == seçili ∧ rol == mercek` (yaşam
 * döngüsünden, ad sırası `tr-TR`). Başlık merceğe göre; ek satır, ayar, "ekle" yok.
 */
defineProps<{
  departments: readonly DepartmentOption[]
  selectedId: string | null
  lens: ScopeLens | null
  truncated: boolean
  autofocus: boolean
}>()
const emit = defineEmits<{ select: [departmentId: string]; close: [reason: 'escape' | 'tab'] }>()
</script>

<template>
  <UiMenu
    class="side-pop"
    :label="sideText('side.menu.department')"
    :autofocus="autofocus"
    @close="emit('close', $event)"
  >
    <p class="side-pop__h" role="none">
      {{ sideText(lens === 'coordinator' ? 'side.menu.coordinatorHead' : 'side.menu.memberHead') }}
    </p>
    <UiMenuItem
      v-for="d in departments"
      :key="d.departmentId"
      class="side-it"
      :checked="d.departmentId === selectedId"
      @select="emit('select', d.departmentId)"
    >
      {{ d.displayName }}
    </UiMenuItem>
    <p v-if="truncated" class="side-pop__h" role="none">{{ sideText('side.menu.truncated') }}</p>
  </UiMenu>
</template>
