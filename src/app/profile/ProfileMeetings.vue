<script setup lang="ts">
import { routeLocation } from '@/app/routes.catalog'
import { useUpcomingMeetings } from '@/modules/home/public'
import { toApiError } from '@/shared/errors/api-error'
import { UiCard, UiErrorState } from '@/shared/ui'

const { query, views, more } = useUpcomingMeetings(null)
</script>

<template>
  <UiCard as="section" class="profile-card" aria-labelledby="profile-meetings-title">
    <h2 id="profile-meetings-title">Yaklaşan toplantılarım</h2>
    <UiErrorState
      v-if="query.isError.value"
      :error="toApiError(query.error.value)"
      retryable
      @retry="query.refetch()"
    />
    <p v-else-if="query.isPending.value" role="status">Toplantılar yükleniyor…</p>
    <p v-else-if="!views.length" class="rp-cap">Yaklaşan toplantı yok.</p>
    <ul v-else class="profile-list">
      <li v-for="meeting in views" :key="meeting.meetingId">
        <RouterLink :to="routeLocation('collaboration.meeting', { meetingId: meeting.meetingId })">
          {{ meeting.title }}
        </RouterLink>
        <time :datetime="new Date(meeting.at).toISOString()">
          {{ meeting.day }} {{ meeting.month }} · {{ meeting.time }}
        </time>
      </li>
    </ul>
    <p v-if="views.length && more" class="rp-cap">Yüklenen toplantılar içinden gösteriliyor.</p>
    <RouterLink :to="routeLocation('collaboration.meetings', {})">Tüm toplantılar</RouterLink>
  </UiCard>
</template>
