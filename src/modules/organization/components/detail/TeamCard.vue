<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { toApiError } from '@/shared/errors/api-error'
import { UiAvatar, UiButton, UiCount, UiErrorState } from '@/shared/ui'

import type { useDepartmentRoster } from '../../api'
import { userLocation } from '../../routes'
import { teamTiles, type WorkSet } from './detail-model'
import { detailText } from './messages'

/**
 * Ekip (E-08-78…81): "Ekip ‹N›" (`listMembers` etkin satırlar, koordinatör dahil); "Üye ekle"
 * (W74 `MemberAddDialog`, `assignMembership` yetkisi); "Tüm üyeler" → Üyeler sekmesi; ilk 6
 * kutucuk (koordinatörler önce, sonra ad), ad → 05b, "Koordinatör" rozeti, "‹N› açık iş" tek
 * birim görev listesinden (sonuna dek yüklenmediyse yaklaşık notu). Alt birim etiketi çizilmez.
 */
const props = defineProps<{
  roster: ReturnType<typeof useDepartmentRoster>
  work: WorkSet
  canAddMember: boolean
}>()
const emit = defineEmits<{ addMember: []; all: [] }>()

const ready = computed(() => props.roster.query.data.value !== undefined)
const error = computed(() =>
  props.roster.query.isError.value ? toApiError(props.roster.query.error.value) : null,
)
const tiles = computed(() => teamTiles(props.roster.active.value, props.work.items))
</script>

<template>
  <section class="t-card cd-card" aria-labelledby="cd-team-title" data-card="team">
    <div class="rp-cardhead cd-cardhead">
      <h2 id="cd-team-title" class="rp-cardtitle">
        {{ detailText('organization.coordinatorship.team.title') }}
        <UiCount v-if="ready" :value="roster.active.value.length" data-testid="cd-team-count" />
      </h2>
      <span class="cd-cardhead__actions">
        <UiButton
          v-if="canAddMember"
          size="sm"
          icon="user-plus"
          data-action="team-add"
          @click="emit('addMember')"
        >
          {{ detailText('organization.coordinatorship.team.add') }}
        </UiButton>
        <UiButton size="sm" variant="ghost" data-action="team-all" @click="emit('all')">
          {{ detailText('organization.coordinatorship.team.all') }}
        </UiButton>
      </span>
    </div>
    <UiErrorState
      v-if="error"
      :error="error"
      :title="detailText('organization.coordinatorship.team.error')"
      retryable
      :retrying="roster.query.isFetching.value"
      @retry="roster.query.refetch()"
    />
    <p v-else-if="ready && tiles.length === 0" class="rp-cap" data-testid="cd-team-empty">
      {{ detailText('organization.coordinatorship.team.empty') }}
    </p>
    <div v-else class="cd-team" :aria-busy="ready ? undefined : 'true'">
      <div v-for="tile in tiles" :key="tile.accountId" class="cd-tile" data-tile>
        <UiAvatar :name="tile.name" />
        <span class="cd-tile__text">
          <RouterLink class="rp-title rp-trunc cd-tile__name" :to="userLocation(tile.accountId)">
            {{ tile.name }}
          </RouterLink>
          <span class="rp-cap rp-trunc" data-open>
            {{ detailText('organization.coordinatorship.team.open', { n: tile.open }) }}
          </span>
        </span>
        <span v-if="tile.coordinator" class="t-badge cd-badge" data-lead>
          {{ detailText('organization.coordinatorship.team.coordinator') }}
        </span>
      </div>
    </div>
    <p v-if="ready && !work.complete && tiles.length > 0" class="rp-cap" data-team-partial>
      {{ detailText('organization.coordinatorship.team.loaded') }}
    </p>
    <p v-if="roster.truncated.value" class="rp-cap" data-team-truncated>
      {{ detailText('organization.coordinatorship.team.truncated') }}
    </p>
  </section>
</template>
