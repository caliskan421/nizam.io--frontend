<script setup lang="ts">
import './users/users-page.css'

import { computed, ref } from 'vue'

import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import TemporaryPasswordDialog from '../components/forms/TemporaryPasswordDialog.vue'
import UserCreateDialog from '../components/forms/UserCreateDialog.vue'
import { useUser } from '../api'
import { usersText } from '../components/users/messages'
import { provideUsersView } from '../components/users/use-users-view'
import UserPanel from '../components/users/UserPanel.vue'
import UsersTable from '../components/users/UsersTable.vue'
import { can, organizationFacts } from '../model/capabilities'
import { usePanelReveal } from './users/use-panel-reveal'
import { useUsersUrl } from './users/use-users-url'
import UsersHead from './users/UsersHead.vue'
import UsersToolbar from './users/UsersToolbar.vue'

/**
 * 05 · Kullanıcılar (`/kullanicilar`, S1; W75). Yalnız yöneticide açılır (rota kapısı, P13).
 * Liste şirket geneli (`listUsers`; sayılar, rol sekmesi, arama ve koordinatörlük süzgeci
 * sunucuda — BE-011), koordinatörlük hücresi/çipler seçili programdan (#14). URL: `rol`, `q`, `koordinatorluk`, `secili` (K10). Yan panel yalnız seçili
 * kişi yüklenen kümedeyse açılır; değilse bilgi (E-05-21, BE-043). Kapsam değişince süzgeç,
 * panel ve açık diyaloglar kapanır; arama ve sekme korunur.
 */
const store = useScopeStore()
const { standing } = useStanding()
const creating = ref(false)
const passwordFor = ref<string | null>(null)
const aside = ref<HTMLElement | null>(null)
const { reveal } = usePanelReveal(aside)

const url = useUsersUrl(() => {
  creating.value = false
  passwordFor.value = null
})
const state = url.state

const view = provideUsersView(() => ({
  roleTab: state.value.tab,
  search: state.value.search,
  departmentId: state.value.department,
}))

const facts = computed(() => organizationFacts(standing.value, store.programId))
const canCreate = computed(() => store.programId !== null && can('createUser', facts.value))
// Alt başlık sayısı sunucu `total`'ıdır (süzgeçlere uyan hesaplar), yüklenen satır sayısı değil.
const summary = computed(() => {
  const n = view.total.value
  if (view.loading.value || n === null) return usersText('users.summary.loading')
  return usersText('users.summary.complete', { n })
})
// Derin bağlantı (E-05-21, BE-043): kişi yüklenen listede yoksa `readUser` ile tek istekte okunur.
const inView = computed(() => (state.value.selected ? view.rowFor(state.value.selected) : null))
const detail = useUser(
  () => state.value.selected,
  () => state.value.selected !== null && inView.value === null && !view.loading.value,
)
const panelId = computed(() =>
  inView.value || detail.user.value ? (state.value.selected ?? null) : null,
)
const selectedMissing = computed(
  () =>
    state.value.selected !== null &&
    panelId.value === null &&
    !view.loading.value &&
    !detail.query.isPending.value &&
    !detail.query.isFetching.value,
)

function select(accountId: string): void {
  void url.update({ selected: accountId }, 'push').then(() => reveal())
}

function closePanel(): void {
  void url.update({ selected: null }, 'push')
}

/** Kullanıcı oluşturuldu: kişi seçilir; ŞY'de ikinci adım "Geçici parola belirle" (E-05-05). */
function onCreated(accountId: string): void {
  select(accountId)
  if (can('setTemporaryPassword', facts.value)) passwordFor.value = accountId
}
</script>

<template>
  <section class="users-page" data-testid="users-page">
    <UsersHead :summary="summary" :can-create="canCreate" @create="creating = true" />
    <div class="rp-body">
      <UsersToolbar
        :tab="state.tab"
        :counts="view.counts.value"
        :search="state.search"
        :department="state.department"
        :departments="view.departments.departments.value"
        :departments-truncated="view.departments.truncated.value"
        :program-ready="store.programId !== null"
        @update:tab="url.update({ tab: $event })"
        @update:search="url.update({ search: $event })"
        @update:department="url.update({ department: $event, selected: null })"
      />
      <div class="rp-col">
        <p v-if="selectedMissing" class="rp-cap" role="status" data-testid="users-selected-missing">
          {{ usersText('users.deepLink.missing') }}
        </p>
        <UsersTable
          :role-tab="state.tab"
          :search="state.search"
          :department-id="state.department"
          :selected-account-id="panelId"
          @select="select"
        />
      </div>
      <aside
        v-if="panelId"
        ref="aside"
        class="rp-aside"
        tabindex="-1"
        :aria-label="usersText('users.panel.label')"
      >
        <UserPanel :key="panelId" :account-id="panelId" @close="closePanel" @deleted="closePanel" />
      </aside>
    </div>
    <UserCreateDialog
      v-if="canCreate"
      v-model:open="creating"
      :department-id="state.department"
      @created="onCreated"
    />
    <TemporaryPasswordDialog
      v-if="passwordFor"
      :open="true"
      :account-id="passwordFor"
      @update:open="passwordFor = $event ? passwordFor : null"
    />
  </section>
</template>
