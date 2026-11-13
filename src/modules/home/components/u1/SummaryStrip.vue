<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import type { WorkItemCounts } from '@/modules/work/public'
import type { ApiError } from '@/shared/errors/api-error'
import { UiErrorState, UiIcon, type IconName } from '@/shared/ui'

import { homeText } from '../../model/messages'
import { openCount } from '../../model/role/common'
import { tasksLocation } from '../../model/role/links'
import { percent } from '../../model/kpi'
import { possessiveSuffix } from '../../model/turkish'
import BarSeg from '../k1/BarSeg.vue'

/**
 * "Görev özetim" şeridi (E-Ü1-04…08): `countProgramWorkItems` `assignee_account_id` = ben,
 * `department_id` yok (program geneli; BE-038, W135 varsayımı 2). Kesin sunucu sayaçları.
 * Kart tıklaması 03'ü (üye merceği) `durum` süzgeciyle açar; bölge hatası "Yeniden dene".
 * Notlar: "Koordinatör onayında" (kanıt iddiası yok), "Tekrar başlayabilirsin" (iade sebebi
 * satırda yok — BE-139; "kanıt eksik" iddiası kaldırıldı). Açık = 0 → nötr (§4).
 */
const props = defineProps<{
  counts: WorkItemCounts | null
  loading?: boolean
  error?: Pick<ApiError, 'messageKey' | 'requestId'> | null
  retrying?: boolean
}>()
const emit = defineEmits<{ retry: [] }>()

interface Card {
  key: 'open' | 'overdue' | 'pending' | 'returned'
  icon: IconName
  value: number
  note: string
  danger: boolean
  to: object
  bar: { tone: 'doing' | 'review' | 'late' | 'back' | 'todo'; width: number }[]
}

const cards = computed<Card[]>(() => {
  const c = props.counts
  if (!c) return []
  const open = openCount(c)
  const by = c.by_status
  const q = percent(c.overdue, open)
  const share = (n: number) => percent(n, open)
  return [
    {
      key: 'open',
      icon: 'bolt',
      value: open,
      note: homeText('home.u1.summary.openNote', {
        doing: by.devam_ediyor,
        review: by.onaya_sunuldu,
        back: by.iade_edildi,
        todo: by.baslanmadi,
      }),
      danger: false,
      to: tasksLocation(),
      bar: [
        { tone: 'todo', width: share(by.baslanmadi) },
        { tone: 'doing', width: share(by.devam_ediyor) },
        { tone: 'review', width: share(by.onaya_sunuldu) },
        { tone: 'back', width: share(by.iade_edildi) },
      ],
    },
    {
      key: 'overdue',
      icon: 'alert',
      value: c.overdue,
      note:
        open === 0
          ? homeText('home.u1.summary.noOpen')
          : homeText('home.u1.summary.overdueNote', { q, suffix: possessiveSuffix(q) }),
      danger: true,
      to: tasksLocation('geciken'),
      bar: [{ tone: 'late', width: q }],
    },
    {
      key: 'pending',
      icon: 'clock',
      value: by.onaya_sunuldu,
      note: homeText('home.u1.summary.pendingNote'),
      danger: false,
      to: tasksLocation('onaya_sunuldu'),
      bar: [{ tone: 'review', width: share(by.onaya_sunuldu) }],
    },
    {
      key: 'returned',
      icon: 'undo',
      value: by.iade_edildi,
      note: homeText('home.u1.summary.returnedNote'),
      danger: false,
      to: tasksLocation('iade_edildi'),
      bar: [{ tone: 'back', width: share(by.iade_edildi) }],
    },
  ]
})
</script>

<template>
  <div class="rh-top" data-region="summary">
    <UiErrorState
      v-if="error"
      :error="error"
      :title="homeText('home.k1.error')"
      retryable
      :retrying="retrying"
      @retry="emit('retry')"
    />
    <section
      v-else
      class="rh-sums"
      :aria-label="homeText('home.u1.summary.region')"
      :aria-busy="loading || !counts ? 'true' : undefined"
    >
      <template v-if="counts && !loading">
        <RouterLink
          v-for="card in cards"
          :key="card.key"
          class="t-card rh-sum"
          :to="card.to"
          :data-cell="card.key"
        >
          <span class="rh-top-row">
            <span class="rh-kicker">{{ homeText(`home.u1.summary.${card.key}`) }}</span>
            <UiIcon :name="card.icon" size="sm" />
          </span>
          <span
            class="rh-num rh-sum__value"
            :class="{ 'rh-sum__value--danger': card.danger }"
            data-value
          >
            {{ card.value }}
          </span>
          <span class="rh-bar" aria-hidden="true">
            <BarSeg v-for="(seg, i) in card.bar" :key="i" :tone="seg.tone" :width="seg.width" />
          </span>
          <span class="rh-cap rh-trunc">{{ card.note }}</span>
        </RouterLink>
      </template>
      <template v-else>
        <div v-for="n in 4" :key="n" class="t-card rh-sum" data-skeleton>
          <span class="rh-skel" />
          <span class="rh-skel rh-skel--num" />
        </div>
      </template>
    </section>
  </div>
</template>
