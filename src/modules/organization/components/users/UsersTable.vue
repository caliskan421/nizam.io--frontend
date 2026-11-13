<script setup lang="ts">
import './users.css'

import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { UiButton, UiCheck, UiEmptyState, UiErrorState } from '@/shared/ui'

import { USERS_ROUTE } from '../../routes'
import type { UsersTableEmits, UsersTableProps } from '../index'
import { usersText } from './messages'
import { injectUsersView, useUsersView } from './use-users-view'
import { injectWorkloadSelection, workloadText } from './use-workload-selection'
import UserRow from './UserRow.vue'
import WorkloadSelectionBar from './WorkloadSelectionBar.vue'

/**
 * W75 · E-05-09…24 — kullanıcı tablosu (`rp-dtable`). Veri sayfanın görünümünden (yoksa kendi
 * örneği): `listUsers` ya da tek birimin `listMembers`'ı. Sıralama yalnız ada göre ↑/↓
 * (`aria-sort`; yön değişince yeni sorgu, eski imleç kullanılmaz — E-05-10). Tümünü seç ve satır
 * kutuları yalnız iş yükü raporu seçiminde (şirket yöneticisi; E-13-60, `use-workload-selection`):
 * "Tümünü seç" yalnız yüklenmiş satırlardan seçilebilir olanları işaretler, ikinci basış
 * kaldırır. Numaralı sayfalayıcı ve sayfa boyutu yok (P4): alt satır "1–‹yüklenen› /
 * ‹toplam›" — toplam sunucu `total`'ı (BE-011, E-05-22) — ve "Daha fazla yükle" (imleç bitince
 * gizli). "Tümü" ekip satırsız hesapları da içerir (BE-045): "listelenmez" notu yoktur.
 * Yükleniyor → iskelet satırlar.
 */
const props = defineProps<UsersTableProps>()
const emit = defineEmits<UsersTableEmits>()

const SKELETON_ROWS = 10

const view =
  injectUsersView() ??
  useUsersView(() => ({
    roleTab: props.roleTab,
    search: props.search,
    departmentId: props.departmentId,
  }))

const selection = injectWorkloadSelection()
const root = ref<HTMLElement | null>(null)
const picking = computed(() => selection?.enabled.value === true)
const pickable = computed(() =>
  selection ? view.rows.value.filter((row) => selection.canPick(row)) : [],
)
const allPicked = computed(
  () =>
    pickable.value.length > 0 &&
    pickable.value.every((row) => selection?.isSelected(row.accountId)),
)
function pickAll(): void {
  selection?.setMany(
    pickable.value.map((row) => row.accountId),
    !allPicked.value,
  )
}
/** "Seçimi temizle" düğmesi kalkar: odak başlıktaki "Tümünü seç" kutusuna döner (KESİN 27). */
function focusPickAll(): void {
  root.value?.querySelector<HTMLElement>('[data-testid="users-pick-all"]')?.focus()
}

const ascending = computed(() => view.sortOrder.value === 'asc')
const filtered = computed(
  () => props.roleTab !== 'tumu' || props.search.trim() !== '' || props.departmentId !== null,
)
const isEmpty = computed(
  () =>
    !view.loading.value &&
    !view.loadError.value &&
    view.rows.value.length === 0 &&
    !view.hasMore.value,
)
const showPager = computed(
  () => !view.loading.value && !view.loadError.value && view.source.value.length > 0,
)
const caption = computed(() =>
  usersText('users.pager.range', {
    to: view.source.value.length,
    total: view.total.value ?? view.source.value.length,
  }),
)
</script>

<template>
  <div ref="root" class="users-table">
    <UiErrorState
      v-if="view.loadError.value"
      :error="view.loadError.value"
      :title="usersText('users.table.error')"
      retryable
      :retrying="view.retrying.value"
      @retry="view.retry"
    />
    <UiEmptyState
      v-else-if="isEmpty"
      :icon="filtered ? 'search' : 'users'"
      :title="usersText(filtered ? 'users.empty.filteredTitle' : 'users.empty.title')"
      :text="usersText(filtered ? 'users.empty.filteredText' : 'users.empty.text')"
    >
      <template v-if="filtered" #action>
        <RouterLink class="t-btn t-btn--secondary t-btn--sm" :to="{ name: USERS_ROUTE.name }">
          {{ usersText('users.empty.clear') }}
        </RouterLink>
      </template>
    </UiEmptyState>
    <div v-else class="rp-dtable">
      <div class="rp-scroll">
        <div
          role="table"
          class="users-grid"
          :aria-label="usersText('users.table.label')"
          :aria-busy="view.loading.value ? 'true' : undefined"
        >
          <div role="row" class="rp-tr rp-tr--head">
            <span role="columnheader" class="users-row__pick">
              <UiCheck
                v-if="picking"
                :model-value="allPicked"
                :label="workloadText('selectAll')"
                :disabled="pickable.length === 0"
                data-testid="users-pick-all"
                @update:model-value="pickAll"
              />
            </span>
            <span role="columnheader" :aria-sort="ascending ? 'ascending' : 'descending'">
              <button
                type="button"
                class="rp-sortbtn"
                :title="usersText('users.table.sortHint')"
                data-testid="users-sort"
                @click="view.toggleSort"
              >
                {{ usersText(ascending ? 'users.table.sortAsc' : 'users.table.sortDesc') }}
              </button>
            </span>
            <span role="columnheader">{{ usersText('users.table.roles') }}</span>
            <span role="columnheader">{{ usersText('users.table.coordinatorship') }}</span>
            <span role="columnheader">
              <span class="rp-sr">{{ usersText('users.table.detail') }}</span>
            </span>
          </div>
          <template v-if="view.loading.value">
            <div
              v-for="n in SKELETON_ROWS"
              :key="`skeleton-${n}`"
              role="row"
              class="rp-tr users-row--skeleton"
              :aria-label="n === 1 ? usersText('users.table.loading') : undefined"
              data-skeleton
            >
              <span v-for="c in 5" :key="c" role="cell"><span class="users-skel" /></span>
            </div>
          </template>
          <template v-else>
            <UserRow
              v-for="row in view.rows.value"
              :key="row.accountId"
              :row="row"
              :departments="view.departments.byId.value"
              :selected="row.accountId === selectedAccountId"
              @select="emit('select', row.accountId)"
            />
          </template>
        </div>
      </div>
    </div>
    <UiErrorState
      v-if="view.nextError.value"
      :error="view.nextError.value"
      retryable
      @retry="view.loadMore"
    />
    <div v-if="showPager" class="users-pager">
      <span class="rp-cap rp-trunc" data-testid="users-caption">{{ caption }}</span>
      <UiButton
        v-if="view.hasMore.value"
        size="sm"
        :disabled="view.loadingMore.value"
        data-testid="users-more"
        @click="view.loadMore"
      >
        {{ usersText(view.loadingMore.value ? 'users.pager.loadingMore' : 'users.pager.more') }}
      </UiButton>
      <span v-else aria-hidden="true" />
      <span aria-hidden="true" />
    </div>
    <WorkloadSelectionBar @cleared="focusPickAll" />
    <p v-if="view.truncated.value" class="rp-cap users-note--warn" data-testid="users-truncated">
      {{ usersText('users.table.truncated') }}
    </p>
  </div>
</template>
