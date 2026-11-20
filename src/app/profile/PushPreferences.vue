<script setup lang="ts">
import { onMounted, onScopeDispose, ref, shallowRef } from 'vue'

import type { components } from '@/shared/api/schema'
import { toApiError, type ApiError } from '@/shared/errors/api-error'
import { api, authSession, unwrap } from '@/shared/http'
import { isDetached, useProtectedMutation } from '@/shared/http/mutation'
import { UiButton, UiCard, UiErrorState } from '@/shared/ui'
import { outcomeText } from '@/shared/ui/confirm'

type Preference = components['schemas']['NotificationPreference']
type Preferences = components['schemas']['NotificationPreferences']
const labels: Record<Preference['group'], string> = {
  gorev: 'Görevler',
  mesaj: 'Mesajlar',
  toplanti: 'Toplantılar',
  sistem: 'Sistem',
}
const generation = authSession.generation
let read: AbortController | undefined
const rows = shallowRef<Preference[]>()
const reading = ref(false)
const readError = shallowRef<ApiError>()
const status = ref('')
const failure = ref('')
const mutation = useProtectedMutation<Preference, Preferences>({
  operation: 'updateNotificationPreferences',
  scope: () => ({ programId: null, departmentId: null, lens: null }),
  send: (body, ctx) =>
    api.PUT('/v1/notifications/preferences', {
      body: { preferences: [body] },
      signal: ctx.signal,
    }),
})
const live = () => generation === authSession.generation

async function refresh() {
  if (reading.value || !live()) return
  const request = new AbortController()
  read = request
  reading.value = true
  readError.value = undefined
  try {
    const result = await unwrap(
      api.GET('/v1/notifications/preferences', { signal: request.signal }),
    )
    if (!request.signal.aborted && live()) rows.value = result.preferences
  } catch (cause) {
    if (!request.signal.aborted && live()) readError.value = toApiError(cause)
  } finally {
    reading.value = false
    read = undefined
  }
}

async function toggle(row: Preference) {
  if (mutation.isPending.value || reading.value || readError.value || !live()) return
  status.value = ''
  failure.value = ''
  const result = await mutation.submit({ group: row.group, push_muted: !row.push_muted })
  if (isDetached(result) || result.kind === 'owner_disposed' || !live()) return
  if (result.kind === 'success') {
    rows.value = result.data.preferences
    status.value = 'Bildirim tercihi kaydedildi.'
  } else {
    failure.value = outcomeText(result) ?? 'Bildirim tercihi kaydedilemedi.'
    if (result.kind === 'unknown_outcome') {
      rows.value = undefined
      await refresh()
    }
  }
}

onMounted(refresh)
onScopeDispose(() => read?.abort())
</script>

<template>
  <UiCard class="profile-card" as="section" aria-labelledby="profile-push-title">
    <h2 id="profile-push-title">Bildirim tercihleri</h2>
    <p class="rp-cap">Hesabınızın anlık bildirimleri. Portal içi bildirimler listede kalır.</p>
    <p v-if="reading && !rows" role="status">Tercihler yükleniyor…</p>
    <UiErrorState
      v-else-if="readError"
      :error="readError"
      title="Bildirim tercihleri okunamadı"
      retryable
      @retry="refresh"
    />
    <ul v-else-if="rows?.length" class="profile-list" aria-label="Anlık bildirim grupları">
      <li v-for="row in rows" :key="row.group">
        <span :id="'profile-push-' + row.group">{{ labels[row.group] }}</span>
        <UiButton
          size="sm"
          role="switch"
          :aria-labelledby="'profile-push-' + row.group"
          :aria-checked="!row.push_muted"
          :aria-disabled="mutation.isPending.value || undefined"
          @click="toggle(row)"
          >{{ row.push_muted ? 'Kapalı' : 'Açık' }}</UiButton
        >
      </li>
    </ul>
    <p v-else class="rp-cap">Gösterilecek bildirim grubu yok.</p>
    <p v-if="status" role="status">{{ status }}</p>
    <p v-if="failure" role="alert">{{ failure }}</p>
  </UiCard>
</template>
