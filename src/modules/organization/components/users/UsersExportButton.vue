<script setup lang="ts">
import { computed, ref } from 'vue'

import { cooldownSeconds, useDownloadCooldown } from '@/shared/download'

import { errorText } from '@/shared/i18n'
import { notifyOutcome } from '@/shared/ui/confirm'
import { UiIcon } from '@/shared/ui'

import { useUsersExport } from '../../api'
import { injectUsersView } from './use-users-view'
import { usersText } from './messages'

/**
 * "Dışa aktar" (E-05-04, BE-014; yalnız ŞY — sayfa ekran kapısıdır): ekrandaki rol sekmesi, arama,
 * koordinatörlük ve sıra aynen CSV'ye gider. Durum kartı yerinde (hazırlanıyor / indirildi /
 * hata kodu → i18n); sunucu iletisi gösterilmez, otomatik tekrar yok.
 */
const view = injectUsersView()
const exporter = useUsersExport()
const done = ref<string | null>(null)
const failure = ref<string | null>(null)
const cooldown = useDownloadCooldown(() => {
  failure.value = null
})
const disabled = computed(() => view === null || exporter.busy.value || cooldown.seconds.value > 0)

async function start(): Promise<void> {
  if (!view || exporter.busy.value) return
  done.value = null
  failure.value = null
  const result = await exporter.run(view.exportFilters.value)
  if (result.kind === 'saved') done.value = result.fileName
  else if (result.kind === 'failed') {
    failure.value = errorText(result.error)
    const wait = cooldownSeconds(result)
    if (wait !== null) cooldown.start(wait)
  } else if (result.kind === 'ticket_failed') notifyOutcome(result.outcome)
}
</script>

<template>
  <span class="users-export">
    <button
      class="t-btn t-btn--secondary"
      type="button"
      :disabled="disabled"
      :aria-busy="exporter.busy.value ? 'true' : undefined"
      data-testid="users-export"
      @click="start"
    >
      <UiIcon name="download" size="sm" />
      <span class="rp-trunc">{{ usersText('users.export') }}</span>
    </button>
    <span v-if="exporter.busy.value" class="rp-cap" role="status">{{
      usersText('users.exportState.preparing')
    }}</span>
    <span v-else-if="done" class="rp-cap" role="status">{{
      usersText('users.exportState.saved', { name: done })
    }}</span>
    <span v-else-if="failure" class="rp-cap" role="alert" data-testid="users-export-error">{{
      cooldown.seconds.value > 0
        ? usersText('users.exportState.cooldown', { seconds: cooldown.seconds.value })
        : failure
    }}</span>
  </span>
</template>
