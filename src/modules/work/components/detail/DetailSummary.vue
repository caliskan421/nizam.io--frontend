<script setup lang="ts">
import './detail.css'

import { computed } from 'vue'

import { UiIcon } from '@/shared/ui'

import type { WorkItem, WorkItemFile } from '../../model/types'
import DetailTimeline from './DetailTimeline.vue'
import { formatDay, formatRange, instantDay, personName } from './format'
import { detailText } from './messages'

/**
 * "Özet" sekmesi (E-03-46…51): atanan LİSTESİ (görev çok atananlı), oluşturan, tanımlanma,
 * tarih aralığı, son dosya adı (herhangi dosya kanıttır, P5) ve ilerleme çizgisi. "Kanıt
 * dosyası" bağlantısı Arşiv klasörüne gider → F5'e kadar devre dışı + faz notu (stub değil).
 * `files` `null` iken (okunuyor / okunamadı) dosya satırı "—".
 */
const props = defineProps<{
  item: WorkItem
  files: readonly WorkItemFile[] | null
  timeZone: string
}>()

const t = detailText
const none = t('workDetail.summary.none')
const created = computed(() => formatDay(instantDay(props.item.created_at, props.timeZone)) ?? none)
const range = computed(() => formatRange(props.item.start_on, props.item.end_on) ?? none)
const evidence = computed(() => {
  if (props.files === null) return none
  const last = props.files[props.files.length - 1]
  return last ? last.display_name : t('workDetail.summary.evidenceNone')
})
</script>

<template>
  <div class="wd-summary">
    <dl class="rp-dl">
      <dt>{{ t('workDetail.summary.assignee') }}</dt>
      <dd class="rp-wrap">
        <ul v-if="item.assignees.length" class="wd-people" data-testid="detail-assignees">
          <li v-for="person in item.assignees" :key="person.account_id" class="rp-trunc">
            {{ personName(person.full_name) }}
          </li>
        </ul>
        <template v-else>{{ none }}</template>
      </dd>
      <dt>{{ t('workDetail.summary.creator') }}</dt>
      <dd data-testid="detail-creator">{{ personName(item.created_by_full_name) }}</dd>
      <dt>{{ t('workDetail.summary.created') }}</dt>
      <dd class="rp-mono" data-testid="detail-created">{{ created }}</dd>
      <dt>{{ t('workDetail.summary.range') }}</dt>
      <dd class="rp-mono" data-testid="detail-range">{{ range }}</dd>
      <dt>{{ t('workDetail.summary.evidence') }}</dt>
      <dd>
        <button
          type="button"
          class="rp-linkbtn rp-dslink"
          data-testid="detail-evidence"
          disabled
          :title="t('workDetail.summary.archiveLater')"
        >
          <span class="rp-trunc">{{ evidence }}</span>
          <UiIcon name="chevron-right" size="sm" />
        </button>
      </dd>
    </dl>
    <DetailTimeline :item="item" :time-zone="timeZone" />
  </div>
</template>
