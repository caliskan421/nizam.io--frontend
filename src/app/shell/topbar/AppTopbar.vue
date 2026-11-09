<script setup lang="ts">
import './topbar.css'

import { computed } from 'vue'
import { useRoute } from 'vue-router'

import type { OpenStateName } from '@/app/routes.catalog'
import { UiIcon } from '@/shared/ui'

import ThemeToggle from './ThemeToggle.vue'
import TopbarBell from './TopbarBell.vue'
import TopbarCrumbs from './TopbarCrumbs.vue'
import TopbarNav from './TopbarNav.vue'
import { topbarText } from './messages'
import { useToday } from './today'

/**
 * Üst çubuk (00-ortak `ozellikler.md` §2.6): geri/ileri → konum izi (esner) → [tarih] → tema →
 * zil. Tarih yalnız ana sayfada (E-00-36). Asistan (E-00-39) ve Yardım F8'e kadar gizli (P2):
 * DOM'da yoktur, `assistant*` çağrılmaz. Menü düğmesi yalnız dar ekranda (≤ 900 px) görünür ve
 * kenar menüsü kaplamasını açar/kapatır (P3 en sade; tasarımda mobil yok).
 */
defineProps<{ openState?: OpenStateName | null; navOpen?: boolean }>()
const emit = defineEmits<{ 'toggle-nav': [] }>()

const route = useRoute()
const today = useToday()
const showDate = computed(() => route.name === 'home' && today.value !== null)
</script>

<template>
  <div class="rp-topbar" data-testid="topbar">
    <button
      class="t-iconbtn rp-navtoggle"
      type="button"
      data-testid="topbar-menu"
      aria-controls="app-side"
      :aria-expanded="navOpen ? 'true' : 'false'"
      :aria-label="topbarText('topbar.menu')"
      :title="topbarText('topbar.menu')"
      @click="emit('toggle-nav')"
    >
      <UiIcon name="panel-expand" size="sm" />
    </button>
    <TopbarNav />
    <TopbarCrumbs :open-state="openState ?? null" />
    <span v-if="showDate" class="rp-kicker" data-testid="topbar-date">{{ today }}</span>
    <ThemeToggle />
    <TopbarBell />
  </div>
</template>
