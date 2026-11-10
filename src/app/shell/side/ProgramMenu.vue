<script setup lang="ts">
import type { ProgramOption } from '@/shared/scope/standing-facts'
import { UiMenu, UiMenuItem } from '@/shared/ui'

import { sideText } from './messages'
import { programAvatar } from './program-avatar'

/**
 * Program menüsü (E-00-07): satır `menuitemradio` — avatar (BE-001) + tam ad + "<year> sezonu"
 * (yalnız `year` varsa; dönem alanı yok). Sıra yaşam döngüsünden (ad, `tr-TR`). Liste
 * `X-Result-Truncated` ile kesildiyse "Liste kısaltıldı" satırı.
 */
defineProps<{
  programs: readonly ProgramOption[]
  selectedId: string | null
  truncated: boolean
  autofocus: boolean
}>()
const emit = defineEmits<{ select: [programId: string]; close: [reason: 'escape' | 'tab'] }>()
</script>

<template>
  <UiMenu
    class="side-pop"
    :label="sideText('side.menu.program')"
    :autofocus="autofocus"
    @close="emit('close', $event)"
  >
    <UiMenuItem
      v-for="p in programs"
      :key="p.programId"
      class="side-it"
      :checked="p.programId === selectedId"
      @select="emit('select', p.programId)"
    >
      <span class="side-it__lead">
        <span
          class="side-pav side-pav--lg"
          :class="`side-pav--${programAvatar(p, programs).tone}`"
          aria-hidden="true"
          >{{ programAvatar(p, programs).initials }}</span
        >
        <span class="side-it__text">
          <span class="rp-trunc">{{ p.name }}</span>
          <span v-if="p.year !== null" class="side-it__sub">{{
            sideText('side.menu.season', { year: p.year })
          }}</span>
        </span>
      </span>
    </UiMenuItem>
    <p v-if="truncated" class="side-pop__h" role="none">{{ sideText('side.menu.truncated') }}</p>
  </UiMenu>
</template>
