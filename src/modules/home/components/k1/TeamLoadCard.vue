<script setup lang="ts">
import { computed } from 'vue'

import type { ApiError } from '@/shared/errors/api-error'
import { UiAvatar, UiCount } from '@/shared/ui'

import { homeText } from '../../model/messages'
import type { RoleLoadScope } from '../../model/role/common'
import type { LoadRow } from '../../model/k1/team'
import BarSeg from './BarSeg.vue'
import RegionBody from './RegionBody.vue'
import ScopeNote from './ScopeNote.vue'

/**
 * "Ekip yükü ‹n›" (E-K1-26…28): `listMembers` (tek istek) ⋈ yüklenen kümenin `assignees[]`
 * kırılımı. Çubuk ölçeği kişi başı 4 görev = %100 (tasarım sabiti); ad bağlantısı K5'e giderdi →
 * düz metin; "Ekibim →" F6 dışı (açıklamalı devre dışı, `designStub` yok — faz ertelemesi).
 */
const props = defineProps<{
  rows: readonly LoadRow[]
  /** Atanmış açık görev sayısı (yüklenen küme). */
  assigned: number
  partial?: boolean
  /** Kısmi yükleme (`null` = tam): kişi başı sayılar "≥" + "ilk N görev" etiketi. */
  scope?: RoleLoadScope | null
  loaded?: number
  loading?: boolean
  error?: Pick<ApiError, 'messageKey' | 'requestId'> | null
  retrying?: boolean
}>()
const emit = defineEmits<{ retry: [] }>()

const approx = computed(() => props.partial === true || props.scope != null)
const LEGEND = ['doing', 'review', 'late', 'back'] as const
</script>

<template>
  <section class="t-card rh-card" data-region="team" aria-labelledby="k1-load-title">
    <div class="rh-cardhead">
      <h2 id="k1-load-title" class="rh-cardtitle">
        {{ homeText('home.k1.team.title') }}
        <UiCount :value="rows.length" />
      </h2>
      <span
        class="rh-link"
        aria-disabled="true"
        :title="homeText('home.k1.later')"
        data-testid="k1-team-link"
      >
        {{ homeText('home.k1.team.link') }}
      </span>
    </div>
    <div class="rh-top-row">
      <p class="rh-note">
        {{ homeText('home.k1.team.note', { n: approx ? `≥${assigned}` : assigned }) }}
      </p>
      <span class="rh-legend rh-cap" aria-hidden="true">
        <span v-for="key in LEGEND" :key="key">
          <span class="rh-dot" :class="`rh-dot--${key}`" />
          {{ homeText(`home.k1.team.legend.${key}`) }}
        </span>
      </span>
    </div>
    <ScopeNote v-if="scope" compact :scope="scope" :loaded="loaded ?? 0" />
    <RegionBody
      :loading="loading"
      :error="error"
      :retrying="retrying"
      :empty="rows.length === 0 ? homeText('home.k1.team.empty') : null"
      @retry="emit('retry')"
    >
      <div v-for="row in rows" :key="row.member.accountId" class="rh-row rh-row--load" data-row>
        <UiAvatar :name="row.member.fullName" />
        <span class="rh-line">
          <span class="rh-title" data-name>{{ row.member.fullName }}</span>
          <span class="rh-role">{{
            row.member.coordinator
              ? homeText('home.k1.team.coordinator')
              : homeText('home.k1.team.member')
          }}</span>
          <span v-if="row.me" class="rh-me">{{ homeText('home.k1.team.me') }}</span>
        </span>
        <span
          class="rh-bar rh-bar--thick rh-hide"
          :title="
            homeText('home.k1.team.tip', {
              doing: row.doing,
              review: row.review,
              late: row.late,
              back: row.back,
            })
          "
        >
          <BarSeg tone="doing" :width="row.widths.doing" />
          <BarSeg tone="review" :width="row.widths.review" />
          <BarSeg tone="late" :width="row.widths.late" />
          <BarSeg tone="back" :width="row.widths.back" />
        </span>
        <span class="rh-cap" data-open>
          <b>{{ homeText('home.k1.team.open', { n: approx ? `≥${row.open}` : row.open }) }}</b>
          <template v-if="row.late > 0">
            ·
            <span class="rh-danger">{{ homeText('home.k1.team.late', { n: row.late }) }}</span>
          </template>
        </span>
      </div>
    </RegionBody>
  </section>
</template>
