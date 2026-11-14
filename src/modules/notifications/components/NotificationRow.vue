<script setup lang="ts">
/**
 * Bildirim satırı (E-14-25…48; P57 sade liste). Metin yalnız tür sözlüğünden (aktör/başlık yok);
 * satır tek birincil odak noktasıdır (Enter/Space), "Okundu say" ve "İncele"/"Gündemi aç" ayrı
 * odak durağıdır. Satır içi "Onayla/Reddet" BE-146 yüzünden devre dışı + "yakında" (stub).
 * Hedefi olmayan satır (membership, bilinmeyen kind) yalnız okundu işaretler (E-14-45).
 */
import { computed } from 'vue'

import { DesignStub, UiButton, UiIcon, UiIconButton } from '@/shared/ui'

import { notificationText, type NotificationTextKey } from '../messages'
import { describeNotification } from '../model/dictionary'
import { INLINE_DECISION } from '../model/stubs'
import { notificationTarget } from '../model/target'
import type { NotificationItem } from '../model/types'
import { fullTime, rowTime, type PanelGroup } from './panel-time'

const props = defineProps<{
  item: NotificationItem
  group: PanelGroup
  now: Date
  timeZone: string | undefined
  /** Bu satırın okundu yazması sürüyor. */
  pending: boolean
}>()
const emit = defineEmits<{
  /** Satır, "İncele" ya da "Gündemi aç": okundu + hedefe gezinme. */
  activate: []
  markRead: []
}>()

const entry = computed(() => describeNotification(props.item).entry)
const text = (field: 'label' | 'text') =>
  notificationText(`notifications.rows.types.${entry.value.id}.${field}` as NotificationTextKey)
const navigable = computed(() => notificationTarget(props.item) !== null)
const time = computed(() => rowTime(props.item.created_at, props.now, props.timeZone, props.group))
const title = computed(() => fullTime(props.item.created_at, props.timeZone))
const unread = computed(() => !props.item.is_read)
</script>

<template>
  <li
    class="nb-it"
    :data-unread="unread ? 'true' : 'false'"
    :data-navigable="navigable ? 'true' : 'false'"
    :aria-busy="pending ? 'true' : undefined"
    data-testid="notification-row"
  >
    <button type="button" class="nb-it__main" @click="emit('activate')">
      <span class="nb-ic" :class="`nb-tone--${entry.tone}`" aria-hidden="true">
        <UiIcon :name="entry.icon" size="sm" />
      </span>
      <span class="nb-tx">
        <span class="nb-tx__text">{{ text('text') }}</span>
        <span class="nb-meta">
          {{ text('label') }}
          <i aria-hidden="true">·</i>
          <time :datetime="item.created_at" :title="title">{{ time }}</time>
        </span>
      </span>
      <span
        v-if="unread"
        class="nb-un"
        role="img"
        :aria-label="notificationText('notifications.rows.unreadDot')"
      />
    </button>
    <div v-if="entry.action" class="nb-acts">
      <UiButton size="sm" @click="emit('activate')">
        {{
          notificationText(
            entry.action === 'review' ? 'notifications.rows.review' : 'notifications.rows.agenda',
          )
        }}
      </UiButton>
      <DesignStub v-if="entry.action === 'review' && !INLINE_DECISION.enabled" id="BE-146">
        <UiButton size="sm" disabled>{{ notificationText('notifications.rows.approve') }}</UiButton>
        <UiButton size="sm" disabled>{{ notificationText('notifications.rows.reject') }}</UiButton>
      </DesignStub>
    </div>
    <div v-if="unread" class="nb-hov">
      <UiIconButton
        icon="check"
        :label="notificationText('notifications.rows.markRead')"
        :disabled="pending"
        :aria-busy="pending ? 'true' : undefined"
        @click="emit('markRead')"
      />
    </div>
  </li>
</template>
