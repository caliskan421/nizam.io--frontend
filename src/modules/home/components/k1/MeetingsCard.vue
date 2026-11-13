<script setup lang="ts">
import { RouterLink } from 'vue-router'

import type { ApiError } from '@/shared/errors/api-error'
import { UiCount } from '@/shared/ui'

import { homeText } from '../../model/messages'
import { meetingLocation, meetingsLocation } from '../../model/role/links'
import type { MeetingView } from '../../model/role/meetings'
import RegionBody from './RegionBody.vue'

/**
 * "Yaklaşan toplantılar ‹n›" (E-K1-34/35, E-Ü1-28/29): `listMeetings` `from` = bugün. Tarih ve
 * saat kurulum saat diliminde; kod rozetleri yerine departman adı kısaltması (tam ad ipucunda,
 * BE-005); sahip vurgulu. "Canlı" kutusu/rozeti ve "Anlık toplantı başlat" çizilmez (P21).
 * Satır 09b ayrıntısına gider. Sayı yüklenen sayfadaki toplamdır (`more` → "+").
 */
defineProps<{
  views: readonly MeetingView[]
  total: number
  more?: boolean
  loading?: boolean
  error?: Pick<ApiError, 'messageKey' | 'requestId'> | null
  retrying?: boolean
  /** Ü1: "üyeler katılıyor" etiketi; K1: "‹n› katılımcı" / "Üyeler katılıyor". */
  member?: boolean
}>()
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <section class="t-card rh-card rh-card--aside" data-region="meetings" aria-labelledby="rh-meet">
    <div class="rh-cardhead">
      <h2 id="rh-meet" class="rh-cardtitle">
        {{ homeText('home.k1.meetings.title') }}
        <UiCount :value="more ? `${total}+` : total" />
      </h2>
      <RouterLink class="rh-link" :to="meetingsLocation()">
        {{ homeText('home.k1.meetings.all') }}
      </RouterLink>
    </div>
    <RegionBody
      :loading="loading"
      :error="error"
      :retrying="retrying"
      :empty="views.length === 0 ? homeText('home.k1.meetings.empty') : null"
      :rows="2"
      @retry="emit('retry')"
    >
      <RouterLink
        v-for="m in views"
        :key="m.meetingId"
        class="rh-mrow"
        :to="meetingLocation(m.meetingId)"
        data-row
      >
        <span class="rh-mdate" :data-today="m.today ? 'true' : undefined">
          <b>{{ m.day }}</b>
          <span>{{ m.month }}</span>
          <em>{{ m.time }}</em>
        </span>
        <span class="rh-stack">
          <span class="rh-title rh-clamp2">{{ m.title }}</span>
          <span class="rh-meta">
            <span
              v-for="u in m.units"
              :key="u.id"
              class="rh-code"
              :class="{ 'rh-code--own': u.owner }"
              :title="u.owner ? homeText('home.k1.meetings.owner', { name: u.name }) : u.name"
            >
              {{ u.short }}
            </span>
            <span v-if="m.membersIncluded" class="rh-pill rh-pill--ok">
              {{ homeText('home.k1.meetings.membersIncluded') }}
            </span>
            <span v-else-if="m.participants !== null && !member">
              {{ homeText('home.k1.meetings.participants', { n: m.participants }) }}
            </span>
          </span>
        </span>
      </RouterLink>
    </RegionBody>
  </section>
</template>
