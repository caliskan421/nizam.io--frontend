<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'

import { MEETINGS_ROUTE } from '@/modules/meetings/public'
import { USERS_ROUTE } from '@/modules/organization/public'
import { TASKS_NEW_TASK_QUERY, TASKS_ROUTE } from '@/modules/work/public'
import { UiIcon } from '@/shared/ui'

import { homeText } from '../model/messages'
import type { QuickAction } from '../model/quick-actions'
import ReportCreateMenu from './ReportCreateMenu.vue'

/**
 * "Hızlı işlemler" kartı (E-01-08…11; `Main.dc.html` 2 sütunlu ızgara). Yalnız capability'si olan
 * kutucuklar gelir (`quickActions`). "Yeni görev" 03 Görevler'e (formu orada açılır), "Toplantı
 * oluştur" 09 Toplantılar'a, "Kullanıcı davet et" 05 Kullanıcılar'a gider (W145 KUSUR 3; hepsi
 * canlı, faz etiketi yok). "Rapor oluştur" (yalnız yönetici) yönlendirme menüsü açar.
 */
defineProps<{ actions: QuickAction[] }>()

const LABELS = {
  newTask: 'home.quick.newTask',
  meeting: 'home.quick.meeting',
  invite: 'home.quick.invite',
  report: 'home.report.tile',
} as const

function label(action: QuickAction): string {
  return homeText(LABELS[action.key])
}

/** Kutucuğun açtığı canlı rota (yalnız 03/05/09 ekranları; rapor kutucuğu menü açar). */
function target(action: QuickAction): RouteLocationRaw {
  if (action.key === 'meeting') return { name: MEETINGS_ROUTE.name }
  if (action.key === 'invite') return { name: USERS_ROUTE.name }
  return { name: TASKS_ROUTE.name, query: TASKS_NEW_TASK_QUERY }
}
</script>

<template>
  <section class="t-card home-card" data-region="quick">
    <h2 class="rp-cardtitle">{{ homeText('home.quick.title') }}</h2>
    <div class="home-tiles">
      <template v-for="action in actions" :key="action.key">
        <ReportCreateMenu v-if="action.key === 'report'" />
        <RouterLink
          v-else
          :to="target(action)"
          class="rp-cardbtn home-tile"
          :data-quick="action.key"
        >
          <span class="home-tile__top"><UiIcon :name="action.icon" /></span>
          <span class="rp-clamp2 home-tile__label">{{ label(action) }}</span>
        </RouterLink>
      </template>
    </div>
  </section>
</template>
