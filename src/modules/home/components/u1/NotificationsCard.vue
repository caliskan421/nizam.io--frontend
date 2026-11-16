<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import {
  describeNotification,
  notificationTarget,
  notificationText,
  useMarkNotificationRead,
  useNotifications,
  type NotificationItem,
  type NotificationTextKey,
} from '@/modules/notifications/public'
import { toApiError } from '@/shared/errors/api-error'
import { UiIcon } from '@/shared/ui'

import { homeText } from '../../model/messages'
import { meetingLocation, taskLocation } from '../../model/role/links'
import RegionBody from '../k1/RegionBody.vue'

/**
 * "Son bildirimler" (E-Ü1-23/24; W178 KUSUR 4): sayaç canlı (`countUnreadNotifications`, hesap
 * geneli); gövde bildirim panelinin aynı okuyucusundan (`useNotifications`) ilk 3 satırdır
 * — metin yalnız tür sözlüğünden (aktör/başlık uydurulmaz), satıra tıklamak okundu işaretler ve
 * hedefe gider (hedefsiz satır yalnız okundu). Liste boşsa nötr "Henüz bildirim yok". Sayaç
 * okunamazsa "‹n› yeni" çizilmez. "Tümü" (Ü7 bildirim sayfası) F8 kapsamı dışıdır: açıklamalı
 * devre dışı; tüm bildirimler zil panelindedir.
 */
const SHOWN = 3
defineProps<{ unread: number | null }>()

const router = useRouter()
const list = useNotifications(true)
const markRead = useMarkNotificationRead()
const rows = computed(() => list.items.value.slice(0, SHOWN))
const error = computed(() =>
  list.query.isError.value && list.items.value.length === 0
    ? toApiError(list.query.error.value)
    : null,
)
const loading = computed(() => list.query.data.value === undefined && !error.value)

const text = (item: NotificationItem, field: 'label' | 'text') =>
  notificationText(
    `notifications.rows.types.${describeNotification(item).entry.id}.${field}` as NotificationTextKey,
  )

function locationOf(item: NotificationItem) {
  const target = notificationTarget(item)
  if (target === null) return null
  if (target.route === 'work.tasks') return taskLocation(target.query.gorev)
  if (target.route === 'collaboration.meeting') return meetingLocation(target.params.meetingId)
  return { path: '/' }
}

async function open(item: NotificationItem): Promise<void> {
  const to = locationOf(item)
  if (!item.is_read) void markRead.submit({ id: item.id })
  if (to !== null) await router.push(to)
}
</script>

<template>
  <section
    class="t-card rh-card rh-card--aside"
    data-region="notifications"
    aria-labelledby="u1-notif"
  >
    <div class="rh-cardhead">
      <h2 id="u1-notif" class="rh-cardtitle">
        {{ homeText('home.u1.notifications.title') }}
        <span v-if="unread !== null && unread > 0" class="rh-pill rh-pill--ok" data-unread>
          {{ homeText('home.u1.notifications.unread', { n: unread }) }}
        </span>
      </h2>
      <span
        class="rh-link"
        aria-disabled="true"
        :title="homeText('home.u1.notifications.allLater')"
        data-testid="u1-notif-all"
      >
        {{ homeText('home.u1.notifications.all') }}
      </span>
    </div>
    <RegionBody
      :loading="loading"
      :error="error"
      :retrying="list.query.isFetching.value"
      :empty="rows.length === 0 ? homeText('home.u1.notifications.empty') : null"
      :rows="2"
      @retry="() => list.query.refetch()"
    >
      <button
        v-for="item in rows"
        :key="item.id"
        type="button"
        class="rh-mrow rh-nrow"
        :data-unread="item.is_read ? undefined : 'true'"
        data-row
        @click="open(item)"
      >
        <span class="rh-nicon" aria-hidden="true">
          <UiIcon :name="describeNotification(item).entry.icon" size="sm" />
        </span>
        <span class="rh-stack">
          <span class="rh-title rh-clamp2">{{ text(item, 'text') }}</span>
          <span class="rh-meta">{{ text(item, 'label') }}</span>
        </span>
      </button>
    </RegionBody>
  </section>
</template>
