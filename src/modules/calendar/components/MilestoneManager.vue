<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { computed, nextTick, onScopeDispose, ref } from 'vue'

import { ApiError } from '@/shared/errors/api-error'
import { authSession } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiErrorState, UiModal } from '@/shared/ui'

import { useMilestones } from '../api/queries'
import { createMilestone, deleteMilestone, updateMilestone } from '../api/milestones'
import { useCalendarScope } from '../model/capabilities'
import { formatDay, isDay, type Milestone } from '../model/calendar'

const props = defineProps<{ day: string }>()
const open = defineModel<boolean>('open', { required: true })
const scope = useCalendarScope()
const store = useScopeStore()
const client = useQueryClient()
const list = useMilestones(scope, () => open.value)
const listError = computed(() => (list.error.value instanceof ApiError ? list.error.value : null))
const draft = ref<{ original: Milestone | null; name: string; on: string } | null>(null)
const removing = ref<Milestone | null>(null)
const busy = ref(false)
const error = ref<ApiError | null>(null)
const status = ref('')
const nameInput = ref<HTMLInputElement | null>(null)
const removeConfirmation = ref<HTMLElement | null>(null)
const manager = ref<HTMLElement | null>(null)
const name = computed(() => draft.value?.name.trim() ?? '')
const changes = computed(() => {
  const original = draft.value?.original
  if (!original || !draft.value) return {}
  return {
    ...(original.name !== name.value ? { name: name.value } : {}),
    ...(original.on !== draft.value.on ? { on: draft.value.on } : {}),
  }
})
const canSave = computed(() =>
  Boolean(
    draft.value &&
    name.value &&
    [...name.value].length <= 80 &&
    isDay(draft.value.on) &&
    (!draft.value.original || Object.keys(changes.value).length),
  ),
)

let active = true
onScopeDispose(() => {
  active = false
})

function clear() {
  draft.value = null
  removing.value = null
  error.value = null
}

function edit(item?: Milestone) {
  clear()
  draft.value = { original: item ?? null, name: item?.name ?? '', on: item?.on ?? props.day }
  void nextTick(() => nameInput.value?.focus())
}
function askRemove(item: Milestone) {
  clear()
  removing.value = item
  void nextTick(() => removeConfirmation.value?.querySelector('button')?.focus())
}

function cancel() {
  clear()
  void nextTick(() => manager.value?.querySelector('button')?.focus())
}

function handleWriteFailure(failure: unknown): boolean {
  if (
    failure instanceof ApiError &&
    [400, 401, 403, 404, 409, 422, 429].includes(failure.status ?? 0)
  ) {
    error.value = failure
    if (![401, 403, 404].includes(failure.status ?? 0)) return false
    draft.value = null
    removing.value = null
  } else {
    clear()
    status.value =
      'İşlem sonucu doğrulanamadı. Yeni bir işlem başlatmadan önce listeyi kontrol edin.'
  }
  return true
}

function preparedWrite(id: string) {
  const removed = removing.value
  if (removed) return () => deleteMilestone(id, removed.id)
  const source = draft.value
  if (!source || !canSave.value) return null
  if (source.original) {
    const milestoneId = source.original.id
    const body = changes.value
    return () => updateMilestone(id, milestoneId, body)
  }
  const body = { name: name.value, on: source.on }
  return () => createMilestone(id, body)
}

async function write() {
  const id = scope.program.value
  if (busy.value || !id || !scope.admin.value) return
  const send = preparedWrite(id)
  if (!send) return
  const isRemoval = !!removing.value
  const audience = scope.audience.value
  const snapshot = store.snapshot
  const session = authSession.generation
  const account = authSession.snapshot.accountId
  const sameSession = () =>
    session === authSession.generation && account === authSession.snapshot.accountId
  const current = () => active && sameSession() && audience === scope.audience.value
  const reread = () => client.invalidateQueries({ queryKey: queryKeys.calendar.all(snapshot) })
  busy.value = true
  status.value = ''
  error.value = null
  try {
    await send()
    if (sameSession()) await reread()
    if (!current()) return
    clear()
    status.value = isRemoval ? 'Kilometre taşı silindi.' : 'Kilometre taşı kaydedildi.'
  } catch (failure) {
    if (current() && handleWriteFailure(failure)) await reread()
  } finally {
    if (active) busy.value = false
  }
}
</script>

<template>
  <UiModal v-model:open="open" title="Kilometre taşları" :dismissible="!busy">
    <div ref="manager" class="calendar-manager">
      <p v-if="status" role="status">{{ status }}</p>
      <UiErrorState v-if="error" title="İşlem tamamlanamadı" :error="error" />
      <p v-if="list.isPending.value" role="status">Kilometre taşları yükleniyor…</p>
      <UiErrorState
        v-else-if="listError"
        title="Kilometre taşları yüklenemedi"
        :error="listError"
        retryable
        :retrying="list.isFetching.value"
        @retry="list.refetch()"
      />
      <template v-else>
        <p v-if="!list.data.value?.milestones.length">Henüz kilometre taşı yok.</p>
        <ul v-else class="calendar-manager__list">
          <li v-for="item in list.data.value.milestones" :key="item.id">
            <span
              ><strong>{{ item.name }}</strong
              ><br />{{
                formatDay(item.on, { day: 'numeric', month: 'long', year: 'numeric' })
              }}</span
            >
            <UiButton
              size="sm"
              :disabled="busy"
              :aria-label="item.name + ' düzenle'"
              @click="edit(item)"
              >Düzenle</UiButton
            >
            <UiButton
              size="sm"
              :disabled="busy"
              :aria-label="item.name + ' sil'"
              @click="askRemove(item)"
              >Sil</UiButton
            >
          </li>
        </ul>
        <UiButton
          v-if="!draft && !removing"
          size="sm"
          variant="primary"
          :disabled="busy || list.isFetching.value"
          @click="edit()"
          >Kilometre taşı ekle</UiButton
        >
      </template>
      <form v-if="draft" class="calendar-manager__form" @submit.prevent="write">
        <label
          >Ad <input ref="nameInput" v-model="draft.name" class="t-input" required :disabled="busy"
        /></label>
        <label
          >Tarih <input v-model="draft.on" type="date" class="t-input" required :disabled="busy"
        /></label>
        <div class="calendar-controls">
          <UiButton size="sm" :disabled="busy" @click="cancel">Vazgeç</UiButton>
          <UiButton size="sm" type="submit" variant="primary" :disabled="busy || !canSave"
            >Kaydet</UiButton
          >
        </div>
      </form>
      <section
        v-if="removing"
        ref="removeConfirmation"
        class="calendar-manager__form"
        aria-label="Silme onayı"
      >
        <p>
          <strong>{{ removing.name }}</strong> kilometre taşı silinsin mi?
        </p>
        <div class="calendar-controls">
          <UiButton size="sm" :disabled="busy" @click="cancel">Vazgeç</UiButton>
          <UiButton size="sm" variant="danger" :disabled="busy" @click="write">Sil</UiButton>
        </div>
      </section>
    </div>
  </UiModal>
</template>
