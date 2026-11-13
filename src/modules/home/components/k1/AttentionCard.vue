<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

import { DateRequestForm } from '@/modules/timeline/public'
import { TIMELINE_ROUTE } from '@/modules/timeline/public'
import { targetOf } from '@/modules/work/public'
import type { ApiError } from '@/shared/errors/api-error'
import { DesignStub, UiButton, UiCount, useToast } from '@/shared/ui'

import { useRoleFacts } from '../../api/role/use-facts'
import { homeText } from '../../model/messages'
import type { AttentionRow } from '../../model/k1/queues'
import type { WorkRow } from '../../model/role/common'
import { formatDayShort } from '../../model/role/dates'
import { taskLocation } from '../../model/role/links'
import RegionBody from './RegionBody.vue'

/**
 * "Dikkat gerektirenler ‹n›" (E-K1-23…25): geciken açık görevler (yüklenen küme; en uzun
 * gecikme önde). Satır eylemi: bekleyen talep varsa "Talebi gör" (03 paneli), yoksa koordinatör
 * için "Süre uzat" → ortak `DateRequestForm` (timeline, F3). "talep reddedildi" yalnız
 * yüklenen talep listesinde eşleşirse. Bağımlılık göstergesi/eylemi gizli (BE-138); kod `—`.
 */
defineProps<{
  rows: readonly AttentionRow[]
  loading?: boolean
  error?: Pick<ApiError, 'messageKey' | 'requestId'> | null
  retrying?: boolean
}>()
const emit = defineEmits<{ retry: [] }>()

const facts = useRoleFacts()
const toast = useToast()
const extending = ref<WorkRow | null>(null)
const open = ref(false)

function extend(item: WorkRow): void {
  extending.value = item
  open.value = true
}

function sent(): void {
  toast.push({ message: homeText('home.k1.attention.sent') })
}
</script>

<template>
  <section class="t-card rh-card" data-region="attention" aria-labelledby="k1-att-title">
    <div class="rh-cardhead">
      <h2 id="k1-att-title" class="rh-cardtitle">
        {{ homeText('home.k1.attention.title') }}
        <UiCount :value="rows.length" />
      </h2>
      <RouterLink class="rh-link" :to="{ path: TIMELINE_ROUTE.path }">
        {{ homeText('home.k1.attention.timeline') }}
      </RouterLink>
    </div>
    <p class="rh-note">{{ homeText('home.k1.attention.note', { n: rows.length }) }}</p>
    <RegionBody
      :loading="loading"
      :error="error"
      :retrying="retrying"
      :empty="rows.length === 0 ? homeText('home.k1.attention.empty') : null"
      @retry="emit('retry')"
    >
      <div v-for="row in rows" :key="row.item.work_item_id" class="rh-row rh-row--att" data-row>
        <span class="rh-dot rh-dot--late" aria-hidden="true" />
        <span class="rh-stack">
          <span class="rh-line">
            <RouterLink class="rh-title" :to="taskLocation(row.item.work_item_id)">
              {{ row.item.title }}
            </RouterLink>
            <DesignStub id="BE-005">
              <span class="rh-kicker">{{ homeText('home.k1.common.code') }}</span>
            </DesignStub>
          </span>
          <span class="rh-cap rh-trunc">
            {{
              row.item.assignees
                .map((a) => a.full_name)
                .filter(Boolean)
                .join(', ') ||
              (row.item.assignee_account_ids.length === 0
                ? homeText('home.k1.attention.who')
                : homeText('home.k1.common.unknownPerson'))
            }}
            · {{ homeText('home.k1.attention.due', { date: formatDayShort(row.item.end_on) }) }}
            <template v-if="row.requestPending">
              · {{ homeText('home.k1.attention.pending') }}
            </template>
            <template v-else-if="row.requestRejected">
              · {{ homeText('home.k1.attention.rejected') }}
            </template>
            <template v-if="row.item.subtask_counts.total > 0">
              ·
              {{
                homeText('home.k1.attention.subtasks', {
                  done: row.item.subtask_counts.done,
                  total: row.item.subtask_counts.total,
                })
              }}
            </template>
          </span>
        </span>
        <span class="rh-mono rh-danger rh-hide" data-late>
          {{ homeText('home.k1.attention.late', { n: row.item.days_overdue }) }}
        </span>
        <span class="rh-btns">
          <RouterLink
            v-if="row.requestPending"
            class="rh-link"
            :to="taskLocation(row.item.work_item_id)"
            :aria-label="homeText('home.k1.attention.viewLabel', { title: row.item.title })"
            data-action="view-request"
          >
            {{ homeText('home.k1.attention.viewRequest') }}
          </RouterLink>
          <UiButton
            v-else-if="facts.canExtend(row.item)"
            variant="ghost"
            size="sm"
            :aria-label="homeText('home.k1.attention.extendLabel', { title: row.item.title })"
            data-action="extend"
            @click="extend(row.item)"
          >
            {{ homeText('home.k1.attention.extend') }}
          </UiButton>
        </span>
      </div>
    </RegionBody>
    <DateRequestForm
      v-if="extending"
      v-model:open="open"
      :work-item-id="extending.work_item_id"
      :target="targetOf(extending)"
      :start-on="extending.start_on"
      :end-on="extending.end_on"
      @sent="sent"
    />
  </section>
</template>
