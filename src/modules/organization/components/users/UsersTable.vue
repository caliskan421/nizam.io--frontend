<script setup lang="ts">
import './users.css'

import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { designStub } from '@/shared/design-stub'
import { UiButton, UiEmptyState, UiErrorState } from '@/shared/ui'

import { USERS_ROUTE } from '../../routes'
import type { UsersTableEmits, UsersTableProps } from '../index'
import { usersText } from './messages'
import { injectUsersView, useUsersView } from './use-users-view'
import UserRow from './UserRow.vue'

/**
 * W75 · E-05-09…24 — kullanıcı tablosu (`rp-dtable`). Veri sayfanın görünümünden (yoksa kendi
 * örneği): `listUsers` ya da tek birimin `listMembers`'ı. Sıralama yalnız ada göre ↑/↓
 * (`aria-sort`; yön değişince yeni sorgu, eski imleç kullanılmaz — E-05-10). Tümünü seç ve satır
 * kutuları gizli (P7). Numaralı sayfalayıcı, "‹a›–‹b› / ‹N›" ve sayfa boyutu yok (BE-011, P4):
 * yüklenen sayı + "Daha fazla yükle" (imleç bitince gizli). Yükleniyor → iskelet satırlar.
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
const caption = computed(() => {
  const n = view.source.value.length
  if (view.complete.value) return usersText('users.pager.complete', { n })
  const loaded = designStub('BE-011', usersText('users.pager.partial', { n }))
  return `${loaded} · ${usersText('users.partial')}`
})
</script>

<template>
  <div class="users-table">
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
            <span role="columnheader" class="users-row__pick" />
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
    <p v-if="view.truncated.value" class="rp-cap users-note--warn" data-testid="users-truncated">
      {{ usersText('users.table.truncated') }}
    </p>
    <p v-if="!view.rosterMode.value" class="rp-cap users-note" data-testid="users-no-team">
      {{ usersText('users.table.noTeam') }}
    </p>
  </div>
</template>
