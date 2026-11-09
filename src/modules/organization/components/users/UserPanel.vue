<script setup lang="ts">
import './panel.css'

import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { useScopeStore } from '@/shared/scope/store'
import { UiAvatar, UiIcon, UiIconButton } from '@/shared/ui'

import { useProgramDepartmentIndex, useUserList } from '../../api'
import { userLocation } from '../../routes'
import type { UserPanelEmits, UserPanelProps } from '../index'
import { usersText } from './messages'
import { injectUsersView } from './use-users-view'
import { useUserCacheIndex } from './use-user-cache'
import { panelSubline, ROLE_TEXT, rowFromUser } from './user-rows'
import UserAccountActions from './UserAccountActions.vue'
import UserChips from './UserChips.vue'
import UserRoleCards from './UserRoleCards.vue'
import UserTaskStrip from './UserTaskStrip.vue'

/**
 * W75 · E-05-25…38 — yan panel (05) ve 05b "Hesap ve roller" sekmesi (`embedded`, kapat yok).
 * Tekil kullanıcı okuma ucu yok (BE-043): kişi sayfanın görünümünden ya da önbellekteki
 * `listUsers` sayfalarından; gömülüyken bulunamazsa ilk liste sayfası okunur (yine yoksa bilgi).
 * Çipler ve hesap eylemleri anında, kendi onay/sonucuyla (P12); "Vazgeç"/"Kaydet" yok
 * (E-05-37/38). Görünürlük `capabilities.ts`; kendi hesabında yıkıcı eylem gizli.
 */
const props = withDefaults(defineProps<UserPanelProps>(), { embedded: false })
const emit = defineEmits<UserPanelEmits>()

const store = useScopeStore()
const view = injectUsersView()
const cache = useUserCacheIndex()
const index = useProgramDepartmentIndex()

const row = computed(() => {
  const fromView = view?.rowFor(props.accountId)
  if (fromView) return fromView
  const cached = cache.value.get(props.accountId)
  return cached ? rowFromUser(cached, store.programId) : null
})
// Gömülü (05b) ve önbellekte yoksa: varsayılan ilk liste sayfası (05 ile aynı anahtar).
const fallback = useUserList(
  { search: null, sortOrder: 'asc' },
  () => props.embedded && row.value === null,
)
const searching = computed(
  () => props.embedded && row.value === null && fallback.query.isPending.value,
)

const subline = computed(() => {
  if (!row.value) return ''
  const head = panelSubline(row.value, index.byId.value)
  if (!head) return usersText('users.panel.noTeam')
  const first = head.more > 0 ? `${head.first} +${head.more}` : head.first
  return `${first} · ${usersText(ROLE_TEXT[head.role])}`
})
</script>

<template>
  <section
    class="users-panel"
    :aria-label="usersText('users.panel.label')"
    :data-account="accountId"
    data-testid="user-panel"
  >
    <div class="users-panel__head">
      <UiAvatar class="users-panel__av" :name="row?.fullName ?? ''" size="lg" />
      <div class="users-panel__who">
        <h2 class="users-panel__name rp-trunc">{{ row?.fullName ?? '—' }}</h2>
        <p class="rp-cap rp-trunc" data-testid="panel-subline">{{ subline }}</p>
      </div>
      <UiIconButton
        v-if="!embedded"
        icon="close"
        :label="usersText('users.panel.close')"
        data-testid="panel-close"
        @click="emit('close')"
      />
    </div>
    <p v-if="!row && !searching" class="rp-cap" data-testid="panel-missing">
      {{ usersText('users.panel.missing') }}
    </p>
    <template v-if="row">
      <UserTaskStrip v-if="store.programId !== null" :account-id="accountId" />
      <RouterLink
        v-if="!embedded"
        class="t-btn t-btn--secondary t-btn--block users-panel__profile"
        :to="userLocation(accountId)"
        data-testid="panel-profile"
      >
        <span class="rp-trunc">{{ usersText('users.panel.profile') }}</span>
        <UiIcon name="arrow-right" size="sm" />
      </RouterLink>
      <UserRoleCards :labels="row.labels" />
      <UserChips :account-id="accountId" :labels="row.labels" />
      <hr class="rp-hairline" />
      <UserAccountActions
        :account-id="accountId"
        :name="row.fullName"
        @deleted="emit('deleted', $event)"
      />
    </template>
  </section>
</template>
