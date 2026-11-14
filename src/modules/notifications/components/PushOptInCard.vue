<script setup lang="ts">
/**
 * Web Push önerme kutusu (P58; E-14-59…73; `Bildirimler.dc.html` 2). Panel altında yer alır
 * (W158 yuvası); `pushPublicKey.enabled` false/bilinmiyorsa hiç çizilmez (E-14-60). Yüzler:
 * önerme (varsayılan) · "Şimdi değil" küçük hâli · Engellendi · iOS ana ekran · desteklenmiyor ·
 * az önce açıldı (adım 3). İzin penceresi yalnız "Bildirimleri aç" eyleminden sonra, tarayıcı
 * penceresi açıkken karartma + not olarak gösterilir (E-14-65; sayfa açılışında asla).
 * `enabled`: abonelik kaydedildi; `dismissed`: "Şimdi değil" (bellekte, kalıcı anahtar yok).
 */
import './push/push.css'

import { nextTick, ref } from 'vue'

import { UiButton, UiIcon, UiModal } from '@/shared/ui'

import { notificationText } from '../messages'
import PushSteps from './push/PushSteps.vue'
import { usePushOptIn } from './push/use-push-opt-in'

const emit = defineEmits<{
  enabled: []
  dismissed: []
}>()

const root = ref<HTMLElement | null>(null)
const { view, errorText, busy, requesting, enable, later, acknowledge, closePending } =
  usePushOptIn({ enabled: () => emit('enabled'), dismissed: () => emit('dismissed') })

const blockedSteps = [
  notificationText('notifications.push.blockedStep1'),
  notificationText('notifications.push.blockedStep2'),
  notificationText('notifications.push.blockedStep3'),
]
const iosSteps = [
  notificationText('notifications.push.iosStep1'),
  notificationText('notifications.push.iosStep2'),
  notificationText('notifications.push.iosStep3'),
]

/** "Şimdi değil" sonrası kutu küçük hâle geçer; odak oradaki "Aç" bağlantısına gider (gövdeye düşmez). */
async function onLater(): Promise<void> {
  later()
  await nextTick()
  root.value?.querySelector<HTMLElement>('[data-testid="push-open"]')?.focus()
}

/** "Tamam": kutu kapanır; odak panele (yoksa sahibe) döner, gövdeye düşmez. */
function onAcknowledge(): void {
  const host = root.value?.closest<HTMLElement>('[role="dialog"]') ?? null
  acknowledge()
  if (host) {
    if (!host.hasAttribute('tabindex')) host.setAttribute('tabindex', '-1')
    host.focus()
  }
}
</script>

<template>
  <section
    v-if="view !== 'hidden'"
    ref="root"
    class="push-opt-in"
    :class="`push-opt-in--${view}`"
    :aria-label="notificationText('notifications.push.title')"
    :data-view="view"
    data-testid="push-opt-in"
  >
    <span class="push-opt-in__icon" aria-hidden="true">
      <UiIcon
        :name="view === 'enabled' ? 'check' : view === 'blocked' ? 'alert' : 'bell'"
        size="sm"
      />
    </span>

    <div v-if="view === 'prompt'" class="push-opt-in__body">
      <h4 class="push-opt-in__title">{{ notificationText('notifications.push.title') }}</h4>
      <p class="push-opt-in__text">{{ notificationText('notifications.push.body') }}</p>
      <p class="push-opt-in__note" data-testid="push-chat-note">
        <UiIcon name="alert" size="sm" />{{ notificationText('notifications.push.chatNote') }}
      </p>
      <p v-if="errorText" class="push-opt-in__error" role="alert" data-testid="push-error">
        {{ errorText }}
      </p>
      <div class="push-opt-in__actions">
        <UiButton variant="ghost" size="sm" data-testid="push-later" @click="onLater">
          {{ notificationText('notifications.push.later') }}
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          data-testid="push-enable"
          :aria-busy="busy ? 'true' : undefined"
          @click="enable"
        >
          {{
            notificationText(errorText ? 'notifications.push.retry' : 'notifications.push.enable')
          }}
        </UiButton>
      </div>
    </div>

    <div v-else-if="view === 'snoozed'" class="push-opt-in__body">
      <h4 class="push-opt-in__title">{{ notificationText('notifications.push.snoozedTitle') }}</h4>
      <p class="push-opt-in__text">{{ notificationText('notifications.push.snoozedBody') }}</p>
      <p v-if="errorText" class="push-opt-in__error" role="alert" data-testid="push-error">
        {{ errorText }}
      </p>
      <div class="push-opt-in__actions">
        <UiButton variant="ghost" size="sm" data-testid="push-open" @click="enable">
          {{ notificationText('notifications.push.snoozedOpen') }}
        </UiButton>
      </div>
    </div>

    <div v-else-if="view === 'blocked'" class="push-opt-in__body">
      <h4 class="push-opt-in__title">{{ notificationText('notifications.push.blocked') }}</h4>
      <p class="push-opt-in__text">{{ notificationText('notifications.push.blockedHint') }}</p>
      <PushSteps :label="notificationText('notifications.push.stepsLabel')" :steps="blockedSteps" />
    </div>

    <div v-else-if="view === 'ios'" class="push-opt-in__body">
      <h4 class="push-opt-in__title">{{ notificationText('notifications.push.iosTitle') }}</h4>
      <p class="push-opt-in__text">{{ notificationText('notifications.push.iosBody') }}</p>
      <PushSteps :label="notificationText('notifications.push.stepsLabel')" :steps="iosSteps" />
    </div>

    <div v-else-if="view === 'unsupported'" class="push-opt-in__body">
      <p class="push-opt-in__text">{{ notificationText('notifications.push.unsupported') }}</p>
    </div>

    <div v-else class="push-opt-in__body">
      <h4 class="push-opt-in__title">{{ notificationText('notifications.push.enabledTitle') }}</h4>
      <div class="push-opt-in__actions">
        <UiButton variant="ghost" size="sm" data-testid="push-ok" @click="onAcknowledge">
          {{ notificationText('notifications.push.ok') }}
        </UiButton>
      </div>
    </div>
  </section>

  <UiModal
    :open="requesting"
    :title="notificationText('notifications.push.pendingTitle')"
    @update:open="(value: boolean) => !value && closePending()"
  >
    <p class="push-pending">
      <span class="push-pending__note" data-testid="push-pending-note">
        {{ notificationText('notifications.push.pendingNote') }}
      </span>
      <span class="push-pending__hint">{{
        notificationText('notifications.push.pendingHint')
      }}</span>
    </p>
  </UiModal>
</template>
