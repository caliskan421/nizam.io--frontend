<script setup lang="ts">
import { computed, useId } from 'vue'
import { RouterLink } from 'vue-router'

import { USERS_ROUTE } from '@/modules/organization/public'
import type { ApiError } from '@/shared/errors/api-error'
import { UiErrorState, UiIcon } from '@/shared/ui'

import { homeText } from '../model/messages'
import { ROLE_CARDS, teamFacts } from '../model/team'
import type { DashboardReport } from '../model/types'

/**
 * Ekip şeridi (E-01-19/20; `Main.dc.html` "ekip"): toplam kullanıcı + koordinatörlük ve üç rol
 * kartı. Sayılar `reportDashboard` alanlarıdır, istemci toplamaz: `total_admins` şirket geneli,
 * diğerleri program kapsamlıdır ve bir hesap birden çok rolde sayılır — bu `title` ipucuyla
 * söylenir (REPORTING-K02). Rol kartı 05'i `rol` sekmesi süzgeciyle açar. Bölge bağımsız yüklenir:
 * iskelet → hata + "Yeniden dene" (sayfa düşmez).
 */
const props = withDefaults(
  defineProps<{
    report: DashboardReport | null
    error?: Pick<ApiError, 'messageKey' | 'requestId'> | null
    retrying?: boolean
  }>(),
  { error: null, retrying: false },
)
const emit = defineEmits<{ retry: [] }>()

const titleId = `home-team-${useId()}`
const facts = computed(() => (props.report ? teamFacts(props.report) : null))
const hint = homeText('home.team.hint')
</script>

<template>
  <UiErrorState
    v-if="error"
    :error="error"
    :title="homeText('home.team.error')"
    retryable
    :retrying="retrying"
    data-region="team"
    @retry="emit('retry')"
  />
  <section
    v-else
    class="t-card home-team"
    :aria-labelledby="titleId"
    :aria-busy="facts ? undefined : 'true'"
    data-region="team"
  >
    <div class="home-team__lead">
      <h2 :id="titleId" class="rp-kicker">{{ homeText('home.team.title') }}</h2>
      <span v-if="facts" class="home-team__count" :title="hint" data-team-summary>
        <span class="rp-num home-team__num" data-team-users>{{ facts.users }}</span>
        <span class="rp-cap rp-trunc">
          {{ homeText('home.team.users', { n: facts.coordinatorships }) }}
        </span>
      </span>
      <span v-else class="home-skel home-skel--num" aria-hidden="true" />
    </div>
    <div class="home-team__roles" role="group" :aria-label="homeText('home.team.roles')">
      <template v-if="facts">
        <RouterLink
          v-for="role in ROLE_CARDS"
          :key="role.key"
          :to="{ path: USERS_ROUTE.path, query: { rol: role.tab } }"
          class="rp-cardbtn home-role"
          :title="role.key === 'admin' ? hint : undefined"
          :aria-label="
            homeText('home.team.roleLink', {
              label: homeText(`home.team.${role.key}`),
              n: role.count(facts),
            })
          "
          :data-role="role.tab"
        >
          <span class="rp-ichip" aria-hidden="true"><UiIcon :name="role.icon" size="sm" /></span>
          <span class="home-role__text">
            <span class="rp-num home-role__num">{{ role.count(facts) }}</span>
            <span class="rp-cap rp-trunc">{{ homeText(`home.team.${role.key}`) }}</span>
          </span>
          <span class="home-role__go"><UiIcon name="arrow-right" size="sm" /></span>
        </RouterLink>
      </template>
      <template v-else>
        <span
          v-for="n in 3"
          :key="n"
          class="home-role home-skel"
          aria-hidden="true"
          data-team-skeleton
        />
      </template>
    </div>
  </section>
</template>
