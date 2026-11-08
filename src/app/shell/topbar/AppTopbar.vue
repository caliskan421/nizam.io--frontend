<script setup lang="ts">
import './topbar.css'

import { computed } from 'vue'
import { useRoute } from 'vue-router'

import type { OpenStateName } from '@/app/routes.catalog'

import ThemeToggle from './ThemeToggle.vue'
import TopbarBell from './TopbarBell.vue'
import TopbarCrumbs from './TopbarCrumbs.vue'
import TopbarNav from './TopbarNav.vue'
import { useToday } from './today'

/**
 * Üst çubuk (00-ortak `ozellikler.md` §2.6): geri/ileri → konum izi (esner) → [tarih] → tema →
 * zil. Tarih yalnız ana sayfada (E-00-36). Asistan (E-00-39) ve Yardım F8'e kadar gizli (P2):
 * DOM'da yoktur, `assistant*` çağrılmaz.
 */
defineProps<{ openState?: OpenStateName | null }>()

const route = useRoute()
const today = useToday()
const showDate = computed(() => route.name === 'home' && today.value !== null)
</script>

<template>
  <div class="rp-topbar" data-testid="topbar">
    <TopbarNav />
    <TopbarCrumbs :open-state="openState ?? null" />
    <span v-if="showDate" class="rp-kicker" data-testid="topbar-date">{{ today }}</span>
    <ThemeToggle />
    <TopbarBell />
  </div>
</template>
