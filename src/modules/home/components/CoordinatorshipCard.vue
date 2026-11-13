<script setup lang="ts">
import { computed, useId } from 'vue'
import { RouterLink } from 'vue-router'

import { ARCHIVE_FOLDER_ROUTE } from '@/modules/archive/public'
import { coordinatorshipLocation } from '@/modules/organization/public'
import { TASKS_ROUTE } from '@/modules/work/public'

import {
  approvalRemainder,
  completionPercent,
  initialsOf,
  statusBar,
  userCount,
  type CoordinatorshipStat,
} from '../model/coordinatorships'
import { homeText } from '../model/messages'
import { CARD_ARCHIVE_COUNT } from '../model/stubs'

/**
 * Koordinatörlük kartı (E-01-28…38; `Main.dc.html` `article.t-card`). Veri yalnız `stat`'tan
 * (`reportDashboard.coordinatorship_stats[]`): ad → 08b; koordinatörler; avatar yığını =
 * koordinatörler + "+N üye" (BE-079); görev toplamı + `%` bitti; çubuk 4 dilim — 4. dilim nötr
 * "onayda/iade" (BE-078); "geciken" → 03 süzgeci; "kullanıcı" = `member_count + coordinators.length`;
 * "arşiv" sayısı `—` (S3 başlığı yok, BE-072) ve 07 klasörüne gider; "Son yükleme" satırı yok
 * (BE-025). Dilim genişliği tek dinamik bağdır (`--home-seg-w`).
 */
const props = defineProps<{ stat: CoordinatorshipStat }>()
const titleId = `home-ccard-${useId()}`

const id = computed(() => props.stat.department_id)
const people = computed(() => props.stat.coordinators)
const lead = computed(
  () => people.value.map((p) => p.full_name).join(', ') || homeText('home.coords.card.noLead'),
)
const bar = computed(() => statusBar(props.stat))
const statusLine = computed(() =>
  homeText('home.coords.card.statusLine', {
    todo: props.stat.not_started_tasks,
    doing: props.stat.in_progress_tasks,
    review: approvalRemainder(props.stat),
    done: props.stat.completed_tasks,
  }),
)
const segments = computed(() =>
  (['todo', 'doing', 'review', 'done'] as const).map((key) => ({
    key,
    style: { '--home-seg-w': `${bar.value[key]}%` },
  })),
)
const lateTo = computed(() => ({
  name: TASKS_ROUTE.name,
  query: { koordinatorluk: id.value, durum: 'geciken' },
}))
const archiveTo = computed(() => ({
  name: ARCHIVE_FOLDER_ROUTE.name,
  params: { klasorId: id.value },
}))
const archiveCount = CARD_ARCHIVE_COUNT.available ? '' : '—'
</script>

<template>
  <article class="t-card home-ccard" :aria-labelledby="titleId" :data-department="id">
    <div class="home-ccard__head">
      <span class="home-ccard__name">
        <RouterLink
          :id="titleId"
          class="rp-linkbtn rp-title rp-trunc"
          :to="coordinatorshipLocation(id)"
        >
          {{ stat.name }}
        </RouterLink>
        <span class="rp-cap rp-trunc" data-testid="lead">{{ lead }}</span>
      </span>
      <span class="rp-avstack">
        <span
          v-for="person in people"
          :key="person.account_id"
          class="rp-av rp-av--sm rp-tip"
          role="img"
          tabindex="0"
          :aria-label="person.full_name"
          :data-tip="person.full_name"
        >
          {{ initialsOf(person.full_name) }}
        </span>
        <span v-if="stat.member_count > 0" class="home-more" data-testid="more">
          {{ homeText('home.coords.card.moreMembers', { n: stat.member_count }) }}
        </span>
      </span>
    </div>
    <div class="home-ccard__prog">
      <div class="home-ccard__row">
        <span class="home-ccard__total">
          <span class="rp-num home-ccard__num" data-testid="total">{{ stat.total_tasks }}</span>
          <span class="rp-cap">{{ homeText('home.coords.card.tasks') }}</span>
        </span>
        <span class="rp-mono" data-testid="pct">
          {{ homeText('home.coords.card.done', { p: completionPercent(stat) }) }}
        </span>
      </div>
      <span class="rp-bar" :title="statusLine" data-testid="bar">
        <span
          v-for="segment in segments"
          :key="segment.key"
          :class="`home-seg home-seg--${segment.key}`"
          :style="segment.style"
        />
      </span>
      <span class="rp-cap rp-trunc" data-testid="status-line">{{ statusLine }}</span>
    </div>
    <div class="home-ccard__stats">
      <RouterLink
        class="rp-statbtn"
        :to="lateTo"
        :aria-label="homeText('home.coords.card.lateLink', { name: stat.name })"
        data-stat="late"
      >
        <span class="rp-kicker">{{ homeText('home.coords.card.late') }}</span>
        <span
          class="rp-num home-ccard__stat-num"
          :class="{ 'rp-danger-text': stat.overdue_tasks > 0 }"
        >
          {{ stat.overdue_tasks }}
        </span>
      </RouterLink>
      <RouterLink
        class="rp-statbtn"
        :to="coordinatorshipLocation(id, 'uyeler')"
        :aria-label="homeText('home.coords.card.usersLink', { name: stat.name })"
        data-stat="users"
      >
        <span class="rp-kicker">{{ homeText('home.coords.card.users') }}</span>
        <span class="rp-num home-ccard__stat-num">{{ userCount(stat) }}</span>
      </RouterLink>
      <RouterLink
        class="rp-statbtn"
        :to="archiveTo"
        :aria-label="homeText('home.coords.card.archiveLink', { name: stat.name })"
        data-stat="archive"
      >
        <span class="rp-kicker">{{ homeText('home.coords.card.archive') }}</span>
        <span class="rp-num home-ccard__stat-num" data-testid="archive">{{ archiveCount }}</span>
      </RouterLink>
    </div>
  </article>
</template>
