<script setup lang="ts">
import './audit.css'

import { computed } from 'vue'

import { toApiError } from '@/shared/errors/api-error'
import { useInstanceStore } from '@/shared/instance/store'
import { UiButton, UiErrorState } from '@/shared/ui'

import { useAuditEntries } from '../api/queries'
import { useAuditScope } from '../model/access'
import { actionLabel, actorLabel, auditTime } from '../model/format'
import type { AuditQuery } from '../model/types'

const props = withDefaults(
  defineProps<{
    subject?: Partial<Pick<AuditQuery, 'actor' | 'department' | 'work_item_id'>>
    program?: string
    limit?: number
    more?: boolean
  }>(),
  { subject: undefined, program: undefined, limit: 5, more: false },
)
const scope = useAuditScope()
const instance = useInstanceStore()
const zone = computed(() => instance.profile?.timezone ?? 'Europe/Istanbul')
const authorized = computed(
  () =>
    scope.programId.value !== null && (!props.program || props.program === scope.programId.value),
)
const query = useAuditEntries(
  () => (authorized.value ? { ...props.subject, program_id: scope.programId.value! } : null),
  props.limit,
)
const rows = computed(() =>
  query.isError.value ? [] : (query.data.value?.pages.flatMap((page) => page.entries) ?? []),
)
</script>

<template>
  <div class="audit-feed" data-testid="audit-feed">
    <p v-if="!authorized" class="rp-cap">Bu görünüm için erişilebilir bir program seçin.</p>
    <UiErrorState
      v-else-if="query.isError.value"
      :error="toApiError(query.error.value)"
      retryable
      :retrying="query.isFetching.value"
      @retry="query.refetch()"
    />
    <p v-else-if="query.isPending.value" class="rp-cap" role="status">Etkinlik yükleniyor…</p>
    <p v-else-if="rows.length === 0" class="rp-cap">Gösterilecek etkinlik yok.</p>
    <ol v-else class="audit-feed__list">
      <li v-for="event in rows" :key="event.entry_id">
        <div>
          <strong>{{ actionLabel(event.action_code) }}</strong>
          <p v-if="event.target_name" class="rp-cap">{{ event.target_name }}</p>
          <p class="rp-cap">{{ actorLabel(event) }}</p>
        </div>
        <time :datetime="event.occurred_at" :title="event.occurred_at">
          {{ auditTime(event.occurred_at, zone) }}
        </time>
      </li>
    </ol>
    <UiButton
      v-if="more && query.hasNextPage.value && !query.isError.value"
      size="sm"
      :disabled="query.isFetchingNextPage.value"
      @click="query.fetchNextPage()"
    >
      Daha fazla göster
    </UiButton>
  </div>
</template>
