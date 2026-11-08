<script setup lang="ts">
import './detail.css'

import { UiIconButton } from '@/shared/ui'

import { detailText } from './messages'

/**
 * Panel üst bilgisi (E-03-41, E-03-43): `rp-kicker` "‹kod› · ‹koordinatörlük›" + başlık (en çok iki
 * satır) + "Paneli kapat". "Tam sayfada aç" (E-03-42) gizli: README kabul tablosunda öneri, en dar
 * güvenli davranış.
 */
defineProps<{ kicker: string; title: string | null; titleId: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div class="wd-head">
    <div class="wd-head__text">
      <p v-if="kicker" class="rp-kicker rp-trunc" data-testid="detail-kicker">{{ kicker }}</p>
      <h2 v-if="title" :id="titleId" class="wd-title rp-clamp2">{{ title }}</h2>
    </div>
    <UiIconButton icon="close" :label="detailText('workDetail.close')" @click="emit('close')" />
  </div>
</template>
