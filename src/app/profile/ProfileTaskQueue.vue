<script setup lang="ts">
import { computed } from 'vue'

import { routeLocation } from '@/app/routes.catalog'
import { useWorkItemCounts, useWorkItemList } from '@/modules/work/public'
import { toApiError } from '@/shared/errors/api-error'
import { UiErrorState } from '@/shared/ui'

const props = defineProps<{ department?: string; account?: string }>()
const department = () => props.department ?? null
const assignees = () => (props.account ? [props.account] : undefined)
const enabled = () => !!(props.department || props.account)
const { query, items, complete } = useWorkItemList(department, assignees, enabled)
const counts = useWorkItemCounts(department, assignees, enabled)
const queue = computed(() =>
  items.value
    .filter((item) =>
      props.department ? item.status === 'onaya_sunuldu' : item.status !== 'tamamlandi',
    )
    .sort((a, b) => a.end_on.localeCompare(b.end_on))
    .slice(0, 5),
)
</script>

<template>
  <dl v-if="counts.data.value && !counts.isError.value" class="profile-stats">
    <div>
      <dt>Açık görev</dt>
      <dd>{{ counts.data.value.total - counts.data.value.by_status.tamamlandi }}</dd>
    </div>
    <div>
      <dt>Geciken</dt>
      <dd>{{ counts.data.value.overdue }}</dd>
    </div>
    <div v-if="props.department">
      <dt>Onay bekleyen</dt>
      <dd>{{ counts.data.value.by_status.onaya_sunuldu }}</dd>
    </div>
    <div v-else>
      <dt>Tamamlanan</dt>
      <dd>{{ counts.data.value.by_status.tamamlandi }}</dd>
    </div>
  </dl>
  <UiErrorState
    v-if="query.isError.value"
    :error="toApiError(query.error.value)"
    retryable
    @retry="query.refetch()"
  />
  <p v-else-if="query.isPending.value" role="status">Görevler yükleniyor…</p>
  <template v-else>
    <p v-if="!complete" class="rp-cap">Yüklenen görevler içinden gösteriliyor.</p>
    <ul v-if="queue.length" class="profile-list">
      <li v-for="item in queue" :key="item.work_item_id">
        <RouterLink :to="routeLocation('work.tasks', {}, { gorev: item.work_item_id })">
          {{ item.title }}
        </RouterLink>
        <time :datetime="item.end_on">{{ item.end_on.split('-').reverse().join('.') }}</time>
      </li>
    </ul>
    <p v-else class="rp-cap">
      {{ complete ? 'Gösterilecek görev yok.' : 'Yüklenen kayıtlarda eşleşen görev yok.' }}
    </p>
  </template>
</template>
