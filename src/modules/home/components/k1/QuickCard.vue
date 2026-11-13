<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { TASKS_NEW_TASK_QUERY, TASKS_ROUTE } from '@/modules/work/public'
import { TIMELINE_ROUTE } from '@/modules/timeline/public'
import { UiIcon, type IconName } from '@/shared/ui'

import { homeText } from '../../model/messages'
import { meetingsLocation } from '../../model/role/links'

/**
 * "Hızlı işlemler" (E-K1-29…33; P3: yeni kısayol icat edilmez, çizilen dört kutucuk). "Yeni
 * görev" 03'ün ortak formunu açar; "Toplantı planla" 09'a; "Tarih talebi gönder" 03c'ye (K6
 * yerine, F3 canlı). "Ekibe üye ekle" F6 dışı: açıklamalı devre dışı (05 yönetici ekranı).
 * Görünürlük çağıranın yetki olgusundan (`showTask`, `showMeeting`).
 */
defineProps<{ showTask: boolean; showMeeting: boolean }>()

const ICON: Record<string, IconName> = {
  task: 'plus',
  meeting: 'meetings',
  member: 'user-plus',
  request: 'calendar-check',
}
</script>

<template>
  <section class="t-card rh-card rh-card--aside" data-region="quick" aria-labelledby="k1-quick">
    <h2 id="k1-quick" class="rh-cardtitle">{{ homeText('home.k1.quick.title') }}</h2>
    <div class="rh-tiles">
      <RouterLink
        v-if="showTask"
        class="rh-quick"
        :to="{ name: TASKS_ROUTE.name, query: TASKS_NEW_TASK_QUERY }"
        data-quick="task"
      >
        <span class="rh-quick__top"><UiIcon :name="ICON.task!" /></span>
        <span class="rh-clamp2 rh-quick__label">{{ homeText('home.k1.quick.task') }}</span>
      </RouterLink>
      <RouterLink v-if="showMeeting" class="rh-quick" :to="meetingsLocation()" data-quick="meeting">
        <span class="rh-quick__top"><UiIcon :name="ICON.meeting!" /></span>
        <span class="rh-clamp2 rh-quick__label">{{ homeText('home.k1.quick.meeting') }}</span>
      </RouterLink>
      <button
        type="button"
        class="rh-quick"
        aria-disabled="true"
        :title="homeText('home.k1.later')"
        data-quick="member"
        @click.prevent
      >
        <span class="rh-quick__top">
          <UiIcon :name="ICON.member!" />
          <span class="rh-quick__phase">{{ homeText('home.k1.later') }}</span>
        </span>
        <span class="rh-clamp2 rh-quick__label">{{ homeText('home.k1.quick.member') }}</span>
      </button>
      <RouterLink class="rh-quick" :to="{ path: TIMELINE_ROUTE.path }" data-quick="request">
        <span class="rh-quick__top"><UiIcon :name="ICON.request!" /></span>
        <span class="rh-clamp2 rh-quick__label">{{ homeText('home.k1.quick.request') }}</span>
      </RouterLink>
    </div>
  </section>
</template>
