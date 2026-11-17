<script setup lang="ts">
/**
 * Satır hover/odak şeridi (E-14-31…34): "Okundu say", "Bu görevi/toplantıyı sessize al" (`muted`'a
 * göre aç/kapa; yalnız görev ve toplantı konusunda, BE-156) ve "Kaldır". Dokunmatikte hep görünür.
 */
import { computed } from 'vue'

import { UiIconButton } from '@/shared/ui'

import { notificationText, type NotificationTextKey } from '../messages'
import { muteKindOf } from '../model/mute'
import type { NotificationItem } from '../model/types'

const props = defineProps<{ item: NotificationItem; pending: boolean }>()
const emit = defineEmits<{ markRead: []; toggleMute: []; dismiss: [] }>()

const muteKind = computed(() => muteKindOf(props.item))
const muteLabel = computed(() => {
  const base = muteKind.value === 'meeting' ? 'Meeting' : 'Work'
  const key = `notifications.rows.${props.item.muted ? 'unmute' : 'mute'}${base}`
  return notificationText(key as NotificationTextKey)
})
</script>

<template>
  <div class="nb-hov" role="group" :aria-label="notificationText('notifications.rows.moreActions')">
    <UiIconButton
      v-if="!item.is_read"
      icon="check"
      :label="notificationText('notifications.rows.markRead')"
      :disabled="pending"
      :aria-busy="pending ? 'true' : undefined"
      @click="emit('markRead')"
    />
    <UiIconButton
      v-if="muteKind"
      :icon="item.muted ? 'bell' : 'bell-off'"
      :label="muteLabel"
      :disabled="pending"
      data-testid="notification-mute"
      @click="emit('toggleMute')"
    />
    <UiIconButton
      icon="trash"
      :label="notificationText('notifications.rows.dismiss')"
      :disabled="pending"
      data-testid="notification-dismiss"
      @click="emit('dismiss')"
    />
  </div>
</template>
