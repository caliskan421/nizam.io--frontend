<script setup lang="ts">
import './coordinatorships.css'

import { computed, useId } from 'vue'
import { RouterLink } from 'vue-router'

import { UiButton } from '@/shared/ui'

import { coordinatorshipLocation } from '../../routes'
import type { CoordinatorshipCardEmits, CoordinatorshipCardProps } from '../index'
import CardMenu from './CardMenu.vue'
import { codeBadge, flagOf, leadsOf } from './card-view'
import { coordsText } from './messages'
import { injectCardActions } from './use-card-actions'

/**
 * 08 koordinatörlük kartı (`rp-ccard`; E-08-27…38). Veri yalnız `item`'dan (`listProgramDepartments`
 * ⋈ rapor satırı); rapor satırı yoksa sayılar "—". Seçim kutusu gizli (E-08-31, P7). Ad ve
 * üye/görev sayıları 08b'ye gezinir (E-08-29/34/35); arşiv hücresi F5'e kadar devre dışı (E-08-36).
 * "Koordinatör ata" yalnız koordinatörsüz kartta ve yetkide (E-08-33). Durum bayrağı
 * koordinatörsüz > sessiz > normal (E-08-37); "dosya" metni yazılmaz (BE-018).
 */
const props = defineProps<CoordinatorshipCardProps>()
const emit = defineEmits<CoordinatorshipCardEmits>()

const actions = injectCardActions()
const titleId = `coords-card-${useId()}`

const id = computed(() => props.item.departmentId)
const badge = computed(() => codeBadge(props.item))
const description = computed(() => props.item.stat?.description?.trim() || null)
const leads = computed(() => leadsOf(props.item))
const noLead = computed(() => props.item.stat !== null && props.item.stat.coordinators.length === 0)
const flag = computed(() => flagOf(props.item, Date.now()))
const members = computed(() => props.item.stat?.member_count ?? '—')
const tasks = computed(() => props.item.stat?.total_tasks ?? '—')
const name = computed(() => props.item.displayName)
</script>

<template>
  <article class="rp-ccard" :aria-labelledby="titleId" :data-department="id">
    <div class="coords-card__head">
      <span class="rp-code" data-testid="code">{{ badge }}</span>
      <span class="coords-card__name">
        <RouterLink
          :id="titleId"
          class="rp-linkbtn rp-title rp-trunc"
          :to="coordinatorshipLocation(id)"
        >
          {{ name }}
        </RouterLink>
        <span v-if="description" class="rp-cap rp-trunc" data-testid="description">
          {{ description }}
        </span>
      </span>
    </div>
    <div class="coords-card__leads">
      <template v-if="leads">
        <span class="rp-avstack">
          <span
            v-for="lead in leads.avatars"
            :key="lead.accountId"
            class="rp-av rp-av--sm rp-tip"
            role="img"
            tabindex="0"
            :aria-label="lead.fullName"
            :data-tip="lead.fullName"
          >
            {{ lead.initials }}
          </span>
        </span>
        <span class="rp-cap rp-trunc" data-testid="lead-line">{{ leads.line }}</span>
      </template>
      <UiButton
        v-else-if="noLead && actions.assignCoordinator"
        class="coords-assign"
        variant="ghost"
        size="sm"
        icon="plus"
        @click="emit('assignCoordinator', id)"
      >
        {{ coordsText('coordinatorships.card.assign') }}
      </UiButton>
    </div>
    <div class="rp-ccard__stats">
      <RouterLink
        class="coords-stat"
        :to="coordinatorshipLocation(id, 'uyeler')"
        :aria-label="coordsText('coordinatorships.card.membersLink', { name, n: members })"
      >
        <span class="rp-kicker">{{ coordsText('coordinatorships.card.members') }}</span>
        <span class="rp-num" data-testid="members">{{ members }}</span>
      </RouterLink>
      <RouterLink
        class="coords-stat"
        :to="coordinatorshipLocation(id, 'gorevler')"
        :aria-label="coordsText('coordinatorships.card.tasksLink', { name, n: tasks })"
      >
        <span class="rp-kicker">{{ coordsText('coordinatorships.card.tasks') }}</span>
        <span class="rp-num" data-testid="tasks">{{ tasks }}</span>
      </RouterLink>
      <button
        class="coords-stat coords-stat--off"
        type="button"
        aria-disabled="true"
        data-testid="archive"
        :title="coordsText('coordinatorships.card.archivePhase')"
      >
        <span class="rp-kicker">{{ coordsText('coordinatorships.card.archive') }}</span>
        <span class="rp-num">—</span>
      </button>
    </div>
    <div class="coords-card__foot">
      <span
        class="rp-status rp-trunc"
        :class="`coords-flag--${flag.tone}`"
        :data-flag="flag.kind"
        data-testid="flag"
      >
        <span class="rp-dot" aria-hidden="true" />{{ flag.text }}
      </span>
      <CardMenu
        :department-id="id"
        :name="name"
        :can-edit="actions.editDepartment"
        :can-create-task="actions.createTask"
        @create-task="emit('createTask', $event)"
      />
    </div>
  </article>
</template>
