<script setup lang="ts">
import './profile.css'

import { computed } from 'vue'

import ForcePasswordChange from '@/app/password/ForcePasswordChange.vue'
import { AuditFeed } from '@/modules/audit/public'
import { routeLocation } from '@/app/routes.catalog'
import { injectScopeLifecycle } from '@/app/shell/side/public'
import { toApiError } from '@/shared/errors/api-error'
import { useScopeStore } from '@/shared/scope/store'
import { UiAvatar, UiCard, UiErrorState } from '@/shared/ui'

import ProfileAdminSummary from './ProfileAdminSummary.vue'
import ProfileMeetings from './ProfileMeetings.vue'
import ProfileTaskQueue from './ProfileTaskQueue.vue'
import PushPreferences from './PushPreferences.vue'

const lifecycle = injectScopeLifecycle()
const scope = useScopeStore()
const standing = lifecycle.standing
const program = computed(() =>
  lifecycle.programs.value.find((item) => item.programId === scope.programId),
)
const roles = { admin: 'Yönetici', coordinator: 'Koordinatör', member: 'Üye' }
const memberships = computed(() =>
  (standing.value?.rows ?? []).filter((row) => row.programId === scope.programId),
)
const coordinated = lifecycle.departments
const roleReady = computed(() => {
  if (!program.value || lifecycle.status.value !== 'ready') return false
  switch (scope.lens) {
    case 'admin':
      return standing.value?.companyAdmin === true
    case 'coordinator':
      return lifecycle.facts.value.coordinator
    case 'member':
      return lifecycle.facts.value.member
    default:
      return false
  }
})
const profileTitle = computed(() => (scope.lens ? roles[scope.lens] : 'Hesap'))
</script>

<template>
  <div v-if="standing" class="profile-page">
    <div class="profile-hero">
      <UiAvatar :name="standing.fullName" />
      <div>
        <p class="rp-kicker">
          {{ profileTitle }}<template v-if="program"> · {{ program.name }}</template>
        </p>
        <h1>{{ standing.fullName }}</h1>
        <p>{{ standing.email }}</p>
      </div>
    </div>
    <div class="profile-columns">
      <div class="profile-column">
        <UiCard as="section" class="profile-card" aria-labelledby="profile-account-title">
          <h2 id="profile-account-title">Hesap</h2>
          <dl class="profile-details">
            <div>
              <dt>Ad soyad</dt>
              <dd>{{ standing.fullName }}</dd>
            </div>
            <div>
              <dt>E-posta</dt>
              <dd>{{ standing.email }}</dd>
            </div>
          </dl>
          <p class="rp-cap">Hesap bilgileriniz için yöneticinize başvurun.</p>
        </UiCard>
        <ForcePasswordChange embedded />
      </div>
      <div class="profile-column">
        <UiCard as="section" class="profile-card" aria-labelledby="profile-roles-title">
          <h2 id="profile-roles-title">Rollerim ve koordinatörlüklerim</h2>
          <p v-if="program">{{ program.name }}</p>
          <p v-if="standing.companyAdmin" class="profile-role">Şirket yöneticisi</p>
          <ul v-if="memberships.length" class="profile-list">
            <li v-for="row in memberships" :key="row.departmentId + ':' + row.role">
              <span>{{ row.displayName }}</span>
              <span class="profile-role">{{ roles[row.role] }}</span>
            </li>
          </ul>
          <p v-if="program && lifecycle.departmentsTruncated.value" class="rp-cap" role="status">
            Üyelik yanıtı sınırlı. Burada yalnızca dönen üyelikler gösteriliyor.
          </p>
          <p v-else-if="!memberships.length" class="rp-cap">
            {{
              program
                ? 'Bu programda koordinatörlük üyeliğiniz bulunmuyor.'
                : 'Bir program seçildiğinde üyelikleriniz burada görünür.'
            }}
          </p>
        </UiCard>
        <UiCard
          v-if="roleReady"
          as="section"
          class="profile-card"
          aria-labelledby="profile-role-title"
        >
          <template v-if="scope.lens === 'admin' && standing.companyAdmin">
            <h2 id="profile-role-title">Yönetim</h2>
            <ProfileAdminSummary />
            <ul class="profile-list">
              <li>
                <RouterLink :to="routeLocation('organization.coordinatorships', {})"
                  >Koordinatörlüklerin durumu</RouterLink
                >
              </li>
              <li>
                <RouterLink :to="routeLocation('auditHistory', {}, { yapan: standing.accountId })"
                  >Son yönetim işlemlerim</RouterLink
                >
              </li>
            </ul>
            <AuditFeed :subject="{ actor: [standing.accountId] }" />
          </template>
          <template v-else-if="scope.lens === 'coordinator'">
            <h2 id="profile-role-title">Koordinatörü olduğum birimler</h2>
            <ul class="profile-list">
              <li v-for="row in coordinated" :key="row.departmentId">
                <span>{{ row.displayName }}</span>
                <RouterLink
                  v-if="scope.departmentId === row.departmentId"
                  :to="routeLocation('work.tasks', {}, { durum: 'onaya_sunuldu' })"
                  >Onay bekleyen görevler</RouterLink
                >
              </li>
            </ul>
            <ProfileTaskQueue
              v-if="scope.departmentId && lifecycle.facts.value.coordinator"
              :key="scope.departmentId"
              :department="scope.departmentId"
            />
          </template>
          <template v-else>
            <h2 id="profile-role-title">Görevlerim</h2>
            <ProfileTaskQueue :account="standing.accountId" />
            <RouterLink
              :to="
                routeLocation('work.tasks', {}, { kisi: standing.accountId, sirala: 'bitis:artan' })
              "
              >Sıradaki işlerimi aç</RouterLink
            >
          </template>
        </UiCard>
        <ProfileMeetings v-if="roleReady && scope.lens === 'member'" />
        <PushPreferences />
      </div>
    </div>
  </div>
  <section v-else class="profile-page" aria-label="Profilim">
    <UiErrorState
      v-if="lifecycle.error.value"
      :error="toApiError(lifecycle.error.value)"
      retryable
      @retry="lifecycle.refreshStanding()"
    />
    <p v-else role="status">Profil bilgileri yükleniyor…</p>
  </section>
</template>
