<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { TASKS_ROUTE } from '@/modules/work/public'
import { UiIcon } from '@/shared/ui'

import { homeText } from '../model/messages'
import type { QuickAction } from '../model/quick-actions'

/**
 * "Hızlı işlemler" kartı (E-01-08…11; `Main.dc.html` 2 sütunlu ızgara). Yalnız capability'si olan
 * kutucuklar gelir (`quickActions`). "Yeni görev" 03 Görevler'e gider (formu orada açılır);
 * faz dışı kutucuk açıklamalı devre dışıdır (`aria-disabled`, ipucu "F4’te açılacak"),
 * tıklama gezinmez (P2, ortak-kurallar §5).
 */
defineProps<{ actions: QuickAction[] }>()

const LABELS = {
  newTask: 'home.quick.newTask',
  meeting: 'home.quick.meeting',
  invite: 'home.quick.invite',
} as const

function label(action: QuickAction): string {
  return homeText(LABELS[action.key])
}

function phaseText(action: QuickAction): string {
  return action.phase ? homeText(`home.quick.phase.${action.phase}`) : ''
}

function disabledHint(action: QuickAction): string {
  return homeText('home.quick.disabled', { label: label(action), phase: phaseText(action) })
}
</script>

<template>
  <section class="t-card home-card" data-region="quick">
    <h2 class="rp-cardtitle">{{ homeText('home.quick.title') }}</h2>
    <div class="home-tiles">
      <template v-for="action in actions" :key="action.key">
        <RouterLink
          v-if="action.phase === null"
          :to="{ name: TASKS_ROUTE.name }"
          class="rp-cardbtn home-tile"
          :data-quick="action.key"
        >
          <span class="home-tile__top"><UiIcon :name="action.icon" /></span>
          <span class="rp-clamp2 home-tile__label">{{ label(action) }}</span>
        </RouterLink>
        <button
          v-else
          type="button"
          class="rp-cardbtn home-tile"
          aria-disabled="true"
          :title="disabledHint(action)"
          :data-quick="action.key"
          @click.prevent
        >
          <span class="home-tile__top">
            <UiIcon :name="action.icon" />
            <span class="home-tile__phase">{{ phaseText(action) }}</span>
          </span>
          <span class="rp-clamp2 home-tile__label">{{ label(action) }}</span>
        </button>
      </template>
    </div>
  </section>
</template>
