<script setup lang="ts">
import type { ScopeLens } from '@/shared/scope/scope'
import type { LensOption } from '@/shared/scope/standing-facts'
import { UiCount, UiMenu, UiMenuItem } from '@/shared/ui'

import { sideText } from './messages'

/**
 * Rol (mercek) menüsü (E-00-08): yalnız bu programda sahip olunan mercekler. Seçili olmayan
 * Koordinatör/Üye satırında o mercekteki tekil birim sayısı; Admin satırında sayı yok.
 */
defineProps<{ lenses: readonly LensOption[]; selected: ScopeLens | null; autofocus: boolean }>()
const emit = defineEmits<{ select: [lens: ScopeLens]; close: [reason: 'escape' | 'tab'] }>()
</script>

<template>
  <UiMenu
    class="side-pop"
    :label="sideText('side.menu.lens')"
    :autofocus="autofocus"
    @close="emit('close', $event)"
  >
    <UiMenuItem
      v-for="option in lenses"
      :key="option.lens"
      class="side-it"
      :checked="option.lens === selected"
      @select="emit('select', option.lens)"
    >
      <span class="side-it__lead">
        <span class="side-dot" :class="`side-dot--${option.lens}`" aria-hidden="true" />
        <span>{{ sideText(`side.lens.${option.lens}`) }}</span>
      </span>
      <template v-if="option.lens !== 'admin' && option.lens !== selected" #end>
        <UiCount :value="option.departmentCount" />
      </template>
    </UiMenuItem>
  </UiMenu>
</template>
