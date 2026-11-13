<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { UiIcon } from '@/shared/ui'

import { homeText } from '../../model/messages'
import { meetingLocation } from '../../model/role/links'
import type { MeetingView } from '../../model/role/meetings'

/**
 * "Hızlı işlemler" (E-Ü1-18…22; P3: çizilen dört kutucuk). "Kanıt yükle" ve "Not yaz" ortak
 * pencereleri açar (görev seçici = bana atananlar); "Koordinatörüme yaz" F7'ye kadar
 * açıklamalı devre dışı (10 Mesajlar; koordinatör adı satırı gizli — BE-141, `designStub` yok:
 * faz ertelemesi); "Toplantı notu ekle" en yakın yaklaşan toplantının 09b ayrıntısına gider,
 * toplantı yoksa devre dışı. 90 MB sınırı çizilmez (sözleşmede boyut sınırı yok).
 */
const props = defineProps<{
  nextMeeting: MeetingView | null
  canUpload: boolean
  canNote: boolean
}>()
const emit = defineEmits<{ upload: []; note: [] }>()

const meetingSub = computed(() =>
  props.nextMeeting
    ? homeText('home.u1.quick.meetingNoteSub', {
        when: props.nextMeeting.today
          ? props.nextMeeting.time
          : `${props.nextMeeting.day} ${props.nextMeeting.month} ${props.nextMeeting.time}`,
        title: props.nextMeeting.title,
      })
    : homeText('home.u1.quick.meetingNoteNone'),
)
</script>

<template>
  <section class="t-card rh-card rh-card--aside" data-region="quick" aria-labelledby="u1-quick">
    <h2 id="u1-quick" class="rh-cardtitle">{{ homeText('home.u1.quick.title') }}</h2>
    <div class="rh-tiles rh-tiles--auto">
      <button
        v-if="canUpload"
        type="button"
        class="rh-quick"
        data-quick="upload"
        @click="emit('upload')"
      >
        <span class="rh-quick__top"><UiIcon name="file-upload" /></span>
        <span class="rh-quick__label">
          {{ homeText('home.u1.quick.upload') }}
          <span class="rh-quick__sub">{{ homeText('home.u1.quick.uploadSub') }}</span>
        </span>
      </button>
      <button v-if="canNote" type="button" class="rh-quick" data-quick="note" @click="emit('note')">
        <span class="rh-quick__top"><UiIcon name="meeting-note" /></span>
        <span class="rh-quick__label">
          {{ homeText('home.u1.quick.note') }}
          <span class="rh-quick__sub">{{ homeText('home.u1.quick.noteSub') }}</span>
        </span>
      </button>
      <button
        type="button"
        class="rh-quick"
        aria-disabled="true"
        :title="homeText('home.u1.quick.messagePhase')"
        data-quick="message"
        @click.prevent
      >
        <span class="rh-quick__top">
          <UiIcon name="messages" />
          <span class="rh-quick__phase">{{ homeText('home.u1.quick.messagePhase') }}</span>
        </span>
        <span class="rh-quick__label">{{ homeText('home.u1.quick.message') }}</span>
      </button>
      <RouterLink
        v-if="nextMeeting"
        class="rh-quick"
        :to="meetingLocation(nextMeeting.meetingId)"
        data-quick="meetingNote"
      >
        <span class="rh-quick__top"><UiIcon name="meeting-note" /></span>
        <span class="rh-quick__label">
          {{ homeText('home.u1.quick.meetingNote') }}
          <span class="rh-quick__sub rh-clamp2">{{ meetingSub }}</span>
        </span>
      </RouterLink>
      <button
        v-else
        type="button"
        class="rh-quick"
        aria-disabled="true"
        :title="meetingSub"
        data-quick="meetingNote"
        @click.prevent
      >
        <span class="rh-quick__top"><UiIcon name="meeting-note" /></span>
        <span class="rh-quick__label">
          {{ homeText('home.u1.quick.meetingNote') }}
          <span class="rh-quick__sub">{{ meetingSub }}</span>
        </span>
      </button>
    </div>
  </section>
</template>
