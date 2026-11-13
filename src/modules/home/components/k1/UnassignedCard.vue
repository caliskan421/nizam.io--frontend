<script setup lang="ts">
import { RouterLink } from 'vue-router'

import type { ApiError } from '@/shared/errors/api-error'
import { DesignStub, UiButton, UiCount } from '@/shared/ui'

import { useRoleFacts } from '../../api/role/use-facts'
import { useRoleWrites } from './use-role-writes'
import { homeText } from '../../model/messages'
import type { WorkRow } from '../../model/role/common'
import { dueView } from '../../model/role/due'
import { taskLocation } from '../../model/role/links'
import RegionBody from './RegionBody.vue'

/**
 * "Atanmamış ‹n›" (E-K1-12, 19…22): açık ve `assignee_account_ids = []` satırları (yüklenen
 * kümeden istemci türetimi; küme tam değilse "≥", P4). "Ata" 03 panelini açar; "Üstlen"
 * `addAssignments` (kendi hesabım; başarıda satır listeden düşer — yeniden okuma). Kilit rozeti
 * gizli (BE-138); kod `—` (BE-005).
 */
const props = defineProps<{
  items: readonly WorkRow[]
  today: string
  partial?: boolean
  loading?: boolean
  error?: Pick<ApiError, 'messageKey' | 'requestId'> | null
  retrying?: boolean
}>()
const emit = defineEmits<{ retry: [] }>()

const facts = useRoleFacts()
const writes = useRoleWrites()

function claim(item: WorkRow): void {
  if (facts.me.value !== null) void writes.claim(item, facts.me.value)
}

const days = (item: WorkRow) => dueView(item, props.today)
</script>

<template>
  <section class="t-card rh-card" data-region="unassigned" aria-labelledby="k1-free-title">
    <div class="rh-cardhead">
      <h2 id="k1-free-title" class="rh-cardtitle">
        {{ homeText('home.k1.free.title') }}
        <UiCount
          :value="partial ? `≥${items.length}` : items.length"
          :title="partial ? homeText('home.k1.partial') : undefined"
        />
      </h2>
      <span class="rh-pill rh-pill--gold">{{ homeText('home.k1.free.badge') }}</span>
    </div>
    <p class="rh-note">{{ homeText('home.k1.free.note') }}</p>
    <RegionBody
      :loading="loading"
      :error="error"
      :retrying="retrying"
      :empty="items.length === 0 ? homeText('home.k1.free.empty') : null"
      @retry="emit('retry')"
    >
      <div v-for="item in items" :key="item.work_item_id" class="rh-row rh-row--free" data-row>
        <span class="rh-dot rh-dot--todo" aria-hidden="true" />
        <span class="rh-stack">
          <span class="rh-line">
            <RouterLink class="rh-title" :to="taskLocation(item.work_item_id)">
              {{ item.title }}
            </RouterLink>
            <DesignStub id="BE-005">
              <span class="rh-kicker">{{ homeText('home.k1.common.code') }}</span>
            </DesignStub>
          </span>
          <span class="rh-meta">
            <span class="rh-pill rh-pill--gold">{{ homeText('home.k1.free.tag') }}</span>
          </span>
        </span>
        <span class="rh-prio rh-hide" :class="`rh-prio--${item.priority}`">
          {{ homeText(`home.k1.common.priority.${item.priority}`) }}
        </span>
        <span class="rh-stack rh-hide">
          <span class="rh-mono">{{ days(item).date }}</span>
          <span class="rh-cap" :class="{ 'rh-danger': days(item).kind === 'late' }">
            {{
              days(item).kind === 'late'
                ? homeText('home.k1.common.late', { n: days(item).days })
                : days(item).kind === 'left'
                  ? homeText('home.k1.common.left', { n: days(item).days })
                  : ''
            }}
          </span>
        </span>
        <span class="rh-btns">
          <RouterLink
            v-if="facts.canAssign(item)"
            class="t-btn t-btn--secondary t-btn--sm"
            :to="taskLocation(item.work_item_id)"
            :aria-label="homeText('home.k1.free.assignLabel', { title: item.title })"
            data-action="assign"
          >
            {{ homeText('home.k1.free.assign') }}
          </RouterLink>
          <UiButton
            v-if="facts.canClaim(item)"
            variant="ghost"
            size="sm"
            :disabled="writes.pendingId.value === item.work_item_id"
            :aria-label="homeText('home.k1.free.claimLabel', { title: item.title })"
            data-action="claim"
            @click="claim(item)"
          >
            {{ homeText('home.k1.free.claim') }}
          </UiButton>
        </span>
      </div>
    </RegionBody>
  </section>
</template>
