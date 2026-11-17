<script setup lang="ts">
/**
 * Satır içi karar (E-14-35…41; BE-146): bekleyen karar "Onayla / Reddet", sonuçlanmışsa sonuç ve
 * kim verdi ("başkası karar verdi"). Geri alma ("Onayladın · Geri al") ÇİZİLMEZ (GAP-246).
 * Bağlam eksikse (program/departman/istek kimliği yok) düğmeler devre dışı + neden.
 */
import { computed } from 'vue'

import { UiButton } from '@/shared/ui'

import { notificationText } from '../messages'
import { decisionOf, resolvedText } from '../model/decision'
import type { NotificationItem } from '../model/types'

const props = defineProps<{ item: NotificationItem; busy: boolean; me: string | null }>()
const emit = defineEmits<{ approve: []; reject: [] }>()

const state = computed(() => decisionOf(props.item))
const resolved = computed(() => resolvedText(props.item, props.me))
</script>

<template>
  <div v-if="state" class="nb-dec" data-testid="notification-decision">
    <UiButton
      size="sm"
      variant="primary"
      :disabled="busy || state !== 'ready'"
      :aria-busy="busy ? 'true' : undefined"
      @click="emit('approve')"
    >
      {{ notificationText('notifications.rows.approve') }}
    </UiButton>
    <UiButton size="sm" :disabled="busy || state !== 'ready'" @click="emit('reject')">
      {{ notificationText('notifications.rows.reject') }}
    </UiButton>
    <span v-if="state === 'unavailable'" class="nb-dec__note">
      {{ notificationText('notifications.rows.decision.unavailable') }}
    </span>
  </div>
  <p v-else-if="resolved" class="nb-dec nb-dec--done" data-testid="notification-resolved">
    {{ resolved }}
  </p>
</template>
