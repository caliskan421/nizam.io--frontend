<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { isRouteName, type OpenStateName } from '@/app/routes.catalog'
import { useScopeStore } from '@/shared/scope/store'

import { injectScopeLifecycle } from '../side/public'
import { buildCrumbs } from './crumbs'
import { topbarText } from './messages'

/** Konum izi (E-00-35): program adı kabuğun `['programs']` verisinden, sayfa adı katalogdan. */
const props = defineProps<{ openState: OpenStateName | null }>()

const lifecycle = injectScopeLifecycle()
const store = useScopeStore()
const route = useRoute()

const programName = computed(
  () => lifecycle.programs.value.find((p) => p.programId === store.programId)?.name ?? null,
)
const crumbs = computed(() =>
  buildCrumbs({
    routeName: isRouteName(route.name) ? route.name : null,
    programName: programName.value,
    openState: props.openState,
  }),
)
</script>

<template>
  <nav class="rp-crumbs" :aria-label="topbarText('topbar.crumbs')" data-testid="topbar-crumbs">
    <template v-for="(crumb, index) in crumbs.links" :key="index">
      <RouterLink v-if="crumb.to" :to="crumb.to">{{ crumb.label }}</RouterLink>
      <span v-else>{{ crumb.label }}</span>
      <span aria-hidden="true">/</span>
    </template>
    <strong v-if="crumbs.current" aria-current="page">{{ crumbs.current }}</strong>
  </nav>
</template>
