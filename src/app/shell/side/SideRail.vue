<script setup lang="ts">
import { computed } from 'vue'

import type { ScopeStep } from '@/shared/scope/resolve'
import { UiAvatar, UiIcon } from '@/shared/ui'

import RailScope from './RailScope.vue'
import SideNav from './SideNav.vue'
import type { SideMenuGroup } from './menu'
import type { MenuRole } from './menu-definition'
import { sideText } from './messages'
import { injectScopeLifecycle } from './scope-key'

/**
 * Daraltılmış kenar menüsü (`.rp-rail`, 76 px; E-00-30…32, E-00-40). Rozet, yardım ve çıkış
 * dar hâlde yok (tasarım). Logo düğmesi genişletir; hover/odakta simge değişir.
 */
defineProps<{ groups: readonly SideMenuGroup[]; activeKey?: string; role: MenuRole }>()
const emit = defineEmits<{ expand: []; open: [which: ScopeStep] }>()
const lifecycle = injectScopeLifecycle()
const fullName = computed(() => lifecycle.standing.value?.fullName ?? null)
</script>

<template>
  <div class="rp-rail side-rail">
    <button
      class="rp-raillogo"
      type="button"
      :aria-label="sideText('side.expand')"
      :title="sideText('side.expand')"
      @click="emit('expand')"
    >
      <span class="rp-raillogo__mark" aria-hidden="true"><UiIcon name="rocket" bold /></span>
      <span class="rp-raillogo__open" aria-hidden="true"><UiIcon name="panel-expand" /></span>
    </button>
    <RailScope @open="emit('open', $event)" />
    <SideNav :groups="groups" :active-key="activeKey" rail />
    <UiAvatar
      v-if="fullName"
      :name="fullName"
      class="side-rail__av"
      :class="`side-ring side-ring--${role}`"
    />
  </div>
</template>
